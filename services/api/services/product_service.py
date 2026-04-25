# Product service — always filters by org_id to enforce multi-tenant isolation
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate
from utils.exceptions import NotFoundError


async def list_products(db: AsyncSession, org_id: uuid.UUID, skip: int, limit: int) -> list[Product]:
    # Never return products across orgs — always scope to one org_id
    result = await db.execute(
        select(Product).where(Product.org_id == org_id).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError(f"Product {product_id} not found")
    return product


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await get_product(db, product_id)
    await db.delete(product)
    await db.commit()
