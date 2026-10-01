"""enable pgvector extension

Revision ID: e3a39462dc82
Revises: 26c0c8aed0ed
Create Date: 2026-09-29 23:10:59.518034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3a39462dc82'
down_revision: Union[str, Sequence[str], None] = '26c0c8aed0ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS vector")
