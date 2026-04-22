from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class RoomStatus(str, enum.Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    
    # Ссылка на таблицу users
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(Enum(RoomStatus), default=RoomStatus.WAITING, nullable=False)
    time_limit_seconds = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    # Связи (используем строки)
    creator = relationship("User", back_populates="created_rooms")
    tasks = relationship("RoomTask", back_populates="room", cascade="all, delete-orphan", order_by="RoomTask.order_index")
    participants = relationship("RoomParticipant", back_populates="room", cascade="all, delete-orphan")
    submissions = relationship("RoomSubmission", back_populates="room", cascade="all, delete-orphan")


class RoomTask(Base):
    __tablename__ = "room_tasks"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    
    order_index = Column(Integer, nullable=False)

    # Связи
    room = relationship("Room", back_populates="tasks")
    task = relationship("Task", back_populates="room_tasks")

    __table_args__ = (
        UniqueConstraint('room_id', 'order_index', name='uq_room_task_order'),
    )


class RoomParticipant(Base):
    __tablename__ = "room_participants"

    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    current_task_index = Column(Integer, default=0, nullable=False)
    score = Column(Integer, default=0, nullable=False)
    completed_tasks_count = Column(Integer, default=0, nullable=False)
    
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)

    # Связи
    room = relationship("Room", back_populates="participants")
    user = relationship("User", back_populates="room_participations")


class RoomSubmission(Base):
    __tablename__ = "room_submissions"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    
    code_snapshot = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Связи
    room = relationship("Room", back_populates="submissions")
    user = relationship("User", back_populates="room_submissions")
    task = relationship("Task", back_populates="room_submissions")

    __table_args__ = (
        Index('ix_room_user_task_correct', 'room_id', 'user_id', 'task_id', 'is_correct'),
    )

