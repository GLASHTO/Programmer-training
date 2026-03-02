from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.submission import Submission
from app.models.user import User

from app.schemas.submission import SubmissionCreate # Нужно создать схему
from app.services.code_executor import CodeExecutor
from app.services.game_service import process_submission
from app.models.game import Task # Обязательно импортируй Task
from .auth import get_current_user

router = APIRouter()

@router.post("/submit")
async def handle_submit(
    data: SubmissionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Ищем задачу
    task = db.query(Task).filter(Task.id == data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Запускаем код
    result = await CodeExecutor.run_python_code(data.code)
    
    # --- ОТЛАДКА (удали потом) ---
    print(f"Docker output: '{result.get('output')}'")
    print(f"Expected: '{task.expected_output}'")
    # -----------------------------

    is_correct = False
    if result["success"]:
        # Обязательно .strip(), чтобы убрать невидимые \n
        user_out = str(result.get("output", "")).strip()
        target_out = str(task.expected_output).strip()
        is_correct = (user_out == target_out)
        
    # Проверяем, решал ли пользователь эту задачу успешно ранее
    already_solved = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.task_id == task.id,
        Submission.status == True
    ).first() is not None

    # Если решил правильно сейчас И не решал ранее -> даем баллы. Иначе -> 0.
    points_to_award = task.task_score if (is_correct and not already_solved) else 0

    # 3. Сохраняем и получаем объект из БД
    new_submission = await process_submission(
        db=db,
        user_id=current_user.id,
        team_id=current_user.team_id,
        task_id=task.id,
        score=points_to_award,
        is_correct=is_correct,
        code=data.code
    )

    # 4. Возвращаем ПОЛНЫЙ ответ + флаг already_solved для фронтенда
    return {
        "status": is_correct,
        "output": result.get("output"),
        "error": result.get("error"),
        "submission_id": new_submission.id,
        "already_solved": already_solved,      # Передаем на фронт
        "awarded_points": points_to_award      # Сколько реально начислено
    }