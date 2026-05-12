from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db
from ..models import User
from ..schemas.user import UserRead
from ..security import Role, get_current_user, require_role

router = APIRouter()


@router.get("/me", response_model=UserRead, response_model_by_alias=True)
async def me(current: User = Depends(get_current_user)) -> User:
    return current


@router.get("", response_model=list[UserRead], response_model_by_alias=True)
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at))
    return list(result.scalars().all())
