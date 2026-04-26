"""add product columns

Revision ID: h9i0j1k2l3m4
Revises: g8h9i0j1k2l3
Create Date: 2026-04-26 01:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'h9i0j1k2l3m4'
down_revision = 'g8h9i0j1k2l3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add product attributes
    op.add_column('products', sa.Column('weight', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('dimensions', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('material', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('brand', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('shipping_cost', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False))
    op.add_column('products', sa.Column('free_shipping_threshold', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('estimated_delivery_days', sa.Integer(), nullable=True))
    op.add_column('products', sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False))
    op.add_column('products', sa.Column('meta_title', sa.String(length=200), nullable=True))
    op.add_column('products', sa.Column('meta_description', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove product columns
    op.drop_column('products', 'meta_description')
    op.drop_column('products', 'meta_title')
    op.drop_column('products', 'tags')
    op.drop_column('products', 'estimated_delivery_days')
    op.drop_column('products', 'free_shipping_threshold')
    op.drop_column('products', 'shipping_cost')
    op.drop_column('products', 'brand')
    op.drop_column('products', 'material')
    op.drop_column('products', 'dimensions')
    op.drop_column('products', 'weight')
