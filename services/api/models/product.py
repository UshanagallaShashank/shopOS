# Product — items listed on a shop storefront, always scoped to one org
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class Product(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "products"

    # Every product is owned by exactly one org — enforced at DB and service layer
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Ordered list of image URLs/data-URLs; index = display order
    images: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    
    # Product attributes
    weight: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # in kg
    dimensions: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "10x20x30 cm"
    material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Shipping
    shipping_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    free_shipping_threshold: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    estimated_delivery_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # SEO & metadata
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)  # ["summer", "casual"]
    meta_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
