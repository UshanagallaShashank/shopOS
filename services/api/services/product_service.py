# Product service — always filters by org_id to enforce multi-tenant isolation
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.product import Product
from models.product_review import ProductReview
from schemas.product import ProductCreate, ProductUpdate
from utils.exceptions import NotFoundError


async def _attach_rating(db: AsyncSession, product: Product) -> Product:
    result = await db.execute(
        select(func.avg(ProductReview.rating), func.count(ProductReview.id))
        .where(ProductReview.product_id == product.id)
    )
    avg, count = result.one()
    product.avg_rating = round(float(avg), 1) if avg is not None else None  # type: ignore
    product.review_count = count  # type: ignore
    return product


async def list_products(db: AsyncSession, org_id: uuid.UUID, skip: int, limit: int) -> list[Product]:
    result = await db.execute(
        select(Product).where(Product.org_id == org_id).offset(skip).limit(limit)
    )
    products = list(result.scalars().all())
    for p in products:
        await _attach_rating(db, p)
    return products


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError(f"Product {product_id} not found")
    await _attach_rating(db, product)
    return product


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    product.avg_rating = None  # type: ignore
    product.review_count = 0  # type: ignore
    return product


async def update_product(db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    await _attach_rating(db, product)
    return product


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await get_product(db, product_id)
    await db.delete(product)
    await db.commit()
