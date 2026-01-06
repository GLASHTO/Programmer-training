

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.game import TaskCreate, TaskOut
from app.models import Task
from app.core.database import get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])


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
