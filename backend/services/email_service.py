import datetime
import html
import logging
import os
import smtplib
from string import Template
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import quote

from fastapi.concurrency import run_in_threadpool


logger = logging.getLogger(__name__)
EMAIL_TEMPLATE_PATH = Path(__file__).resolve().parent / "templates" / "transactional_email.html"


def _send_message(message: EmailMessage) -> None:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM_EMAIL")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not host or not sender:
        raise RuntimeError("SMTP_HOST and SMTP_FROM_EMAIL must be configured")

    if port == 465:
        with smtplib.SMTP_SSL(host, port) as server:
            if username and password:
                server.login(username, password)
            server.send_message(message)
        return

    with smtplib.SMTP(host, port) as server:
        if use_tls:
            server.starttls()
        if username and password:
            server.login(username, password)
        server.send_message(message)


def _attach_logo(html_part) -> bool:
    """Attaches the DocuQuery folded logo as an inline CID image if present on disk."""
    try:
        logo_path = Path(__file__).resolve().parents[2] / "design" / "logo" / "DocuQuery-Folded.png"
        if logo_path.exists():
            with open(logo_path, "rb") as f:
                logo_bytes = f.read()
            html_part.add_related(
                logo_bytes,
                maintype="image",
                subtype="png",
                cid="<docuquery_logo>",
            )
            return True
    except Exception:
        logger.warning("Could not attach inline DocuQuery logo to email", exc_info=True)
    return False


def _build_email_html(
    *,
    badge_text: str,
    badge_bg: str,
    badge_color: str,
    title: str,
    intro_p: str,
    action_url: str,
    button_label: str,
    notice_title: str,
    notice_text: str,
    secondary_note: str,
) -> str:
    quoted_url = quote(action_url, safe=":/?=&")
    current_year = datetime.datetime.now().year
    badge_class = (
        "badge-security"
        if badge_bg.lower() == "#fee2e2"
        else "badge-activation"
    )
    try:
        template = Template(EMAIL_TEMPLATE_PATH.read_text(encoding="utf-8"))
    except OSError as error:
        raise RuntimeError("Transactional email template could not be loaded") from error

    values = {
        "badge_class": badge_class,
        "badge_text": html.escape(badge_text),
        "title": html.escape(title),
        "intro_p": html.escape(intro_p),
        "quoted_url": html.escape(quoted_url, quote=True),
        "button_label": html.escape(button_label),
        "notice_title": html.escape(notice_title),
        "notice_text": html.escape(notice_text),
        "secondary_note": html.escape(secondary_note),
        "current_year": str(current_year),
    }
    return template.substitute(values)


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    sender = os.getenv("SMTP_FROM_EMAIL")
    if not sender:
        logger.error("Password reset email skipped: SMTP is not configured")
        return

    message = EmailMessage()
    message["Subject"] = "Reset your DocuQuery password"
    message["From"] = sender
    message["To"] = to_email

    # Plain text version for non-HTML email readers
    message.set_content(
        "DocuQuery AI - Password Reset Request\n\n"
        "We received a request to reset your DocuQuery password.\n\n"
        f"Reset your password by visiting this link:\n{reset_url}\n\n"
        "Security Notice:\n"
        "- This link expires in 15 minutes.\n"
        "- If you did not request this change, you can safely ignore this email.\n\n"
        "---\nDocuQuery AI - Document Intelligence Platform"
    )

    # Decorative HTML version
    html_content = _build_email_html(
        badge_text="Security Request",
        badge_bg="#fee2e2",
        badge_color="#b91c1c",
        title="Reset Your DocuQuery Password",
        intro_p="We received a request to reset the password for your DocuQuery AI account. Click the button below to choose a new password and regain access to your documents.",
        action_url=reset_url,
        button_label="Reset My Password",
        notice_title="Link Expires in 15 Minutes",
        notice_text="For your security, this password reset link is strictly time-limited and can only be used once.",
        secondary_note="If you did not request this password reset, no action is needed. Your account remains completely safe and your password has not been changed.",
    )
    message.add_alternative(html_content, subtype="html")

    # Attach the inline logo to the HTML part
    html_part = message.get_payload()[1]
    _attach_logo(html_part)

    try:
        await run_in_threadpool(_send_message, message)
    except (OSError, smtplib.SMTPException, ValueError, RuntimeError):
        logger.exception("Password reset email delivery failed")


async def send_email_verification_email(to_email: str, verification_url: str) -> None:
    sender = os.getenv("SMTP_FROM_EMAIL")
    if not sender:
        logger.error("Email verification skipped: SMTP is not configured")
        return

    message = EmailMessage()
    message["Subject"] = "Verify your DocuQuery account"
    message["From"] = sender
    message["To"] = to_email

    # Plain text version for non-HTML email readers
    message.set_content(
        "Welcome to DocuQuery AI!\n\n"
        "Thank you for registering. Please verify your email address to activate your account:\n"
        f"{verification_url}\n\n"
        "Important:\n"
        "- This verification link expires in 15 minutes.\n"
        "- If you did not create this account, you can safely ignore this email.\n\n"
        "---\nDocuQuery AI - Document Intelligence Platform"
    )

    # Decorative HTML version
    html_content = _build_email_html(
        badge_text="Account Activation",
        badge_bg="#e0e7ff",
        badge_color="#4338ca",
        title="Welcome to DocuQuery AI",
        intro_p="Thank you for joining DocuQuery AI. You are just one step away from asking questions and getting instant, accurate answers grounded in your documents with Retrieval-Augmented Generation.",
        action_url=verification_url,
        button_label="Verify Email Address",
        notice_title="Verification Link Expires in 15 Minutes",
        notice_text="Click the button above to confirm your email address and immediately start querying your documents.",
        secondary_note="If you did not create an account on DocuQuery AI, you can safely ignore this email and no account will be activated.",
    )
    message.add_alternative(html_content, subtype="html")

    # Attach the inline logo to the HTML part
    html_part = message.get_payload()[1]
    _attach_logo(html_part)

    try:
        await run_in_threadpool(_send_message, message)
    except (OSError, smtplib.SMTPException, ValueError, RuntimeError):
        logger.exception("Email verification delivery failed")
