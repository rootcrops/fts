from .base import CamelModel


class PolishRequest(CamelModel):
    raw_text: str


class PolishResponse(CamelModel):
    polished: str


class SuggestPaddingRequest(CamelModel):
    actual_hours: float
    target_hours: float
    task_description: str


class SuggestPaddingResponse(CamelModel):
    suggested_hours: float
    added_activities: list[str]
    rationale: str
