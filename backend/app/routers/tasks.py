import uuid
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db
from ..models import Project, Task, User
from ..schemas.task import TaskCreate, TaskRead, TaskUpdate
from ..security import Role, get_current_user

router = APIRouter()


def _can_see_all(user: User) -> bool:
    return user.role in {Role.ADMIN.value, Role.MANAGER.value}


def _can_write_any(user: User) -> bool:
    return user.role == Role.ADMIN.value


@router.get("", response_model=list[TaskRead], response_model_by_alias=True)
async def list_tasks(
    date: date_type | None = None,
    project_id: int | None = None,
    user_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[Task]:
    stmt = select(Task)
    if date is not None:
        stmt = stmt.where(Task.date == date)
    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)

    if _can_see_all(current):
        if user_id is not None:
            stmt = stmt.where(Task.user_id == user_id)
    else:
        # `USER` is locked to own tasks; any user_id query-param is ignored / overridden.
        stmt = stmt.where(Task.user_id == current.id)

    stmt = stmt.order_by(Task.date.desc(), Task.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=TaskRead,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> Task:
    project = await db.get(Project, payload.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    data = payload.model_dump(by_alias=False)
    task = Task(**data, user_id=current.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead, response_model_by_alias=True)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _can_see_all(current) and task.user_id != current.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskRead, response_model_by_alias=True)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current.id and not _can_write_any(current):
        raise HTTPException(status_code=403, detail="Cannot edit another user's task")
    for key, value in payload.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> None:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current.id and not _can_write_any(current):
        raise HTTPException(status_code=403, detail="Cannot delete another user's task")
    await db.delete(task)
    await db.commit()
