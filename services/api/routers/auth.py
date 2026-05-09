# Auth router — signup, login, OAuth redirect, OAuth callback, phone OTP
import re
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from schemas.auth import LoginRequest, SignupRequest, TokenResponse
from services import auth_service
from utils.exceptions import ConflictError, UnauthorizedError

router = APIRouter()


def _supabase_admin():
    """Admin client — uses service_role key. Fails clearly if key not set."""
    from supabase import create_client
    if not settings.supabase_service_key or settings.supabase_service_key == "your-service-role-key-here":
        raise ConflictError(
            "SUPABASE_SERVICE_KEY not configured. "
            "Get it from Supabase → Settings → API → service_role key."
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)


def _supabase_anon():
    """Anon client — used for login (no admin privileges needed)."""
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@router.post("/signup", response_model=TokenResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates Supabase auth user + ShopOS DB user in one call.
    secret_key in body determines role — blank = end_user.
    Role is set here and cannot be changed without admin approval.
    """
    return await auth_service.signup(db, _supabase_admin(), data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticates with Supabase, returns token + real ShopOS role."""
    return await auth_service.login(db, _supabase_anon(), data)


@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str):
    """Returns the Supabase OAuth URL — frontend redirects user there."""
    return {"url": auth_service.get_oauth_url(provider)}


@router.get("/callback")
async def oauth_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Supabase redirects here after OAuth — registers user, sends token to frontend."""
    token_data = await auth_service.handle_oauth_callback(db, _supabase_admin(), code)
    frontend = settings.allowed_origins[0]
    return RedirectResponse(f"{frontend}/auth/callback?token={token_data['access_token']}")


@router.post("/logout")
async def logout():
    """
    Logout endpoint - currently just confirms logout on server side.
    Token invalidation happens client-side by removing the token.
    In the future, this could blacklist tokens or revoke Supabase sessions.
    """
    return {"message": "Logged out successfully"}


# ── Phone OTP (via Supabase phone auth) ──────────────────────────────────────

def _normalise_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("+"):
        return "+" + digits
    if len(digits) == 10:
        return "+91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits
    if len(digits) == 11 and digits.startswith("0"):
        return "+91" + digits[1:]
    return "+" + digits


class PhoneOTPRequest(BaseModel):
    phone: str


class PhoneOTPVerify(BaseModel):
    phone: str
    token: str


@router.post("/phone/send-otp")
async def phone_send_otp(data: PhoneOTPRequest):
    """
    Send a one-time password to `phone` via Supabase phone auth.
    Supabase forwards the OTP through Twilio (configured in the Supabase dashboard).
    Returns 200 on success regardless of whether the phone is registered —
    do not leak whether a phone exists.
    """
    phone = _normalise_phone(data.phone)
    supabase = _supabase_anon()
    try:
        supabase.auth.sign_in_with_otp({"phone": phone})
    except Exception as exc:
        raise UnauthorizedError(f"Could not send OTP: {exc}")
    return {"message": "OTP sent"}


@router.post("/phone/verify", response_model=TokenResponse)
async def phone_verify_otp(data: PhoneOTPVerify, db: AsyncSession = Depends(get_db)):
    """
    Verify the OTP received via SMS. On success returns an access_token + user info
    identical to the email/password login response.
    """
    from models.user import User, UserRole
    from schemas.auth import ShopOSUserInfo
    from services.auth_service import _get_or_create_db_user

    phone = _normalise_phone(data.phone)
    supabase = _supabase_anon()
    try:
        res = supabase.auth.verify_otp({
            "phone": phone,
            "token": data.token,
            "type": "sms",
        })
    except Exception as exc:
        raise UnauthorizedError(f"Invalid or expired OTP: {exc}")

    session = res.session
    if not session:
        raise UnauthorizedError("OTP verification did not return a session")

    # First, check if a user with this phone number already exists
    result = await db.execute(select(User).where(User.phone == phone))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        # Update the firebase_uid to link this Supabase auth user to existing ShopOS user
        existing_user.firebase_uid = str(session.user.id)
        # Update email if it's missing and Supabase has one
        if not existing_user.email and session.user.email:
            existing_user.email = session.user.email
        await db.commit()
        await db.refresh(existing_user)
        db_user = existing_user
    else:
        # No existing user with this phone, create new one
        db_user = await _get_or_create_db_user(
            db,
            supabase_uid=str(session.user.id),
            email=session.user.email,
            role=UserRole.end_user,
            phone=phone,
        )

    return TokenResponse(
        access_token=session.access_token,
        user=ShopOSUserInfo.model_validate(db_user),
    )
