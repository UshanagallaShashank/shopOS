"""add_user_org_access_table

Revision ID: b3f2e1a04c91
Revises: 0a11914944b8
Create Date: 2026-04-25 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b3f2e1a04c91"
down_revision: Union[str, None] = "0a11914944b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_org_access",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "org_id", name="uq_user_org_access"),
    )
    op.create_index(op.f("ix_user_org_access_user_id"), "user_org_access", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_org_access_org_id"), "user_org_access", ["org_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_org_access_org_id"), table_name="user_org_access")
    op.drop_index(op.f("ix_user_org_access_user_id"), table_name="user_org_access")
    op.drop_table("user_org_access")
