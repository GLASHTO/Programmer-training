from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.room import RoomStatus

class RoomCreate(BaseModel):
    task_ids: List[int] # Список ID задач, которые будут в гонке
    time_limit_seconds: int = 0 # 0 означает без лимита

class RoomJoin(BaseModel):
    code: str

class RoomOut(BaseModel):
    id: int
    code: str
    creator_id: int
    status: RoomStatus
    time_limit_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True

class ParticipantOut(BaseModel):
    user_id: int
    username: str
    score: int
    completed_tasks_count: int

class RoomDetailsOut(RoomOut):
    participants: List[ParticipantOut] = []
    # Можно добавить список задач, если нужно