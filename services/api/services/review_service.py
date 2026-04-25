# Review service — one review per user per product
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.product_review import ProductReview
from models.user import User
from schemas.product_review import ReviewCreate, ReviewUpdate
from utils.exceptions import ConflictError, ForbiddenError, NotFoundError


async def _attach_email(db: AsyncSession, review: ProductReview) -> ProductReview:
    result = await db.execute(select(User.email).where(User.id == review.user_id))
    review.user_email = result.scalar_one_or_none()  # type: ignore
    return review


async def list_reviews(db: AsyncSession, product_id: uuid.UUID) -> list[ProductReview]:
    result = await db.execute(
        select(ProductReview)
        .where(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
    )
    reviews = list(result.scalars().all())
    for r in reviews:
        await _attach_email(db, r)
    return reviews


async def create_review(
    db: AsyncSession, product_id: uuid.UUID, user: User, data: ReviewCreate
) -> ProductReview:
    existing = await db.execute(
        select(ProductReview).where(
            ProductReview.product_id == product_id,
            ProductReview.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("You have already reviewed this product")

    review = ProductReview(product_id=product_id, user_id=user.id, **data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    await _attach_email(db, review)
    return review


async def update_review(
    db: AsyncSession, review_id: uuid.UUID, user: User, data: ReviewUpdate
) -> ProductReview:
    result = await db.execute(select(ProductReview).where(ProductReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError(f"Review {review_id} not found")
    if review.user_id != user.id:
        raise ForbiddenError("You can only edit your own reviews")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(review, key, value)
    await db.commit()
    await db.refresh(review)
    await _attach_email(db, review)
    return review


async def delete_review(db: AsyncSession, review_id: uuid.UUID, user: User) -> None:
    result = await db.execute(select(ProductReview).where(ProductReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundError(f"Review {review_id} not found")
    if review.user_id != user.id and user.role.value not in ("platform_admin", "org_admin", "orgs_manager"):
        raise ForbiddenError("Cannot delete someone else's review")
    await db.delete(review)
    await db.commit()
