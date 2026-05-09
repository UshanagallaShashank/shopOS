# Auth service — all Supabase auth operations live here
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import Client

from config import settings
from models.user import User, UserRole
from schemas.auth import LoginRequest, SignupRequest, TokenResponse, ShopOSUserInfo
from utils.exceptions import ConflictError, ForbiddenError, UnauthorizedError


def _resolve_role(secret_key: str | None) -> UserRole:
    """Map secret key → role. No key = end_user."""
    if secret_key == settings.platform_admin_secret:
        return UserRole.platform_admin
    if secret_key == settings.org_admin_secret:
        return UserRole.org_admin
    return UserRole.end_user


async def _get_or_create_db_user(
    db: AsyncSession,
    supabase_uid: str,
    email: str | None,
    role: UserRole,
    org_id=None,
    phone: str | None = None,
) -> User:
    """Find existing DB user or create one. Safe to call on every login."""
    result = await db.execute(select(User).where(User.firebase_uid == supabase_uid))
    user = result.scalar_one_or_none()
    if user:
        return user

    user = User(firebase_uid=supabase_uid, email=email, phone=phone, role=role, org_id=org_id)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def signup(db: AsyncSession, supabase: Client, data: SignupRequest) -> TokenResponse:
    from services import sms_service, email_service

    role = _resolve_role(data.secret_key)

    if role == UserRole.org_admin and not data.org_id:
        raise ForbiddenError("org_admin signup requires an org_id")

    # Create Supabase auth user — raises if email already exists
    try:
        res = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,  # skip email confirmation for now
        })
    except Exception as e:
        raise ConflictError(str(e))

    supabase_uid = str(res.user.id)

    # Sign in immediately to get the access token
    session = supabase.auth.sign_in_with_password({
        "email": data.email,
        "password": data.password,
    })

    # Create ShopOS DB user with the resolved role + phone
    db_user = await _get_or_create_db_user(
        db, supabase_uid, data.email, role,
        org_id=data.org_id if role == UserRole.org_admin else None,
        phone=data.phone,
    )

    # Welcome notifications — fire and forget
    sms_service.welcome(db_user.phone, db_user.email)
    email_service.welcome(db_user.email, db_user.email)

    return TokenResponse(
        access_token=session.session.access_token,
        user=ShopOSUserInfo.model_validate(db_user),
    )


async def login(db: AsyncSession, supabase: Client, data: LoginRequest) -> TokenResponse:
    # Supabase handles password verification
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise UnauthorizedError("Invalid email or password")

    # Fetch or create the DB user - login should work even if user wasn't registered via our signup
    # This handles cases where users were created directly in Supabase
    db_user = await _get_or_create_db_user(
        db,
        supabase_uid=str(res.user.id),
        email=res.user.email,
        role=UserRole.end_user,  # default role for users not registered via our signup
    )

    return TokenResponse(
        access_token=res.session.access_token,
        user=ShopOSUserInfo.model_validate(db_user),
    )


def get_oauth_url(provider: str) -> str:
    """Build the Supabase OAuth URL for the given provider."""
    redirect = f"{settings.supabase_url}/auth/v1/authorize"
    callback = f"{settings.allowed_origins[0]}/auth/callback"
    return f"{redirect}?provider={provider}&redirect_to={callback}"


async def handle_oauth_callback(
    db: AsyncSession, supabase: Client, code: str
) -> dict:
    """Exchange OAuth code for session, register user in DB."""
    try:
        res = supabase.auth.exchange_code_for_session({"auth_code": code})
    except Exception as e:
        raise UnauthorizedError(f"OAuth callback failed: {e}")

    session = res.session
    db_user = await _get_or_create_db_user(
        db,
        supabase_uid=session.user.id,
        email=session.user.email,
        role=UserRole.end_user,  # OAuth users always start as end_user
    )

    return {"access_token": session.access_token, "user": db_user}
