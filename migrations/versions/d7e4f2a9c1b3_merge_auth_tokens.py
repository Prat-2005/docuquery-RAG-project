"""merge password reset and registration tokens

Revision ID: d7e4f2a9c1b3
Revises: c2f8d5a1e6b7
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7e4f2a9c1b3"
down_revision: Union[str, Sequence[str], None] = "c2f8d5a1e6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("password_reset_tokens", "auth_tokens")
    op.execute(
        sa.text(
            "ALTER INDEX ix_password_reset_tokens_user_id "
            "RENAME TO ix_auth_tokens_user_id"
        )
    )
    op.alter_column("auth_tokens", "user_id", nullable=True)
    op.add_column("auth_tokens", sa.Column("token_type", sa.String(length=32), nullable=True))
    op.add_column("auth_tokens", sa.Column("pending_email", sa.String(length=255), nullable=True))
    op.add_column("auth_tokens", sa.Column("pending_password_hash", sa.Text(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE auth_tokens SET token_type = 'password_reset' "
            "WHERE token_type IS NULL"
        )
    )
    op.alter_column("auth_tokens", "token_type", nullable=False)
    op.create_index("ix_auth_tokens_token_type", "auth_tokens", ["token_type"])


def downgrade() -> None:
    op.drop_index("ix_auth_tokens_token_type", table_name="auth_tokens")
    op.drop_column("auth_tokens", "pending_password_hash")
    op.drop_column("auth_tokens", "pending_email")
    op.drop_column("auth_tokens", "token_type")
    op.alter_column("auth_tokens", "user_id", nullable=False)
    op.rename_table("auth_tokens", "password_reset_tokens")
    op.execute(
        sa.text(
            "ALTER INDEX ix_auth_tokens_user_id "
            "RENAME TO ix_password_reset_tokens_user_id"
        )
    )
