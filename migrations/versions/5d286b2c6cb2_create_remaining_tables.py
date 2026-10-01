"""create remaining tables

Revision ID: 5d286b2c6cb2
Revises: e3a39462dc82
Create Date: 2026-10-01 13:21:02.531274

"""

from typing import Sequence, Union

from alembic import op


revision: str = "5d286b2c6cb2"
down_revision: Union[str, Sequence[str], None] = "e3a39462dc82"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove the existing foreign keys before recreating them with CASCADE.
    op.drop_constraint(
        "conversation_documents_conversation_id_fkey",
        "conversation_documents",
        type_="foreignkey",
    )
    op.drop_constraint(
        "conversation_documents_document_id_fkey",
        "conversation_documents",
        type_="foreignkey",
    )
    op.drop_constraint(
        "messages_conservation_id_fkey",
        "messages",
        type_="foreignkey",
    )

    # Rename the column without losing existing message data.
    op.alter_column(
        "messages",
        "conservation_id",
        new_column_name="conversation_id",
    )

    op.create_foreign_key(
        "conversation_documents_conversation_id_fkey",
        "conversation_documents",
        "conversations",
        ["conversation_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "conversation_documents_document_id_fkey",
        "conversation_documents",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "messages_conversation_id_fkey",
        "messages",
        "conversations",
        ["conversation_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "conversation_documents_conversation_id_fkey",
        "conversation_documents",
        type_="foreignkey",
    )
    op.drop_constraint(
        "conversation_documents_document_id_fkey",
        "conversation_documents",
        type_="foreignkey",
    )
    op.drop_constraint(
        "messages_conversation_id_fkey",
        "messages",
        type_="foreignkey",
    )

    op.alter_column(
        "messages",
        "conversation_id",
        new_column_name="conservation_id",
    )

    op.create_foreign_key(
        "conversation_documents_conversation_id_fkey",
        "conversation_documents",
        "conversations",
        ["conversation_id"],
        ["id"],
    )
    op.create_foreign_key(
        "conversation_documents_document_id_fkey",
        "conversation_documents",
        "documents",
        ["document_id"],
        ["id"],
    )
    op.create_foreign_key(
        "messages_conservation_id_fkey",
        "messages",
        "conversations",
        ["conservation_id"],
        ["id"],
        ondelete="CASCADE",
    )