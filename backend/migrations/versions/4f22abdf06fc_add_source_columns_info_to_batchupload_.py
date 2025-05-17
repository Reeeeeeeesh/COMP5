"""Add source_columns_info to BatchUpload model

Revision ID: 4f22abdf06fc
Revises: 5efaee8a69f2
Create Date: 2025-05-16 14:23:01.840868

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f22abdf06fc'
down_revision: Union[str, None] = '5efaee8a69f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('batch_uploads') as batch_op:
        batch_op.add_column(sa.Column('source_columns_info', sa.Text(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('batch_uploads') as batch_op:
        batch_op.drop_column('source_columns_info')
    # ### end Alembic commands ###
