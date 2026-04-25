"""add_ui_template_to_orgs

Revision ID: f1a2b3c4d5e6
Revises: d7e4f3c02b11
Create Date: 2026-04-25 17:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "d7e4f3c02b11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orgs", sa.Column("ui_template", sa.String(50), nullable=True))
    op.add_column("orgs", sa.Column("primary_color", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("orgs", "primary_color")
    op.drop_column("orgs", "ui_template")
