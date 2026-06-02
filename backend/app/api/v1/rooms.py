from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List
import random
import string
import json
import asyncio

from app.services.code_executor import CodeExecutor
from app.core.database import get_db
from app.models.room import Room, RoomTask, RoomParticipant, RoomStatus, RoomSubmission
from app.models.game import Task
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.room import RoomCreate, RoomJoin, RoomOut, RoomDetailsOut
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
    valid_tasks = db.query(Task).filter(Task.id.in_(data.task_ids)).all()
    if len(valid_tasks) != len(data.task_ids):
        raise HTTPException(status_code=400, detail="Some tasks do not exist.")

    while True:
        code = generate_room_code()
        if not db.query(Room).filter(Room.code == code).first():
            break 

    new_room = Room(
        code=code,
        creator_id=current_user.id,
        time_limit_seconds=data.time_limit_seconds,
        status=RoomStatus.WAITING
    )
    db.add(new_room)
    db.flush() 

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
    room = db.query(Room).filter(Room.code == data.code).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or code is invalid")
    
    if room.status != RoomStatus.WAITING:
        raise HTTPException(status_code=403, detail="Соревнование уже запущено или завершено. Вход закрыт.")

    existing_participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room.id,
        RoomParticipant.user_id == current_user.id
    ).first()

    if existing_participant:
        return {"status": "ok", "message": "Already in room", "room_id": room.id}

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
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

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

@router.get("/{room_id}/current-state")
def get_room_current_state(
    room_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room_id,
        RoomParticipant.user_id == current_user.id
    ).first()

    current_task = None
    if participant:
        task_rel = db.query(RoomTask).filter(
            RoomTask.room_id == room_id,
            RoomTask.order_index == participant.current_task_index
        ).first()
        if task_rel:
            current_task = task_rel.task

    participants = db.query(RoomParticipant).filter(RoomParticipant.room_id == room_id).all()
    leaderboard = [
        {
            "username": p.user.username,
            "score": p.score,
            "completed_tasks": p.completed_tasks_count
        } for p in participants
    ]

    return {
        "room": {
            "id": room.id,
            "code": room.code,
            "status": room.status
        },
        "current_task": current_task,
        "leaderboard": leaderboard
    }

def get_ws_current_user(token: str, db: Session):
    try:
        user = get_current_user(token=token, db=db) 
        return user
    except Exception as e:
        print(f"WS Auth Error: {e}")
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
            "message": f"{user.username} вошел на боевую арену."
        },
        room_id=room_id
    )

    try:
        # ЕДИНСТВЕННЫЙ цикл прослушивания
        while True:
            raw_data = await websocket.receive_text()
            
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"event": "error", "message": "Invalid JSON format"}))
                continue

            action = data.get("action")

            # --- НОВЫЙ БЛОК: ЗАПУСК ИГРЫ УЧИТЕЛЕМ ---
            if action == "start_game":
                current_room = db.query(Room).filter(Room.id == room_id).first()
                
                # Проверяем, что нажал именно создатель
                if current_room.creator_id != user.id:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Только создатель может запустить игру!"}))
                    continue
                
                if current_room.status != RoomStatus.WAITING:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Соревнование уже запущено!"}))
                    continue

                # Берем лимит времени (в секундах) из запроса
                time_limit = int(data.get("time_limit", 3600))
                
                # Обновляем БД
                from datetime import datetime
                current_room.status = RoomStatus.ACTIVE
                current_room.time_limit_seconds = time_limit
                current_room.started_at = datetime.utcnow()
                db.commit()

                # Рассылаем ВСЕМ сигнал о старте и лимит времени
                await manager.broadcast({
                    "event": "game_started",
                    "time_limit": time_limit,
                    "message": "Соревнование началось! Удачи!"
                }, room_id=room_id)
                continue

            # --- НОВЫЙ БЛОК: ДОСРОЧНОЕ ЗАВЕРШЕНИЕ ИГРЫ ---
            if action == "force_end_game":
                current_room = db.query(Room).filter(Room.id == room_id).first()
                
                # Проверяем, что нажал именно создатель
                if current_room.creator_id != user.id:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Только создатель может завершить игру!"}))
                    continue
                
                if current_room.status == RoomStatus.FINISHED:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Игра уже завершена!"}))
                    continue

                # Обновляем статус комнаты в БД
                current_room.status = RoomStatus.FINISHED
                db.commit()

                # Собираем актуальный лидерборд напоследок
                participants = db.query(RoomParticipant).filter(RoomParticipant.room_id == room_id).order_by(RoomParticipant.score.desc()).all()
                leaderboard = [
                    {
                        "username": p.user.username,
                        "score": p.score,
                        "completed_tasks": p.completed_tasks_count
                    } for p in participants
                ]

                # Делаем массовую рассылку ВСЕМ участникам
                await manager.broadcast({
                    "event": "game_completed",
                    "leaderboard": leaderboard,
                    "message": "⚠️ Соревнование было досрочно завершено организатором!"
                }, room_id=room_id)
                continue
            # --- КОНЕЦ НОВОГО БЛОКА ---

            if action == "submit_code":
                code_text = data.get("code")

                current_room = db.query(Room).filter(Room.id == room_id).first()
                if current_room.status == RoomStatus.FINISHED:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Соревнование уже завершено!"}))
                    continue
                
                participant = db.query(RoomParticipant).filter(
                    RoomParticipant.room_id == room_id,
                    RoomParticipant.user_id == user.id
                ).first()

                if not participant:
                    await websocket.send_text(json.dumps({"event": "error", "message": "Вы не участник этой комнаты"}))
                    continue

                current_room_task = db.query(RoomTask).filter(
                    RoomTask.room_id == room_id,
                    RoomTask.order_index == participant.current_task_index
                ).first()

                if not current_room_task:
                    await websocket.send_text(json.dumps({
                        "event": "game_completed", 
                        "message": "Вы решили все задачи!"
                    }))
                    continue

                task = current_room_task.task

                # Выполняем код
                try:
                    exec_result = await CodeExecutor.run_python_code(code_text)
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "event": "task_failed",
                        "output": f"Ошибка выполнения: {str(e)}",
                        "expected": task.expected_output
                    }))
                    continue
                
                is_correct = False
                output = ""

                if exec_result["success"]:
                    output = exec_result["output"]
                    if output.strip() == task.expected_output.strip():
                        is_correct = True
                else:
                    output = exec_result.get("error", "Unknown Error")

                submission = RoomSubmission(
                    room_id=room_id,
                    user_id=user.id,
                    task_id=task.id,
                    code_snapshot=code_text,
                    is_correct=is_correct
                )
                db.add(submission)

                if is_correct:
                    participant.current_task_index += 1
                    participant.score += task.task_score
                    participant.completed_tasks_count += 1
                    db.commit()

                    participants = db.query(RoomParticipant).filter(RoomParticipant.room_id == room_id).order_by(RoomParticipant.score.desc()).all()
                    leaderboard = [
                        {
                            "username": p.user.username,
                            "score": p.score,
                            "completed_tasks": p.completed_tasks_count
                        } for p in participants
                    ]

                    next_room_task = db.query(RoomTask).filter(
                        RoomTask.room_id == room_id,
                        RoomTask.order_index == participant.current_task_index
                    ).first()

                    next_task_data = None
                    if next_room_task:
                        nt = next_room_task.task
                        next_task_data = {
                            "id": nt.id,
                            "title": nt.title,
                            "description": nt.description,
                            "expected_output": nt.expected_output,
                            "task_score": nt.task_score,
                            "task_time": nt.task_time
                        }

                    # Отправляем ЛИЧНОЕ сообщение победителю (чтобы сбросилась кнопка и показался успех)
                    await websocket.send_text(json.dumps({
                        "event": "task_passed",
                        "next_task_index": participant.current_task_index,
                        "output": output,
                        "next_task": next_task_data
                    }))

                    if next_room_task:
                        # Соревнование продолжается
                        await manager.broadcast({
                            "event": "leaderboard_update",
                            "leaderboard": leaderboard,
                            "message": f"{user.username} решил задачу!"
                        }, room_id=room_id)
                    else:
                        # Игра закончена
                        current_room.status = RoomStatus.FINISHED
                        db.commit()

                        # Даем фронтенду победителя 1 секунду на рендер плашки "Успех"
                        await asyncio.sleep(1)

                        # И делаем рассылку всем об окончании
                        await manager.broadcast({
                            "event": "game_completed",
                            "leaderboard": leaderboard,
                            "message": f"🏆 Соревнование завершено! Победитель: {user.username}"
                        }, room_id=room_id)

                else:
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