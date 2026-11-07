"""add payment method settings

Revision ID: b9c2d1e4f7a2
Revises: 0046f3f5e6d0
Create Date: 2026-11-07 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b9c2d1e4f7a2"
down_revision: Union[str, None] = "0046f3f5e6d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("settings") as batch_op:
        batch_op.add_column(
            sa.Column("card_payment_enabled", sa.Boolean(), nullable=True, server_default=sa.true())
        )
        batch_op.add_column(
            sa.Column("tron_payment_enabled", sa.Boolean(), nullable=True, server_default=sa.false())
        )
        batch_op.add_column(
            sa.Column("usdt_payment_enabled", sa.Boolean(), nullable=True, server_default=sa.false())
        )
        batch_op.add_column(
            sa.Column("tron_address", sa.String(length=200), nullable=True)
        )
        batch_op.add_column(
            sa.Column("usdt_address", sa.String(length=200), nullable=True)
        )

    op.execute(
        """
        UPDATE settings
        SET card_payment_enabled = 1,
            tron_payment_enabled = 0,
            usdt_payment_enabled = 0
        WHERE card_payment_enabled IS NULL
           OR tron_payment_enabled IS NULL
           OR usdt_payment_enabled IS NULL
        """
    )

    op.execute(
        """
        UPDATE settings
        SET card_payment_enabled = 1
        WHERE card_payment_enabled IS NULL
        """
    )


def downgrade() -> None:
    with op.batch_alter_table("settings") as batch_op:
        batch_op.drop_column("usdt_address")
        batch_op.drop_column("tron_address")
        batch_op.drop_column("usdt_payment_enabled")
        batch_op.drop_column("tron_payment_enabled")
        batch_op.drop_column("card_payment_enabled")
