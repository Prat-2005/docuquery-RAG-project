"""add user settings

Revision ID: f1a2b3c4d5e6
Revises: e8f3a6b1c2d4
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e8f3a6b1c2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_settings",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "llm_provider",
            sa.String(length=50),
            nullable=False,
            server_default=sa.text("'openai'"),
        ),
        sa.Column("llm_model", sa.String(length=100), nullable=True),
        sa.Column("api_base_url", sa.Text(), nullable=True),
        sa.Column("api_key_masked", sa.String(length=255), nullable=True),
        sa.Column(
            "chunk_size",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("1000"),
        ),
        sa.Column(
            "chunk_overlap",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("200"),
        ),
        sa.Column(
            "top_k",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("3"),
        ),
        sa.Column(
            "theme",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'system'"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
