from app.api.v1.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import User, Team
from app.core.database import get_db
from app.core.security import hash_password,  verify_password
from app.schemas.user import UserCreate, UserPasswChange, UserToTeam, OneUserOut
router = APIRouter(prefix="/users", tags=["Users"])


### Создать пользователя
@router.post("/")
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    # Проверяем, есть ли пользователь с таким username
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    # Хешируем пароль
    hashed_password = hash_password(data.password)

    # Создаём пользователя
    user = User(username=data.username, password=hashed_password)
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
# @router.put("/to_team")
# def set_team(data: UserToTeam, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == data.user_id).first()
#     team = db.query(Team).filter(Team.id == data.team_id).first()
    
#     if not user or not team:
#         raise HTTPException(404, "User or Team not found")

#     user.team_id = data.team_id
#     db.commit()
#     return {"status": "ok", "user": user.username, "team": team.team_name}
@router.put("/to_team")
def set_team(
    data: UserToTeam, 
    db: Session = Depends(get_db),
    # Если это действие делает сам пользователь, раскомментируйте строку ниже и используйте current_user
    current_user: User = Depends(get_current_user) 
):
    # Находим пользователя (если делает админ)
    user = db.query(User).filter(User.id == data.user_id).first()
    
    # Если делает сам пользователь, то user = current_user
    
    team = db.query(Team).filter(Team.id == data.team_id).first()
    
    if not user or not team:
        raise HTTPException(404, "User or Team not found")

    # === ГЛАВНАЯ ПРОВЕРКА ===
    # Если у пользователя уже есть team_id, запрещаем переход
    if user.team_id is not None:
         raise HTTPException(
            status_code=400, 
            detail="User is already in a team. Leave current team first."
        )

    user.team_id = data.team_id
    db.commit()
    return {"status": "ok", "user": user.username, "team": team.team_name}



### Смена пароля
@router.put("/new_password")
def set_password(data: UserPasswChange, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.id).first()
    
    if not user:
        raise HTTPException(404, "User not found")
    
   
    # Хешируем пароль
    hashed_password = hash_password(data.password)
    
    # Проверка, что новый пароль не совпадает со старым
    if verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="New password cannot be the same as the old password")
    

    # смена пароля пользователя
    user.password= hashed_password
    db.commit()
    return {"status": "ok", "user": user.username, "new_password": user.password}


### Удаление пользователя
@router.delete("/delete/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # Находим пользователя
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Удаляем пользователя
    db.delete(user)
    db.commit()
    
    return {"status": "ok", "message": f"User {user.username} deleted"}