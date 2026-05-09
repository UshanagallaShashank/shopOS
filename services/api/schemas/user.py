# Pydantic schemas for User
import re
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from models.user import UserRole


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


class UserSelfUpdate(BaseModel):
    """Schema for users updating their own profile."""
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) < 7:
            raise ValueError("Phone number is too short")
        return _normalise_phone(v)


class UserRegister(BaseModel):
    # Called after Supabase signup — registers the user in our DB
    # secret_key is optional — if provided and matches, grants elevated role
    email: str | None = None
    phone: str | None = None
    secret_key: str | None = None   # platform_admin or org_admin secret
    org_id: uuid.UUID | None = None  # required if registering as org_admin


class UserCreate(BaseModel):
    # Internal use — service layer creates users with this
    firebase_uid: str
    email: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.end_user
    org_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    # Admin updates — change role and/or org assignment
    role: UserRole | None = None
    org_id: uuid.UUID | None = None
    # Sentinel to explicitly clear org_id (set to None)
    clear_org: bool = False


class UserResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: str | None
    phone: str | None
    role: UserRole
    org_id: uuid.UUID | None
    accessible_org_ids: list[uuid.UUID] = []
    created_at: datetime

    model_config = {"from_attributes": True}
