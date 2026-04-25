# Org — one row per shop (Meena Boutique, Ravi Groceries, etc.)
import enum

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class PlanType(str, enum.Enum):
    starter = "starter"
    pro = "pro"
    enterprise = "enterprise"


class OrgStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    maintenance = "maintenance"  # browsable but checkout disabled


class Org(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "orgs"

    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[OrgStatus] = mapped_column(Enum(OrgStatus, name="org_status"), default=OrgStatus.active)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType, name="plan_type"), default=PlanType.starter)
    razorpay_sub_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Profile / branding fields
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo: Mapped[str | None] = mapped_column(Text, nullable=True)  # data URL
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
