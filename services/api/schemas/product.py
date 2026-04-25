# Pydantic schemas for Product CRUD
import uuid
from datetime import datetime

from pydantic import BaseModel


class ProductCreate(BaseModel):
    org_id: uuid.UUID
    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category: str | None = None
    images: list[str] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    is_active: bool | None = None
    category: str | None = None
    images: list[str] | None = None


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
    avg_rating: float | None = None
    review_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
