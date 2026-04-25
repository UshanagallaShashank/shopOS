# OrgRequest — end user requests to create their own org and become org_admin
# Includes all the org details needed: name, slug, plan, logo, docs, etc.
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class OrgRequest(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "org_requests"

    # Who is requesting
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Org details they want to create
    org_name: Mapped[str] = mapped_column(String(200))
    org_slug: Mapped[str] = mapped_column(String(100))
    plan: Mapped[str] = mapped_column(String(20), default="starter")

    # Optional supporting info
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_docs: Mapped[str | None] = mapped_column(Text, nullable=True)  # URL to docs
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Review tracking
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status", create_type=True),
        default=RequestStatus.pending,
        index=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=True
    )
