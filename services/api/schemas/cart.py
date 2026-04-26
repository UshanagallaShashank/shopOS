# Cart Pydantic schemas — request/response models
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from schemas.product import ProductResponse, ProductVariantResponse


class CartItemCreate(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int = Field(ge=1, description="Quantity must be at least 1")


class CartItemUpdate(BaseModel):
    quantity: int | None = Field(None, ge=0, description="Set to 0 to remove item")


class CartItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    org_id: UUID
    product_id: UUID
    variant_id: UUID | None
    quantity: int
    product: ProductResponse | None = None
    variant: ProductVariantResponse | None = None
    created_at: datetime

    class Config:
        from_attributes = True
