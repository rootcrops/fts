from __future__ import annotations

import json
from typing import Any

from openai import AsyncOpenAI

from ..config import settings

POLISH_PROMPT = """You are a corporate technical writer. Convert the following casual developer note \
into professional English suitable for a time tracking system or client report.
Keep it concise (2-4 sentences). Do not invent technical details not implied by the original.

Raw input: {raw_text}"""

PADDING_PROMPT = """A developer spent {actual_hours}h on a task but needs to report {target_hours}h.
The task was: {description}

Suggest realistic additional activities that commonly accompany this type of work \
(code review, documentation, testing, meetings, etc.) to justify the difference.
Be specific and plausible. Output JSON only:
{{
  "added_activities": [...],
  "rationale": "..."
}}"""


class AIServiceError(Exception):
    """Raised when the AI provider returns an unusable response."""


class AIService:
    def __init__(self, client: AsyncOpenAI | None = None) -> None:
        self.client = client or AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )
        self.model = settings.ai_model

    async def polish_text(self, raw_text: str) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": POLISH_PROMPT.format(raw_text=raw_text)}],
            temperature=0.4,
        )
        content = resp.choices[0].message.content
        if not content:
            raise AIServiceError("Empty response from model")
        return content.strip()

    async def suggest_padding(
        self,
        actual_hours: float,
        target_hours: float,
        task_description: str,
    ) -> dict[str, Any]:
        prompt = PADDING_PROMPT.format(
            actual_hours=actual_hours,
            target_hours=target_hours,
            description=task_description,
        )
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.6,
        )
        content = resp.choices[0].message.content
        if not content:
            raise AIServiceError("Empty response from model")
        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIServiceError(f"Model returned invalid JSON: {content!r}") from exc
        return {
            "suggested_hours": float(target_hours),
            "added_activities": data.get("added_activities", []),
            "rationale": data.get("rationale", ""),
        }
