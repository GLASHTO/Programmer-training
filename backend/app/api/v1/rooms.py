from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string
import json
from app.services.code_executor import CodeExecutor

from app.core.database import get_db
from app.models.room import Room, RoomTask, RoomParticipant, RoomStatus, RoomSubmission
from app.models.game import Task
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.room import RoomCreate, RoomJoin, RoomOut, RoomDetailsOut


from app.api.v1.auth import get_current_user
from fastapi import WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager




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


# Убираем async, так как get_current_user синхронная
def get_ws_current_user(token: str, db: Session):
    """Кастомный валидатор для сокетов, читающий токен из URL"""
    try:
        # Вызываем твою функцию без await! 
        # Она сама проверит секрет, алгоритм и найдет пользователя в БД
        user = get_current_user(token=token, db=db)
        return user
    except Exception:
        # Сюда мы попадем, если get_current_user бросит HTTPException(401)
        return None


@router.websocket("/{room_id}/ws")
async def websocket_room_endpoint(
    websocket: WebSocket, 
    room_id: int, 
    token: str = Query(...), 
    db: Session = Depends(get_db)
):
    user = get_ws_current_user(token, db)
    if not user:
        await websocket.close(code=1008) 
        return

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        await websocket.close(code=1000)
        return

    await manager.connect(websocket, room_id)
    
    await manager.broadcast(
        message={
            "event": "user_joined",
            "user_id": user.id,
            "username": user.username,
            "message": f"{user.username} присоединился к лобби."
        },
        room_id=room_id
    )

    try:
        while True:
            # 1. Ждем JSON от клиента
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
                continue

            action = data.get("action")

            # 2. Обработка отправки кода
            if action == "submit_code":
                code_text = data.get("code")
                
                # Получаем текущий статус участника в комнате
                participant = db.query(RoomParticipant).filter(
                    RoomParticipant.room_id == room_id,
                    RoomParticipant.user_id == user.id
                ).first()

                if not participant:
                    await websocket.send_text(json.dumps({"error": "Вы не участник этой комнаты"}))
                    continue

                # Ищем задачу, которую он должен решать сейчас (по order_index)
                current_room_task = db.query(RoomTask).filter(
                    RoomTask.room_id == room_id,
                    RoomTask.order_index == participant.current_task_index
                ).first()

                if not current_room_task:
                    # Если задачи кончились (индекс вышел за пределы)
                    await websocket.send_text(json.dumps({
                        "event": "game_completed", 
                        "message": "Вы решили все задачи!"
                    }))
                    continue

                task = current_room_task.task

                # 3. Выполняем код в Docker
                exec_result = await CodeExecutor.run_python_code(code_text)
                
                is_correct = False
                output = ""

                # 4. Проверяем результат
                if exec_result["success"]:
                    output = exec_result["output"]
                    # Сравниваем с ожидаемым результатом (убираем лишние пробелы/переносы)
                    if output.strip() == task.expected_output.strip():
                        is_correct = True
                else:
                    # Если синтаксическая ошибка или таймаут
                    output = exec_result.get("error", "Unknown Error")

                # 5. Логируем попытку в БД
                submission = RoomSubmission(
                    room_id=room_id,
                    user_id=user.id,
                    task_id=task.id,
                    code_snapshot=code_text,
                    is_correct=is_correct
                )
                db.add(submission)

                # 6. Если код правильный — двигаем участника дальше
                if is_correct:
                    participant.current_task_index += 1
                    participant.score += task.task_score
                    participant.completed_tasks_count += 1
                    db.commit()

                    # Отправляем ЛИЧНОЕ сообщение об успехе и индексе следующей задачи
                    await websocket.send_text(json.dumps({
                        "event": "task_passed",
                        "next_task_index": participant.current_task_index,
                        "output": output
                    }))

                    # Собираем актуальный лидерборд для всей комнаты
                    participants = db.query(RoomParticipant).filter(RoomParticipant.room_id == room_id).order_by(RoomParticipant.score.desc()).all()
                    leaderboard = [
                        {
                            "username": p.user.username,
                            "score": p.score,
                            "completed_tasks": p.completed_tasks_count
                        } for p in participants
                    ]

                    # ОБЩАЯ рассылка: кто-то решил задачу, обновляем таблицу
                    await manager.broadcast({
                        "event": "leaderboard_update",
                        "leaderboard": leaderboard,
                        "message": f"{user.username} решил задачу!"
                    }, room_id=room_id)

                else:
                    # Код выполнился, но ответ неверный (или ошибка выполнения)
                    db.commit() 
                    await websocket.send_text(json.dumps({
                        "event": "task_failed",
                        "output": output,
                        "expected": task.expected_output
                    }))
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            message={
                "event": "user_left",
                "user_id": user.id,
                "username": user.username,
                "message": f"{user.username} отключился."
            },
            room_id=room_id
        )