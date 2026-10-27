import logging
import os
import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from fastapi.concurrency import run_in_threadpool


logger = logging.getLogger(__name__)


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


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    sender = os.getenv("SMTP_FROM_EMAIL")
    if not sender:
        logger.error("Password reset email skipped: SMTP is not configured")
        return

    message = EmailMessage()
    message["Subject"] = "Reset your DocuQuery password"
    message["From"] = sender
    message["To"] = to_email
    message.set_content(
        "We received a request to reset your DocuQuery password.\n\n"
        f"Reset your password: {reset_url}\n\n"
        "This link expires in 15 minutes. If you did not request this, you can "
        "ignore this email."
    )
    message.add_alternative(
        "<p>We received a request to reset your DocuQuery password.</p>"
        f'<p><a href="{quote(reset_url, safe=":/?=&")}">Reset your password</a></p>'
        "<p>This link expires in 15 minutes. If you did not request this, you can "
        "ignore this email.</p>",
        subtype="html",
    )

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
    message.set_content(
        "Welcome to DocuQuery.\n\n"
        f"Verify your email address: {verification_url}\n\n"
        "This link expires in 15 minutes. If you did not create this account, "
        "you can ignore this email."
    )
    message.add_alternative(
        "<p>Welcome to DocuQuery.</p>"
        f'<p><a href="{quote(verification_url, safe=":/?=&")}">'
        "Verify your email address</a></p>"
        "<p>This link expires in 15 minutes. If you did not create this account, "
        "you can ignore this email.</p>",
        subtype="html",
    )

    try:
        await run_in_threadpool(_send_message, message)
    except (OSError, smtplib.SMTPException, ValueError, RuntimeError):
        logger.exception("Email verification delivery failed")
