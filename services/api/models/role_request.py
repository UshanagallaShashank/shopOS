# RoleRequest — a user asks to be promoted to orgs_manager
# platform_admin approves or rejects it
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class RoleRequest(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "role_requests"

    # Who is requesting
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    # What role they want — currently only orgs_manager is requestable
    requested_role: Mapped[str] = mapped_column(String(50))

    # Optional message from the user explaining why
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"),
        default=RequestStatus.pending,
    )

    # Who reviewed it (null until reviewed)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
