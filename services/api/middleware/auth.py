# Auth middleware — verifies Supabase JWT and loads the DB user
# Supabase signs JWTs with a secret — we verify locally, no network call needed
import jwt
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.user import User, UserRole
from utils.exceptions import ForbiddenError, UnauthorizedError
from utils.jwt_verify import verify_supabase_token

bearer = HTTPBearer()
logger = logging.getLogger(__name__)


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Verify the Supabase JWT token and load the user from the database.
    Supports both HS256 and ES256 tokens.
    """
    logger.info(f"Attempting to verify token: {token.credentials[:20]}...")
    
    try:
        # Verify the token using our utility
        payload = verify_supabase_token(
            token.credentials,
            settings.supabase_url,
            settings.supabase_jwt_secret
        )
        logger.info(f"Token verified successfully for sub: {payload.get('sub')}")
        
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        raise UnauthorizedError("Token has expired")
    except jwt.DecodeError as e:
        logger.error(f"Token decode error: {e}")
        raise UnauthorizedError(
            "Invalid token signature. Your SUPABASE_JWT_SECRET might be incorrect."
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token error: {e}")
        raise UnauthorizedError(f"Invalid token: {e}")

    # sub = Supabase user UUID — matches firebase_uid column (we reuse it)
    supabase_uid = payload.get("sub")
    if not supabase_uid:
        raise UnauthorizedError("Token missing subject")

    result = await db.execute(select(User).where(User.firebase_uid == supabase_uid))
    user = result.scalar_one_or_none()
    if not user:
        logger.error(f"User not found in DB for firebase_uid: {supabase_uid}")
        raise UnauthorizedError("User not registered in ShopOS. Please sign up first.")
    
    logger.info(f"User authenticated: {user.email} ({user.role})")
    return user


# Role guard factories — use as FastAPI dependencies
def require_role(*roles: UserRole):
    """Returns a dependency that raises 403 if user's role is not in roles."""
    async def check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError(f"Requires one of: {[r.value for r in roles]}")
        return user
    return check


# Convenience shortcuts
require_platform_admin = require_role(UserRole.platform_admin)
require_org_manager_or_above = require_role(UserRole.platform_admin, UserRole.orgs_manager)
require_org_admin_or_above = require_role(
    UserRole.platform_admin, UserRole.orgs_manager, UserRole.org_admin
)
