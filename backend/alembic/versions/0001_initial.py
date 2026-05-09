"""initial: projects, tasks, time_entries

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-09

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("color", sa.String(16), nullable=False, server_default="#22c55e"),
        sa.Column("client", sa.String(200), nullable=True),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer,
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("description_raw", sa.Text, nullable=False),
        sa.Column("description_polished", sa.Text, nullable=True),
        sa.Column("actual_hours", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("reported_hours", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("ai_suggestion", postgresql.JSONB, nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_tasks_date", "tasks", ["date"])
    op.create_index("ix_tasks_project_id", "tasks", ["project_id"])

    op.create_table(
        "time_entries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "task_id",
            sa.Integer,
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("actual_hours", sa.Numeric(5, 2), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("notes_raw", sa.Text, nullable=True),
    )
    op.create_index("ix_time_entries_task_id", "time_entries", ["task_id"])


def downgrade() -> None:
    op.drop_index("ix_time_entries_task_id", table_name="time_entries")
    op.drop_table("time_entries")
    op.drop_index("ix_tasks_project_id", table_name="tasks")
    op.drop_index("ix_tasks_date", table_name="tasks")
    op.drop_table("tasks")
    op.drop_table("projects")
