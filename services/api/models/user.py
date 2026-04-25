# User — covers all 4 roles: orgs_manager, platform_admin, org_admin, end_user
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class UserRole(str, enum.Enum):
    orgs_manager = "orgs_manager"
    platform_admin = "platform_admin"
    org_admin = "org_admin"
    end_user = "end_user"


class User(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "users"

    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.end_user)
    # null for orgs_manager/platform_admin — they span all orgs
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=True, index=True
    )
