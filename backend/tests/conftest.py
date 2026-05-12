from __future__ import annotations

import os
import uuid
from collections.abc import AsyncIterator, Callable

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
    from app import database, deps, security
    from app.main import app
    from app.models import Base, User

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

    # Default current user: admin. Tests that need other roles call client.as_user(role).
    state: dict[str, User] = {}

    async def _ensure_user(role: str, email: str) -> User:
        async with test_session() as s:
            existing = await s.execute(
                __import__("sqlalchemy").select(User).where(User.email == email)
            )
            user = existing.scalar_one_or_none()
            if user is None:
                user = User(
                    id=uuid.uuid4(),
                    sub=f"test-{role}-{email}",
                    email=email,
                    name=email,
                    role=role,
                )
                s.add(user)
                await s.commit()
                await s.refresh(user)
            return user

    async def override_current_user() -> User:
        return state["current"]

    state["current"] = await _ensure_user("admin", "admin@test")

    app.dependency_overrides[database.get_db] = override_get_db
    app.dependency_overrides[deps.get_db] = override_get_db
    app.dependency_overrides[deps.get_ai_service] = lambda: FakeAI()
    app.dependency_overrides[security.get_current_user] = override_current_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:

            async def _as_user(role: str, email: str | None = None) -> User:
                user = await _ensure_user(role, email or f"{role}@test")
                state["current"] = user
                return user

            ac.as_user = _as_user  # type: ignore[attr-defined]
            yield ac
    finally:
        app.dependency_overrides.clear()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
