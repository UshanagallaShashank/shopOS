# Pydantic schemas for User — used during registration and profile reads
import uuid
from datetime import datetime

from pydantic import BaseModel

from models.user import UserRole


class UserCreate(BaseModel):
    firebase_uid: str
    email: str | None = None
    phone: str | None = None
    role: UserRole = UserRole.end_user
    org_id: uuid.UUID | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: str | None
    phone: str | None
    role: UserRole
    org_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
