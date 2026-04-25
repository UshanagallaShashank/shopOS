"""product_images_and_reviews

Revision ID: c5d3a2b01f44
Revises: b3f2e1a04c91
Create Date: 2026-04-25 19:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c5d3a2b01f44"
down_revision: Union[str, None] = "b3f2e1a04c91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add images JSONB column to products (default empty array)
    op.add_column(
        "products",
        sa.Column("images", postgresql.JSONB(), nullable=False, server_default="[]"),
    )

    # Create product_reviews table
    op.create_table(
        "product_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_rating_range"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "user_id", name="uq_product_review"),
    )
    op.create_index(op.f("ix_product_reviews_product_id"), "product_reviews", ["product_id"])
    op.create_index(op.f("ix_product_reviews_user_id"), "product_reviews", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_product_reviews_user_id"), table_name="product_reviews")
    op.drop_index(op.f("ix_product_reviews_product_id"), table_name="product_reviews")
    op.drop_table("product_reviews")
    op.drop_column("products", "images")
