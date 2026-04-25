# Pydantic schemas for Org — separate Create/Update/Response keeps the API clean
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from models.org import OrgStatus, PlanType


class OrgCreate(BaseModel):
    name: str
    slug: str
    plan: PlanType = PlanType.starter

    @field_validator("slug")
    @classmethod
    def slug_lowercase(cls, v: str) -> str:
        # Slug becomes part of the URL — force lowercase, replace spaces with dashes
        return v.lower().replace(" ", "-")


class OrgUpdate(BaseModel):
    # All fields optional — PATCH only updates what you send
    name: str | None = None
    status: OrgStatus | None = None
    plan: PlanType | None = None


class OrgResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    status: OrgStatus
    plan: PlanType
    created_at: datetime

    model_config = {"from_attributes": True}  # lets Pydantic read SQLAlchemy objects
