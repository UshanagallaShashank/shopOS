# Pydantic schemas for Org — separate Create/Update/Response keeps the API clean
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from models.org import OrgStatus, PlanType


class OrgCreate(BaseModel):
    name: str
    slug: str
    plan: PlanType = PlanType.starter
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    logo: str | None = None
    category: str | None = None

    @field_validator("slug")
    @classmethod
    def slug_lowercase(cls, v: str) -> str:
        return v.lower().replace(" ", "-")


class OrgUpdate(BaseModel):
    name: str | None = None
    status: OrgStatus | None = None
    plan: PlanType | None = None
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    logo: str | None = None
    category: str | None = None
    ui_template: str | None = None
    primary_color: str | None = None


class OrgUIUpdate(BaseModel):
    ui_template: str | None = None
    primary_color: str | None = None


class OrgResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    status: OrgStatus
    plan: PlanType
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    logo: str | None = None
    category: str | None = None
    ui_template: str | None = None
    primary_color: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
