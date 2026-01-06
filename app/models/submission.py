from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from app.core.database import Base

### Логика:
# * `team_id = 0 / NULL` → соло
# * `team_id != 0` → командный сабмит
# * `status = True` → accepted
# * `status = False` → timeout
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

    score = Column(Integer, nullable=False)
    status = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    code = Column(Text, nullable=False)

    user = relationship("User", back_populates="submissions")
    team = relationship("Team", back_populates="submissions")
    task = relationship("Task", back_populates="submissions")



## UserScore (агрегат / кеш)
class UserScore(Base):
    __tablename__ = "user_scores"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    user_score = Column(Integer, nullable=False)

    user = relationship("User", back_populates="score")
    



## TeamScore (агрегат / кеш)
class TeamScore(Base):
    __tablename__ = "team_scores"

    team_id = Column(Integer, ForeignKey("teams.id"), primary_key=True)
    team_score = Column(Integer, nullable=False)

    team = relationship("Team", back_populates="score")
