from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Task, Subtask
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskOut,
    SubtaskCreate,
    SubtaskUpdate,
    SubtaskOut,
    StatusType,
    PriorityType,
)

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskOut], summary="Получение списка задач с фильтрацией и поиском")
def get_tasks(
    search: Optional[str] = Query(None, description="Поиск по названию или описанию"),
    status_filter: Optional[StatusType] = Query(None, alias="status", description="Фильтр по статусу"),
    priority_filter: Optional[PriorityType] = Query(None, alias="priority", description="Фильтр по приоритету"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    tasks = query.order_by(Task.created_at.desc()).all()
    return tasks

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED, summary="Создание новой задачи")
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_title = task_in.title.strip()
    if not clean_title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Название задачи не может быть пустым")

    task = Task(
        user_id=current_user.id,
        title=clean_title,
        description=task_in.description.strip() if (task_in.description and task_in.description.strip()) else None,
        priority=task_in.priority,
        status="todo",
        deadline=task_in.deadline,
    )
    db.add(task)
    db.flush()  # gets task.id

    if task_in.subtasks:
        for st_title in task_in.subtasks:
            clean_st = st_title.strip()
            if clean_st:
                subtask = Subtask(task_id=task.id, title=clean_st, is_completed=False)
                db.add(subtask)

    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskOut, summary="Получение задачи по идентификатору")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
    return task

@router.patch("/{task_id}", response_model=TaskOut, summary="Редактирование задачи")
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "title":
            if value is not None:
                clean = value.strip()
                if not clean:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Название задачи не может быть пустым")
                setattr(task, field, clean)
        elif field == "description":
            setattr(task, field, value.strip() if (value and isinstance(value, str) and value.strip()) else None)
        elif field == "deadline":
            setattr(task, field, value)
        elif field == "subtasks":
            if value is not None:
                existing_titles = {s.title.lower().strip() for s in task.subtasks}
                for st_title in value:
                    clean_st = st_title.strip()
                    if clean_st and clean_st.lower() not in existing_titles:
                        db.add(Subtask(task_id=task.id, title=clean_st, is_completed=False))
                        existing_titles.add(clean_st.lower())
        else:
            setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удаление задачи (каскадно удаляет подзадачи)")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    db.delete(task)
    db.commit()
    return None

# Subtask routes
@router.post("/{task_id}/subtasks", response_model=SubtaskOut, status_code=status.HTTP_201_CREATED, summary="Добавление подзадачи")
def create_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    subtask = Subtask(
        task_id=task.id,
        title=subtask_in.title.strip(),
        is_completed=False,
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask

@router.patch("/{task_id}/subtasks/{subtask_id}", response_model=SubtaskOut, summary="Обновление статуса/названия подзадачи")
def update_subtask(
    task_id: int,
    subtask_id: int,
    subtask_in: SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task.id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Подзадача не найдена")

    update_data = subtask_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "title" and value is not None:
            setattr(subtask, field, value.strip())
        else:
            setattr(subtask, field, value)

    db.commit()
    db.refresh(subtask)
    return subtask

@router.delete("/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удаление подзадачи")
def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.task_id == task.id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Подзадача не найдена")

    db.delete(subtask)
    db.commit()
    return None
