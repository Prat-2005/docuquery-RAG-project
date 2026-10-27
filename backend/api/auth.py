import hashlib
import logging
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import AuthToken, User
from backend.db.schemas import (
    ForgotPasswordRequest, ResetPasswordRequest, Token, UserLogin, UserRegister,
    UserResponse,
)
from backend.auth.security import hash_password, verify_password, create_access_token
from backend.auth.dependencies import get_current_user
from backend.services.email_service import (
    send_email_verification_email,
    send_password_reset_email,
)

try:
    from authlib.integrations.starlette_client import OAuth
except ImportError:
    OAuth = None


router = APIRouter(prefix="/auth", tags=["Authentication"])
verification_router = APIRouter(tags=["Authentication"])
logger = logging.getLogger(__name__)
_rate_limits: dict[str, deque[float]] = defaultdict(deque)
oauth = OAuth() if OAuth is not None else None
if oauth is not None and os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"):
    oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def _check_rate_limit(key: str, limit: int, window: int) -> bool:
    now = time.monotonic()
    requests = _rate_limits[key]
    while requests and now - requests[0] >= window:
        requests.popleft()
    if len(requests) >= limit:
        return False
    requests.append(now)
    return True


@router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
)
async def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    email = str(user_data.email).lower()
    existing_user = db.scalar(select(User).where(func.lower(User.email) == email))

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    db.query(AuthToken).filter(
        AuthToken.pending_email == email,
        AuthToken.token_type == "email_verification",
        AuthToken.used.is_(False),
    ).update({"used": True}, synchronize_session=False)

    raw_token = secrets.token_urlsafe(32)
    verification_token = AuthToken(
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        token_type="email_verification",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        pending_email=email,
        pending_name=user_data.name,
        pending_password_hash=hash_password(user_data.password),
    )
    try:
        db.add(verification_token)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:8000").rstrip("/")
    await send_email_verification_email(
        email, f"{base_url}/verify-auth-credentials?token={raw_token}"
    )
    return {
        "message": "Registration started. Check your email to verify your account."
    }


@router.post("/login", response_model=Token)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == user_data.email)
    )

    if user is None or not user.password_hash or not verify_password(
        user_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = str(request_data.email).lower()
    if not _check_rate_limit(f"forgot:{email}", 3, 3600):
        raise HTTPException(status_code=429, detail="Too many requests")

    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is not None:
        now = datetime.now(timezone.utc)
        db.query(AuthToken).filter(
            AuthToken.user_id == user.id,
            AuthToken.token_type == "password_reset",
            AuthToken.used.is_(False),
        ).update({"used": True}, synchronize_session=False)
        raw_token = secrets.token_urlsafe(32)
        reset_token = AuthToken(
            user_id=user.id,
            token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
            token_type="password_reset",
            expires_at=now + timedelta(minutes=15),
        )
        db.add(reset_token)
        db.commit()
        base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:8000").rstrip("/")
        await send_password_reset_email(
            email, f"{base_url}/reset-password?token={raw_token}"
        )
        logger.info("Password reset requested for an existing account")
    else:
        logger.info("Password reset requested for an unknown account")

    return {"message": "If the email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    request_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(request_data.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    reset_token = db.scalar(
        select(AuthToken).where(
            AuthToken.token_hash == token_hash,
            AuthToken.token_type == "password_reset",
            AuthToken.used.is_(False),
            AuthToken.expires_at > now,
        )
    )
    if reset_token is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.get(User, reset_token.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.password_hash = hash_password(request_data.new_password)
    reset_token.used = True
    db.commit()
    logger.info("Password reset completed")
    return {"message": "Password reset successfully"}


@router.get("/verify-auth-credentials")
@verification_router.get("/verify-auth-credentials", include_in_schema=False)
def verify_auth_credentials(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    auth_token = db.scalar(
        select(AuthToken).where(
            AuthToken.token_hash == token_hash,
            AuthToken.token_type == "email_verification",
            AuthToken.used.is_(False),
            AuthToken.expires_at > datetime.now(timezone.utc),
        )
    )
    if (
        auth_token is None
        or not auth_token.pending_email
        or not auth_token.pending_name
        or not auth_token.pending_password_hash
    ):
        return {"message": "Verification failed. The link is invalid or expired."}

    existing_user = db.scalar(
        select(User).where(func.lower(User.email) == auth_token.pending_email)
    )
    if existing_user is not None:
        auth_token.used = True
        db.commit()
        return {"message": "Verification failed. This email is already registered."}

    user = User(
        email=auth_token.pending_email,
        name=auth_token.pending_name,
        password_hash=auth_token.pending_password_hash,
    )
    db.add(user)
    auth_token.used = True
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"message": "Verification failed. This email is already registered."}

    logger.info("Registration email verified")
    return {
        "message": "Verification completed. You can now log in and close this page."
    }


@router.get("/google/login")
async def google_login(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(f"google:{client_ip}", 10, 60):
        raise HTTPException(status_code=429, detail="Too many requests")
    if oauth is None or not hasattr(oauth, "google"):
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    if oauth is None or not hasattr(oauth, "google"):
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            user_info = await oauth.google.userinfo(token=token)
        email = str(user_info["email"]).lower()
        google_id = str(user_info["sub"])
        google_name = user_info.get("name")
    except (KeyError, TypeError, ValueError, OSError) as exc:
        logger.error("Google OAuth token exchange failed: %s", type(exc).__name__)
        raise HTTPException(status_code=400, detail="Google authentication failed")

    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        user = User(
            name=str(google_name)[:120] if google_name else None,
            email=email,
            google_id=google_id,
            password_hash=None,
        )
        db.add(user)
    elif user.google_id and user.google_id != google_id:
        raise HTTPException(status_code=409, detail="Google account is linked elsewhere")
    else:
        user.google_id = google_id
    db.commit()
    access_token = create_access_token(str(user.id))
    base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:8000").rstrip("/")
    logger.info("Google OAuth login completed")
    return RedirectResponse(
        f"{base_url}/oauth/callback?token={access_token}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.post("/logout")
def logout_user(
    current_user: User = Depends(get_current_user),
):
    return {
        "message": "Logged out successfully"
    }