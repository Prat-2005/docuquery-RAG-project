"""add local embedding model

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_settings", sa.Column("embedding_model", sa.String(100)))
    op.execute("UPDATE user_settings SET llm_provider = 'local'")
    op.alter_column(
        "user_settings",
        "llm_provider",
        server_default=sa.text("'local'"),
    )


def downgrade() -> None:
    op.alter_column(
        "user_settings",
        "llm_provider",
        server_default=sa.text("'openai'"),
    )
    op.drop_column("user_settings", "embedding_model")
