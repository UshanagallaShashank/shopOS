# Org service — all business logic for orgs, no HTTP concerns here
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.org import Org
from models.product import Product
from models.order import Order, OrderItem
from schemas.org import OrgCreate, OrgUpdate
from utils.exceptions import ConflictError, NotFoundError


async def list_orgs(db: AsyncSession, skip: int, limit: int) -> list[Org]:
    result = await db.execute(select(Org).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_org(db: AsyncSession, org_id: uuid.UUID) -> Org:
    result = await db.execute(select(Org).where(Org.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise NotFoundError(f"Org {org_id} not found")
    return org


async def create_org(db: AsyncSession, data: OrgCreate) -> Org:
    # Guard against duplicate slugs before inserting
    existing = await db.execute(select(Org).where(Org.slug == data.slug))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Slug '{data.slug}' is already taken")
    org = Org(**data.model_dump())
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


async def update_org(db: AsyncSession, org_id: uuid.UUID, data: OrgUpdate) -> Org:
    org = await get_org(db, org_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(org, key, value)
    await db.commit()
    await db.refresh(org)
    return org


async def delete_org(db: AsyncSession, org_id: uuid.UUID) -> None:
    org = await get_org(db, org_id)

    # Must delete children before the parent — FK constraints enforce this order:
    # order_items → orders → products → org
    order_ids = (await db.execute(
        select(Order.id).where(Order.org_id == org_id)
    )).scalars().all()

    if order_ids:
        await db.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))

    await db.execute(delete(Order).where(Order.org_id == org_id))
    await db.execute(delete(Product).where(Product.org_id == org_id))

    await db.delete(org)
    await db.commit()
