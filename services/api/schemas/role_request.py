# Pydantic schemas for role requests
import uuid
from datetime import datetime

from pydantic import BaseModel

from models.role_request import RequestStatus


class RoleRequestCreate(BaseModel):
    # User submits this — just their reason, user_id comes from auth token
    reason: str | None = None


class RoleRequestReview(BaseModel):
    # Admin submits this to approve or reject
    status: RequestStatus  # "approved" or "rejected"


class RoleRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    requested_role: str
    reason: str | None
    status: RequestStatus
    reviewed_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
