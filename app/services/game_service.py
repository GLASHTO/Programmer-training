from sqlalchemy.orm import Session
from app.models import Submission, UserScore, TeamScore

async def process_submission(db: Session, user_id: int, team_id: int | None, task_id: int, score: int, is_correct: bool, code: str):
    # # 1. Создаем запись о попытке
    # new_submission = Submission(
    #     user_id=user_id,
    #     team_id=team_id,
    #     task_id=task_id,
    #     score=score if is_correct else 0,
    #     status=is_correct
    # )
    # db.add(new_submission)

    new_submission = Submission(
    user_id=user_id,
    team_id=team_id,
    task_id=task_id,
    score=score if is_correct else 0,
    status=is_correct,
    code=code)
    db.add(new_submission)

    if is_correct:
        print("correct")
        # 2. Обновляем личный счет (UserScore)
        user_score = db.query(UserScore).filter(UserScore.user_id == user_id).first()
        if user_score:
            user_score.score += score
        else:
            db.add(UserScore(user_id=user_id, score=score))

        # 3. Обновляем командный счет, если игрок в команде
        if team_id:
            team_score = db.query(TeamScore).filter(TeamScore.team_id == team_id).first()
            if team_score:
                team_score.team_score += score
            else:
                db.add(TeamScore(team_id=team_id, team_score=score))

    db.commit()
    return new_submission