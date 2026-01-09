from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.submission import UserScore, TeamScore
from app.models.user import User
from app.models.game import Team
from app.schemas.submission import SubmissionCreate # Нужно создать схему
from app.services.code_executor import CodeExecutor
from app.services.game_service import process_submission
from app.models.game import Task # Обязательно импортируй Task
from .auth import get_current_user

router = APIRouter()
# @router.post("/submit")
# async def handle_submit(
#     data: SubmissionCreate, 
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user) # Вот тут магия!
# ):
#     # Теперь мы точно знаем, кто это:
#     user_id = current_user.id
#     team_id = current_user.team_id  # Автоматически берем его команду из БД
#     task = db.query(Task).filter(Task.id == data.task_id).first()

#     if not task:
#         raise HTTPException(status_code=404, detail="Task not found")
        
#     # Выполнение кода (Docker)
#     result = await CodeExecutor.run_python_code(data.code)
    
#     # Проверяем ответ
#     is_correct = False
#     if result["success"]:
#         # Сравниваем вывод программы с тем, что в базе
#         is_correct = result["output"] == str(task.expected_output)
    
#     # Сохраняем результат в базу (используя твою логику scores)
#     new_submission = await process_submission(
#         db, data.user_id, data.team_id, task.id, 
#         score=task.task_score if is_correct else 0,
#         is_correct=is_correct
#     )
    
#     return {"status": is_correct, "output": result.get("output"), "error": result.get("error")}


# @router.post("/submit")
# async def handle_submit(
#     data: SubmissionCreate, 
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     task = db.query(Task).filter(Task.id == data.task_id).first()
#     if not task:
#         raise HTTPException(status_code=404, detail="Task not found")
        
#     result = await CodeExecutor.run_python_code(data.code)
    
#     is_correct = False
#     if result["success"]:
#         # Очищаем вывод от лишних пробелов/переносов для точности сравнения
#         is_correct = result["output"].strip() == str(task.expected_output).strip()
    
#     # ПЕРЕДАЕМ ПРАВИЛЬНЫЕ ДАННЫЕ
#     new_submission = await process_submission(
#         db=db,
#         user_id=current_user.id,        # Берем ID из токена (безопасно)
#         team_id=current_user.team_id,   # Берем команду из профиля юзера
#         task_id=task.id, 
#         score=task.task_score if is_correct else 0,
#         is_correct=is_correct,
#         code=data.code                  # Передаем сам код для сохранения
#     )
    
#     return {
#         "status": is_correct, 
#         "output": result.get("output"), 
#         "error": result.get("error"),
#         "submission_id": new_submission.id
#     }

# @router.get("/leaderboard/users")
# def get_user_leaderboard(db: Session = Depends(get_db)):
#     # Соединяем UserScore с User, чтобы получить имя пользователя (username)
#     results = (
#         db.query(UserScore.score, User.username)
#         .join(User, User.id == UserScore.user_id)
#         .order_by(desc(UserScore.score))
#         .limit(10)
#         .all()
#     )
#     return [{"username": r.username, "score": r.score} for r in results]

# @router.get("/leaderboard/teams")
# def get_team_leaderboard(db: Session = Depends(get_db)):
#     # Соединяем TeamScore с Team, чтобы получить название команды
#     results = (
#         db.query(TeamScore.team_score, Team.team_name)
#         .join(Team, Team.id == TeamScore.team_id)
#         .order_by(desc(TeamScore.team_score))
#         .limit(10)
#         .all()
#     )
#     return [{"team_name": r.team_name, "score": r.team_score} for r in results]



# ДЛЯ ПРОВЕРКИ
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
    
    # 3. Сохраняем и получаем объект из БД
    new_submission = await process_submission(
        db=db,
        user_id=current_user.id,
        team_id=current_user.team_id,
        task_id=task.id,
        score=task.task_score if is_correct else 0,
        is_correct=is_correct,
        code=data.code
    )

    # 4. Возвращаем ПОЛНЫЙ ответ
    return {
        "status": is_correct,
        "output": result.get("output"),
        "error": result.get("error"),
        "submission_id": new_submission.id
    }