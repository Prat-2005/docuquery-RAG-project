"""add user names to registration records

Revision ID: e8f3a6b1c2d4
Revises: d7e4f2a9c1b3
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f3a6b1c2d4"
down_revision: Union[str, Sequence[str], None] = "d7e4f2a9c1b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=120), nullable=True))
    op.add_column("auth_tokens", sa.Column("pending_name", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("auth_tokens", "pending_name")
    op.drop_column("users", "name")
