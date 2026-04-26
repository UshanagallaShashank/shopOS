# Pydantic schemas for Product CRUD
import uuid
from datetime import datetime

from pydantic import BaseModel


class ProductVariantCreate(BaseModel):
    sku: str | None = None
    color: str | None = None
    size: str | None = None
    price_adjustment: float = 0
    stock: int = 0
    image_url: str | None = None


class ProductVariantUpdate(BaseModel):
    sku: str | None = None
    color: str | None = None
    size: str | None = None
    price_adjustment: float | None = None
    stock: int | None = None
    is_active: bool | None = None
    image_url: str | None = None


class ProductVariantResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    sku: str | None
    color: str | None
    size: str | None
    price_adjustment: float
    stock: int
    is_active: bool
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    org_id: uuid.UUID
    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category: str | None = None
    images: list[str] = []
    weight: float | None = None
    dimensions: str | None = None
    material: str | None = None
    brand: str | None = None
    shipping_cost: float = 0
    free_shipping_threshold: float | None = None
    estimated_delivery_days: int | None = None
    tags: list[str] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    is_active: bool | None = None
    category: str | None = None
    images: list[str] | None = None
    weight: float | None = None
    dimensions: str | None = None
    material: str | None = None
    brand: str | None = None
    shipping_cost: float | None = None
    free_shipping_threshold: float | None = None
    estimated_delivery_days: int | None = None
    tags: list[str] | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: str | None
    price: float
    stock: int
    category: str | None
    is_active: bool
    images: list[str] = []
    weight: float | None = None
    dimensions: str | None = None
    material: str | None = None
    brand: str | None = None
    shipping_cost: float = 0
    free_shipping_threshold: float | None = None
    estimated_delivery_days: int | None = None
    tags: list[str] = []
    avg_rating: float | None = None
    review_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
