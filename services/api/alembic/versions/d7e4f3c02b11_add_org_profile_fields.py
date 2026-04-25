"""add org profile fields

Revision ID: d7e4f3c02b11
Revises: c5d3a2b01f44
Create Date: 2026-04-25

"""
from alembic import op
import sqlalchemy as sa

revision = "d7e4f3c02b11"
down_revision = "c5d3a2b01f44"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orgs", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("orgs", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("orgs", sa.Column("phone", sa.String(50), nullable=True))
    op.add_column("orgs", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("orgs", sa.Column("logo", sa.Text(), nullable=True))
    op.add_column("orgs", sa.Column("category", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("orgs", "category")
    op.drop_column("orgs", "logo")
    op.drop_column("orgs", "address")
    op.drop_column("orgs", "phone")
    op.drop_column("orgs", "email")
    op.drop_column("orgs", "description")
