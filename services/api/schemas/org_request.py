# Pydantic schemas for OrgRequest
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from models.org_request import RequestStatus


class OrgRequestCreate(BaseModel):
    org_name: str
    org_slug: str
    plan: str = "starter"
    logo_url: str | None = None
    business_docs: str | None = None
    description: str | None = None
    reason: str | None = None

    @field_validator("org_slug")
    @classmethod
    def slug_lowercase(cls, v: str) -> str:
        return v.lower().replace(" ", "-")


class OrgRequestReview(BaseModel):
    status: RequestStatus  # approved or rejected


class OrgRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str | None = None  # Added user email
    org_name: str
    org_slug: str
    plan: str
    logo_url: str | None
    business_docs: str | None
    description: str | None
    reason: str | None
    status: RequestStatus
    reviewed_by: uuid.UUID | None
    created_org_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
