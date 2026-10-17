"""fix conversation documents primary key

Revision ID: 9ba3acd7ca6f
Revises: 5d286b2c6cb2
Create Date: 2026-10-15 22:53:55.770250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9ba3acd7ca6f'
down_revision: Union[str, Sequence[str], None] = '5d286b2c6cb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_constraint(
        "conversation_documents_pkey",
        "conversation_documents",
        type_="primary",
    )

    op.create_primary_key(
        "conversation_documents_pkey",
        "conversation_documents",
        ["conversation_id", "document_id"],
    )


def downgrade():
    op.drop_constraint(
        "conversation_documents_pkey",
        "conversation_documents",
        type_="primary",
    )

    op.create_primary_key(
        "conversation_documents_pkey",
        "conversation_documents",
        ["conversation_id"],
    )
