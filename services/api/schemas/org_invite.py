# Pydantic schemas for OrgInvite
import uuid
from datetime import datetime

from pydantic import BaseModel


class OrgInviteCreate(BaseModel):
    org_id: uuid.UUID
    email: str | None = None  # optional — restrict to specific email


class OrgInviteResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    code: str
    email: str | None
    created_by: uuid.UUID
    redeemed_by: uuid.UUID | None
    redeemed_at: datetime | None
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgInviteRedeem(BaseModel):
    code: str  # the invite code entered at signup
