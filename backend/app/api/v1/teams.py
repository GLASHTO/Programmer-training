from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Team, User
from app.core.database import get_db
from app.schemas.teams import TeamBase
from .auth import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])


### Создать команду
@router.post("/")
def create_team(
    data: TeamBase, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 1. Требуем авторизацию
):
    # 2. Проверяем, состоит ли пользователь уже в команде
    if current_user.team_id is not None:
        raise HTTPException(
            status_code=400, 
            detail="You are already in a team. You must leave or delete your current team first."
        )

    # 3. Создаем команду и назначаем владельца
    new_team = Team(
        team_name=data.team_name,
        owner_id=current_user.id
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    # 4. Автоматически добавляем создателя в эту команду
    current_user.team_id = new_team.id
    db.commit() # Сохраняем обновление пользователя
    return {"status": "ok", "message": f"Team {new_team.team_name} created"}

# def create_team(data: TeamBase, db: Session = Depends(get_db)):
#     team = Team(team_name=data.team_name)
#     db.add(team)
#     db.commit()
#     db.refresh(team)
#     return team

### Удаление комавнды
@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Требуем авторизацию
):
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 5. Проверяем, является ли текущий пользователь владельцем команды
    if team.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the team owner can delete this team."
        )
    

    # 6. Перед удалением команды нужно убрать team_id у всех участников (сделать их свободными)
    # Иначе может быть ошибка внешнего ключа (зависит от настроек БД)
    team_members = db.query(User).filter(User.team_id == team_id).all()
    for member in team_members:
        member.team_id = None
    
    db.delete(team)
    db.commit()
    
    return {"status": "ok", "message": f"Team {team.team_name} deleted"}
# def delete_team(team_id: int, db: Session = Depends(get_db)):
#     # Находим команду
#     team = db.query(Team).filter(Team.id == team_id).first()
    
#     if not team:
#         raise HTTPException(status_code=404, detail="Team not found")
    
#     # Удаляем команду
#     db.delete(team)
#     db.commit()
    
#     return {"status": "ok", "message": f"Team {team.team_name} deleted"}

### Получить все команды
@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


### Получить команду с участниками
@router.get("/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    return db.query(Team).get(team_id)


@router.post("/leave")
def leave_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="You are not in a team")
    
    # Проверка: Владелец не может просто выйти, он должен удалить команду или передать права (упростим до удаления)
    team = db.query(Team).get(current_user.team_id)
    if team and team.owner_id == current_user.id:
         raise HTTPException(status_code=400, detail="Owner cannot leave. You must delete the team.")

    current_user.team_id = None
    db.commit()
    return {"status": "ok", "message": "You left the team"}
