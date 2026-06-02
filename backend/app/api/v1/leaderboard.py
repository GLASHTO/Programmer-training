from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List

from app.core.database import get_db
from app.models.submission import UserScore, TeamScore
from app.schemas.submission import UserRankOut, TeamRankOut
from app.models.user import User
from app.models.game import Team


router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/users", response_model=List[UserRankOut])
def get_users_leaderboard(db: Session = Depends(get_db), limit: int = 50):
    """Получить топ индивидуальных игроков"""
    # Делаем запрос: Пользователь, Название команды (если есть), Баллы (или 0)
    users_data = (
        db.query(
            User.username,
            Team.team_name,
            func.coalesce(UserScore.user_score, 0).label("score")
        )
        .outerjoin(UserScore, User.id == UserScore.user_id) # Цепляем баллы
        .outerjoin(Team, User.team_id == Team.id) # Цепляем команду
        .filter(User.active == True) # Исключаем удаленных/забаненных
        .order_by(desc("score")) # Сортируем по убыванию
        .limit(limit) # Ограничиваем топ (например, топ-50)
        .all()
    )

    # Добавляем поле rank (место)
    leaderboard = [
        {
            "rank": index + 1,
            "username": row.username,
            "team_name": row.team_name,
            "score": row.score
        }
        for index, row in enumerate(users_data)
    ]
    
    return leaderboard


@router.get("/teams", response_model=List[TeamRankOut])
def get_teams_leaderboard(db: Session = Depends(get_db), limit: int = 50):
    """Получить топ команд"""
    
    teams_data = (
        db.query(
            Team.team_name,
            func.coalesce(TeamScore.team_score, 0).label("score")
        )
        .outerjoin(TeamScore, Team.id == TeamScore.team_id)
        .order_by(desc("score"))
        .limit(limit)
        .all()
    )

    leaderboard = [
        {
            "rank": index + 1,
            "team_name": row.team_name,
            "score": row.score
        }
        for index, row in enumerate(teams_data)
    ]
    
    return leaderboard