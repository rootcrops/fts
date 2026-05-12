from __future__ import annotations

import uuid
from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description_raw: Mapped[str] = mapped_column(Text, nullable=False)
    description_polished: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    reported_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    ai_suggestion: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="tasks")  # type: ignore[name-defined]  # noqa: F821
    entries: Mapped[list["TimeEntry"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="task",
        cascade="all, delete-orphan",
    )
