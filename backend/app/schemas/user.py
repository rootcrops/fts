from __future__ import annotations

import uuid
from datetime import datetime

from .base import CamelModel


class UserRead(CamelModel):
    id: uuid.UUID
    sub: str
    email: str
    name: str
    role: str
    created_at: datetime
