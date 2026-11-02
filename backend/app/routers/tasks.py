from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, case, func
from datetime import datetime, timezone

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Task, Subtask, utc_now
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskOut,
    TaskStatsOut,
    SubtaskCreate,
    SubtaskUpdate,
    SubtaskOut,
    StatusType,
    PriorityType,
)

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("/stats", response_model=TaskStatsOut, summary="Получение статистики продуктивности задач")
def get_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    now = datetime.now(timezone.utc)

    total_tasks = len(tasks)
    todo_tasks = sum(1 for t in tasks if t.status == "todo")
    in_progress_tasks = sum(1 for t in tasks if t.status == "in_progress")
    done_tasks = sum(1 for t in tasks if t.status == "done")
    
    overdue_tasks = 0
    total_subtasks = 0
    completed_subtasks = 0

    for t in tasks:
        if t.deadline:
            d = t.deadline
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            if d < now and t.status != "done":
                overdue_tasks += 1
        for st in t.subtasks:
            total_subtasks += 1
            if st.is_completed:
                completed_subtasks += 1

    completion_rate = round((done_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    return TaskStatsOut(
        total_tasks=total_tasks,
        todo_tasks=todo_tasks,
        in_progress_tasks=in_progress_tasks,
        done_tasks=done_tasks,
        overdue_tasks=overdue_tasks,
        completion_rate=completion_rate,
        total_subtasks=total_subtasks,
        completed_subtasks=completed_subtasks,
    )

@router.post("/clear-completed", summary="Очистка завершенных задач")
def clear_completed_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    done_tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.status == "done").all()
    count = len(done_tasks)
    for t in done_tasks:
        db.delete(t)
    db.commit()
    return {"deleted_count": count}

@router.get("", response_model=List[TaskOut], summary="Получение списка задач с фильтрацией и поиском")
def get_tasks(
    search: Optional[str] = Query(None, description="Поиск по названию или описанию"),
    status_filter: Optional[StatusType] = Query(None, alias="status", description="Фильтр по статусу"),
    priority_filter: Optional[PriorityType] = Query(None, alias="priority", description="Фильтр по приоритету"),
    tag: Optional[str] = Query(None, description="Фильтр по тегу"),
    sort_by: Optional[str] = Query("default", description="Сортировка: default, deadline, priority, created_asc, created_desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
                Task.tags.ilike(search_pattern)
            )
        )

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    if tag:
        clean_tag = tag.strip().lower().lstrip("#")
        tags_col = func.lower(Task.tags)
        query = query.filter(
            or_(
                tags_col == clean_tag,
                tags_col.like(f"{clean_tag},%"),
                tags_col.like(f"%,{clean_tag}"),
                tags_col.like(f"%,{clean_tag},%"),
            )
        )

    # Sorting
    if sort_by == "deadline":
        tasks = query.order_by(Task.is_pinned.desc(), Task.deadline.is_(None), Task.deadline.asc(), Task.created_at.desc()).all()
    elif sort_by == "priority":
        priority_order = case(
            (Task.priority == "urgent", 4),
            (Task.priority == "high", 3),
            (Task.priority == "medium", 2),
            (Task.priority == "low", 1),
            else_=0
        )
        tasks = query.order_by(Task.is_pinned.desc(), priority_order.desc(), Task.created_at.desc()).all()
    elif sort_by == "created_asc":
        tasks = query.order_by(Task.is_pinned.desc(), Task.created_at.asc()).all()
    else:
        tasks = query.order_by(Task.is_pinned.desc(), Task.created_at.desc()).all()

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

    tags_str = ",".join([t.strip() for t in task_in.tags if t.strip()]) if task_in.tags else ""

    task = Task(
        user_id=current_user.id,
        title=clean_title,
        description=task_in.description.strip() if (task_in.description and task_in.description.strip()) else None,
        priority=task_in.priority,
        status="todo",
        deadline=task_in.deadline,
        tags=tags_str,
        is_pinned=task_in.is_pinned or False,
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

@router.post("/{task_id}/pin", response_model=TaskOut, summary="Закрепление / открепление задачи")
def toggle_pin_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

    task.is_pinned = not bool(task.is_pinned)
    db.commit()
    db.refresh(task)
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
        elif field == "tags":
            tags_str = ",".join([t.strip() for t in value if t and t.strip()]) if value else ""
            task.tags = tags_str
        elif field == "is_pinned":
            task.is_pinned = bool(value)
        elif field == "subtasks":
            if value is not None:
                clean_titles = [st.strip() for st in value if st and st.strip()]
                completion_map = {s.title.strip().lower(): s.is_completed for s in task.subtasks}
                task.subtasks.clear()
                db.flush()
                for st_title in clean_titles:
                    was_done = completion_map.get(st_title.lower(), False)
                    task.subtasks.append(Subtask(task_id=task.id, title=st_title, is_completed=was_done))
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
