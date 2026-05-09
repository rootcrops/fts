from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_ai_service
from ..schemas.ai import (
    PolishRequest,
    PolishResponse,
    SuggestPaddingRequest,
    SuggestPaddingResponse,
)
from ..services.ai_service import AIService, AIServiceError

router = APIRouter()


@router.post("/polish", response_model=PolishResponse, response_model_by_alias=True)
async def polish(
    payload: PolishRequest,
    ai: AIService = Depends(get_ai_service),
) -> PolishResponse:
    try:
        polished = await ai.polish_text(payload.raw_text)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return PolishResponse(polished=polished)


@router.post(
    "/suggest-padding",
    response_model=SuggestPaddingResponse,
    response_model_by_alias=True,
)
async def suggest_padding(
    payload: SuggestPaddingRequest,
    ai: AIService = Depends(get_ai_service),
) -> SuggestPaddingResponse:
    try:
        result = await ai.suggest_padding(
            actual_hours=payload.actual_hours,
            target_hours=payload.target_hours,
            task_description=payload.task_description,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return SuggestPaddingResponse(**result)
