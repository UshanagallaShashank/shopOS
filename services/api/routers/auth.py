# Auth router — signup, login, OAuth redirect, OAuth callback
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from schemas.auth import LoginRequest, SignupRequest, TokenResponse
from services import auth_service
from utils.exceptions import ConflictError

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
