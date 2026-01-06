
# 🔹 teams.py


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models import Team
from app.core.database import get_db

router = APIRouter(prefix="/teams", tags=["Teams"])


### Создать команду


@router.post("/")
def create_team(name: str, db: Session = Depends(get_db)):
    team = Team(team_name=name)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


### Получить все команды


@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


### Получить команду с участниками


@router.get("/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    return db.query(Team).get(team_id)
