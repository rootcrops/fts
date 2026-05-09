from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://fts:fts@db:5432/fts_test"
)


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    # Late imports so the app picks up overrides cleanly.
    from app import database, deps
    from app.main import app
    from app.models import Base

    engine = create_async_engine(TEST_DATABASE_URL, future=True, poolclass=NullPool)
    test_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with test_session() as s:
            yield s

    class FakeAI:
        async def polish_text(self, raw_text: str) -> str:
            return f"POLISHED: {raw_text}"

        async def suggest_padding(self, actual_hours, target_hours, task_description):
            return {
                "suggested_hours": float(target_hours),
                "added_activities": ["Code review", "Documentation"],
                "rationale": "Standard delivery overhead.",
            }

    app.dependency_overrides[database.get_db] = override_get_db
    app.dependency_overrides[deps.get_db] = override_get_db
    app.dependency_overrides[deps.get_ai_service] = lambda: FakeAI()

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
