from datetime import date as date_type
from typing import Any, Literal

from .base import CamelModel

TaskStatus = Literal["draft", "submitted"]


class TaskBase(CamelModel):
    project_id: int
    name: str
    description_raw: str
    description_polished: str | None = None
    actual_hours: float = 0
    reported_hours: float = 0
    date: date_type
    ai_suggestion: dict[str, Any] | None = None
    status: TaskStatus = "draft"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(CamelModel):
    name: str | None = None
    description_raw: str | None = None
    description_polished: str | None = None
    actual_hours: float | None = None
    reported_hours: float | None = None
    date: date_type | None = None
    ai_suggestion: dict[str, Any] | None = None
    status: TaskStatus | None = None


class TaskRead(TaskBase):
    id: int
