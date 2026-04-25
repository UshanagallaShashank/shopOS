# UserOrgAccess — many-to-many between users and orgs they can order from
# Distinct from user.org_id (primary org for org_admins).
# end_users/orgs_managers accumulate rows here for each org they can browse/order.
import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps


class UserOrgAccess(Timestamps, Base):
    __tablename__ = "user_org_access"
    __table_args__ = (UniqueConstraint("user_id", "org_id", name="uq_user_org_access"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id", ondelete="CASCADE"), index=True
    )
