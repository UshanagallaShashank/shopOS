# Product Variants — colors, sizes, SKUs for products
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class ProductVariant(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    price_adjustment: Mapped[float] = mapped_column(Numeric(10, 2), default=0)  # +/- from base price
    stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Variant-specific image
