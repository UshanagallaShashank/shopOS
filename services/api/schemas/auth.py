# Auth request/response schemas
import re
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from models.user import UserRole


def _normalise_phone(raw: str) -> str:
    """
    Normalise to E.164. Accepts:
      9876543210      → +919876543210
      +919876543210   → +919876543210
      919876543210    → +919876543210
      +1-800-555-0100 → +18005550100
    """
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("+"):
        return "+" + digits          # already had country code
    if len(digits) == 10:
        return "+91" + digits        # bare 10-digit → assume India
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits          # 91XXXXXXXXXX
    if len(digits) == 11 and digits.startswith("0"):
        return "+91" + digits[1:]    # 0XXXXXXXXXX
    return "+" + digits              # best effort


class SignupRequest(BaseModel):
    email: str
    password: str
    phone: str                       # required — validated below
    secret_key: str | None = None    # determines role — blank = end_user
    org_id: uuid.UUID | None = None  # required only for org_admin

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 7:
            raise ValueError("Phone number is too short")
        return _normalise_phone(v)


class LoginRequest(BaseModel):
    email: str
    password: str


class ShopOSUserInfo(BaseModel):
    # Embedded in the token response so frontend knows role immediately
    id: uuid.UUID
    email: str | None
    phone: str | None
    role: UserRole
    org_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ShopOSUserInfo
