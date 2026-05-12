from __future__ import annotations

import time
from enum import Enum
from typing import Any

import httpx
from fastapi import Depends, Header, HTTPException, status
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .database import get_db
from .models.user import User


class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


_ROLE_PRIORITY = [Role.ADMIN, Role.MANAGER, Role.USER]
_GROUP_TO_ROLE = {
    "fts-admin": Role.ADMIN,
    "fts-manager": Role.MANAGER,
    "fts-user": Role.USER,
}


class _JWKSCache:
    def __init__(self, url: str, ttl_seconds: int = 3600) -> None:
        self._url = url
        self._ttl = ttl_seconds
        self._jwks: dict[str, Any] | None = None
        self._fetched_at: float = 0.0

    async def get(self, force_refresh: bool = False) -> dict[str, Any]:
        if (
            force_refresh
            or self._jwks is None
            or (time.time() - self._fetched_at) > self._ttl
        ):
            async with httpx.AsyncClient(timeout=5.0) as ac:
                r = await ac.get(self._url)
                r.raise_for_status()
                self._jwks = r.json()
                self._fetched_at = time.time()
        return self._jwks


_jwks_cache = _JWKSCache(settings.oidc_jwks_url)


async def _verify_token(token: str) -> dict[str, Any]:
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header") from exc

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing kid")

    jwks = await _jwks_cache.get()
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key is None:
        # Possibly rotated — refresh once.
        jwks = await _jwks_cache.get(force_refresh=True)
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "RS256")],
            audience=settings.oidc_audience,
            issuer=settings.oidc_issuer,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}") from exc


def _role_from_groups(groups: list[str]) -> Role:
    mapped = [_GROUP_TO_ROLE[g] for g in groups if g in _GROUP_TO_ROLE]
    if not mapped:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no FTS role group",
        )
    for role in _ROLE_PRIORITY:
        if role in mapped:
            return role
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No matching role")


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    claims = await _verify_token(token)

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub")
    email = claims.get("email") or ""
    name = claims.get("name") or claims.get("preferred_username") or email or sub
    groups = claims.get("groups") or []
    role = _role_from_groups(groups)

    result = await db.execute(select(User).where(User.sub == sub))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(sub=sub, email=email, name=name, role=role.value)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        dirty = False
        if user.email != email:
            user.email = email
            dirty = True
        if user.name != name:
            user.name = name
            dirty = True
        if user.role != role.value:
            user.role = role.value
            dirty = True
        if dirty:
            await db.commit()
            await db.refresh(user)
    return user


def require_role(*roles: Role):
    allowed = {r.value for r in roles}

    async def _dep(current: User = Depends(get_current_user)) -> User:
        if current.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return current

    return _dep
