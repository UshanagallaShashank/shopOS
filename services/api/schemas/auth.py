# Auth request/response schemas
import uuid
from datetime import datetime

from pydantic import BaseModel

from models.user import UserRole


class SignupRequest(BaseModel):
    email: str
    password: str
    secret_key: str | None = None   # determines role — blank = end_user
    org_id: uuid.UUID | None = None  # required only for org_admin


class LoginRequest(BaseModel):
    email: str
    password: str


class ShopOSUserInfo(BaseModel):
    # Embedded in the token response so frontend knows role immediately
    id: uuid.UUID
    email: str | None
    role: UserRole
    org_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ShopOSUserInfo
