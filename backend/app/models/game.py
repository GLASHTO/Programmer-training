from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    task_score = Column(Integer, nullable=False)
    task_time = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)    # Название задачи
    description = Column(Text, nullable=False)      # ТЕКСТ ЗАДАНИЯ
    expected_output = Column(Text, nullable=False)

    submissions = relationship("Submission", back_populates="task")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    team_name = Column(String, nullable=False)

    # user = relationship("User", back_populates="team")
    # Добавляем владельца команды
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Указываем foreign_keys, чтобы SQLAlchemy не запуталась между owner_id и team_id в User
    members = relationship("User", back_populates="team", foreign_keys="[User.team_id]")
    
    submissions = relationship("Submission", back_populates="team")
    score = relationship("TeamScore", uselist=False, back_populates="team")
