from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import get_db
from ..models import Project, Task
from ..schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter()


@router.get("", response_model=list[TaskRead], response_model_by_alias=True)
async def list_tasks(
    date: date_type | None = None,
    project_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[Task]:
    stmt = select(Task)
    if date is not None:
        stmt = stmt.where(Task.date == date)
    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)
    stmt = stmt.order_by(Task.date.desc(), Task.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=TaskRead,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)) -> Task:
    project = await db.get(Project, payload.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    task = Task(**payload.model_dump(by_alias=False))
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead, response_model_by_alias=True)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskRead, response_model_by_alias=True)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in payload.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)) -> None:
    task = await db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
