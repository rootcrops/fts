"""users + ownership: tasks/time_entries.user_id

Revision ID: 0002_users_and_ownership
Revises: 0001_initial
Create Date: 2026-05-09

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_users_and_ownership"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sub", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False, server_default=""),
        sa.Column("name", sa.String(255), nullable=False, server_default=""),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("sub", name="uq_users_sub"),
    )
    op.create_index("ix_users_sub", "users", ["sub"])

    op.add_column(
        "tasks",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "time_entries",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # Backfill: if any rows exist, attach them to a synthetic legacy admin so we can flip NOT NULL.
    bind = op.get_bind()
    has_tasks = bind.execute(sa.text("SELECT 1 FROM tasks LIMIT 1")).first() is not None
    has_entries = (
        bind.execute(sa.text("SELECT 1 FROM time_entries LIMIT 1")).first() is not None
    )
    if has_tasks or has_entries:
        legacy_id = bind.execute(
            sa.text(
                "INSERT INTO users (id, sub, email, name, role) "
                "VALUES (gen_random_uuid(), 'legacy', 'legacy@local', 'Legacy Admin', 'admin') "
                "RETURNING id"
            )
        ).scalar_one()
        if has_tasks:
            bind.execute(
                sa.text("UPDATE tasks SET user_id = :uid WHERE user_id IS NULL"),
                {"uid": legacy_id},
            )
        if has_entries:
            bind.execute(
                sa.text("UPDATE time_entries SET user_id = :uid WHERE user_id IS NULL"),
                {"uid": legacy_id},
            )

    op.alter_column("tasks", "user_id", nullable=False)
    op.alter_column("time_entries", "user_id", nullable=False)

    op.create_foreign_key(
        "fk_tasks_user_id_users",
        "tasks",
        "users",
        ["user_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_time_entries_user_id_users",
        "time_entries",
        "users",
        ["user_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
    op.create_index("ix_time_entries_user_id", "time_entries", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_time_entries_user_id", table_name="time_entries")
    op.drop_index("ix_tasks_user_id", table_name="tasks")
    op.drop_constraint("fk_time_entries_user_id_users", "time_entries", type_="foreignkey")
    op.drop_constraint("fk_tasks_user_id_users", "tasks", type_="foreignkey")
    op.drop_column("time_entries", "user_id")
    op.drop_column("tasks", "user_id")
    op.drop_index("ix_users_sub", table_name="users")
    op.drop_table("users")
