from functools import lru_cache

from .database import get_db  # re-export for routers

__all__ = ["get_db", "get_ai_service"]


@lru_cache(maxsize=1)
def _ai_service_singleton():
    from .services.ai_service import AIService

    return AIService()


def get_ai_service():
    return _ai_service_singleton()
