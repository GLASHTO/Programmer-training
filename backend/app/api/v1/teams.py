from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Team, User
from app.core.database import get_db
from app.schemas.teams import TeamBase
from .auth import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])


### Создать команду
@router.post("/")
def create_team(data: TeamBase, db: Session = Depends(get_db)):
    team = Team(team_name=data.team_name)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

### Удаление комавнды
@router.delete("/{team_id}", response_model=dict)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    # Находим команду
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Удаляем команду
    db.delete(team)
    db.commit()
    
    return {"status": "ok", "message": f"Team {team.team_name} deleted"}


### Получить все команды
@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


### Получить команду с участниками
@router.get("/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    return db.query(Team).get(team_id)
