

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import User, Team
from app.core.database import get_db
from app.core.security import hash_password,  verify_password
router = APIRouter(prefix="/users", tags=["Users"])


### Создать пользователя
@router.post("/")
def create_user(username: str, password: str, db: Session = Depends(get_db)):
    # Проверяем, есть ли пользователь с таким username
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    # Хешируем пароль
    hashed_password = hash_password(password)

    # Создаём пользователя
    user = User(username=username, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


### Получить всех пользователей


@router.get("/")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


### Получить пользователя по id
@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


### Добавить пользователя в команду и проверить
@router.put("/{user_id}/team/{team_id}")
def set_team(user_id: int, team_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not user or not team:
        raise HTTPException(404, "User or Team not found")

    user.team_id = team_id
    db.commit()
    return {"status": "ok", "user": user.username, "team": team.team_name}

### Смена пароля
@router.put("/{user_id}/new_password")
def set_password(user_id: int, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(404, "User not found")
    
   
    # Хешируем пароль
    hashed_password = hash_password(password)
    
    # Проверка, что новый пароль не совпадает со старым
    if verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as the old password")
    

    # смена пароля пользователя
    user.password= hashed_password
    db.commit()
    return {"status": "ok", "user": user.username, "new_password": user.password}


### Удаление пользователя
@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # Находим пользователя
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Удаляем пользователя
    db.delete(user)
    db.commit()
    
    return {"status": "ok", "message": f"User {user.username} deleted"}