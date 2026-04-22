from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string

from app.core.database import get_db
from app.models.room import Room, RoomTask, RoomParticipant, RoomStatus
from app.models.game import Task
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.room import RoomCreate, RoomJoin, RoomOut, RoomDetailsOut



from fastapi import WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager
from app.core.security import verify_token # Импортируй свою функцию проверки токена!
from jose import JWTError # Если используешь python-jose для JWT



router = APIRouter()

def generate_room_code(length=6):
    """Генерация случайного кода из заглавных букв и цифр"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=RoomOut)
def create_room(
    data: RoomCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Создание новой комнаты (Роль: Учитель/Организатор)"""
    
    # 1. Проверяем, существуют ли переданные задачи в БД
    valid_tasks = db.query(Task).filter(Task.id.in_(data.task_ids)).all()
    if len(valid_tasks) != len(data.task_ids):
        raise HTTPException(status_code=400, detail="Some tasks do not exist.")

    # 2. Генерируем уникальный код (с проверкой на коллизии)
    while True:
        code = generate_room_code()
        if not db.query(Room).filter(Room.code == code).first():
            break # Код уникален

    # 3. Создаем комнату
    new_room = Room(
        code=code,
        creator_id=current_user.id,
        time_limit_seconds=data.time_limit_seconds,
        status=RoomStatus.WAITING
    )
    db.add(new_room)
    db.flush() # Получаем new_room.id без коммита всей транзакции

    # 4. Привязываем задачи к комнате с сохранением порядка (order_index)
    for index, task_id in enumerate(data.task_ids):
        room_task = RoomTask(room_id=new_room.id, task_id=task_id, order_index=index)
        db.add(room_task)

    db.commit()
    db.refresh(new_room)
    return new_room


@router.post("/join")
def join_room(
    data: RoomJoin, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Вход студента в комнату по коду"""
    
    room = db.query(Room).filter(Room.code == data.code).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or code is invalid")
    
    if room.status != RoomStatus.WAITING:
        raise HTTPException(status_code=403, detail="Room is already active or finished")

    # Проверяем, не состоит ли пользователь уже в этой комнате
    existing_participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room.id,
        RoomParticipant.user_id == current_user.id
    ).first()

    if existing_participant:
        return {"status": "ok", "message": "Already in room", "room_id": room.id}

    # Добавляем студента в лобби
    new_participant = RoomParticipant(room_id=room.id, user_id=current_user.id)
    db.add(new_participant)
    db.commit()

    return {"status": "ok", "message": "Successfully joined the room", "room_id": room.id}


@router.get("/{room_id}", response_model=RoomDetailsOut)
def get_room_details(
    room_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о комнате и список участников"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Для простоты собираем данные об участниках вручную
    participants_data = []
    for p in room.participants:
        user = db.query(User).filter(User.id == p.user_id).first()
        if user:
            participants_data.append({
                "user_id": user.id,
                "username": user.username,
                "score": p.score,
                "completed_tasks_count": p.completed_tasks_count
            })

    return {
        "id": room.id,
        "code": room.code,
        "creator_id": room.creator_id,
        "status": room.status,
        "time_limit_seconds": room.time_limit_seconds,
        "created_at": room.created_at,
        "participants": participants_data
    }


async def get_ws_current_user(token: str, db: Session):
    """Кастомный валидатор для сокетов, читающий токен из URL"""
    try:
        # ЗАМЕНИ НА СВОЮ ЛОГИКУ РАСШИФРОВКИ ТОКЕНА
        # Например: payload = verify_token(token)
        # username: str = payload.get("sub")
        # user = db.query(User).filter(User.username == username).first()
        
        # Заглушка (подставь свой импорт и вызов):
        user = await get_current_user(token=token, db=db) # Если функция может принять строку
        return user
    except Exception:
        return None

@router.websocket("/{room_id}/ws")
async def websocket_room_endpoint(
    websocket: WebSocket, 
    room_id: int, 
    token: str = Query(...), 
    db: Session = Depends(get_db)
):
    # 1. Проверяем токен
    user = await get_ws_current_user(token, db)
    if not user:
        await websocket.close(code=1008) # Policy Violation (не авторизован)
        return

    # 2. Проверяем, существует ли комната
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        await websocket.close(code=1000)
        return

    # 3. Подключаем пользователя
    await manager.connect(websocket, room_id)
    
    # Оповещаем остальных, что кто-то зашел в лобби
    await manager.broadcast(
        message={
            "event": "user_joined",
            "user_id": user.id,
            "username": user.username,
            "message": f"{user.username} entered the unit lobby."
        },
        room_id=room_id
    )

    try:
        # 4. Бесконечный цикл прослушивания входящих сообщений от клиента
        while True:
            data = await websocket.receive_text()
            # На этом этапе можно принимать команды от клиента. 
            # Например, если Учитель нажал "Старт", он шлет {"action": "start_game"}
            # Но пока мы просто держим соединение открытым
            
    except WebSocketDisconnect:
        # 5. Пользователь отключился (закрыл вкладку, обрыв интернета)
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            message={
                "event": "user_left",
                "user_id": user.id,
                "username": user.username,
                "message": f"{user.username} disconnected."
            },
            room_id=room_id
        )