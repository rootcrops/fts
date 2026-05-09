from __future__ import annotations

from datetime import date as date_type
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    actual_hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    notes_raw: Mapped[str | None] = mapped_column(Text, nullable=True)

    task: Mapped["Task"] = relationship(back_populates="entries")  # type: ignore[name-defined]  # noqa: F821
