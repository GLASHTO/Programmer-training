from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.game import TaskCreate, TaskOut
from app.models import Task
from app.core.database import get_db

from .auth import get_current_user
from app.models.submission import Submission
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/next")
def get_next_task(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Найти следующую задачу по сложности (ID), которую пользователь еще не решил"""
    
    # 1. Получаем ID всех успешно решенных задач этого пользователя
    solved_submissions = db.query(Submission.task_id).filter(
        Submission.user_id == current_user.id,
        Submission.status == True
    ).all()
    
    # Делаем плоский список ID: [1, 2, 5]
    solved_task_ids = [s[0] for s in solved_submissions]

    # 2. Находим ID последней решенной задачи (считаем, что чем больше ID, тем сложнее)
    last_solved_id = max(solved_task_ids) if solved_task_ids else 0

    # 3. Ищем первую задачу, которую:
    # - Пользователь еще не решил
    # - Чей ID больше последней решенной
    next_task = db.query(Task).filter(
        Task.id.notin_(solved_task_ids),
        Task.id > last_solved_id
    ).order_by(Task.id.asc()).first()

    if next_task:
        return {"status": "found", "task_id": next_task.id}
    else:
        # Если задач больше нет, возвращаем статус empty и ID последней задачи для повтора
        return {"status": "empty", "last_task_id": last_solved_id}

### Создать задачу
@router.post("/", response_model=TaskOut)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=data.title,
        description=data.description,
        task_score=data.task_score,
        task_time=data.task_time,
        expected_output=data.expected_output
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

### Получить все задачи
@router.get("/")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()
