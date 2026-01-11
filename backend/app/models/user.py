from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from .game import Team
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    active = Column(Boolean, default=True)

    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    # team = relationship("Team", back_populates="user")
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    # submissions = relationship("Submission", back_populates="user")
    # score = relationship("UserScore", uselist=False, back_populates="user")

    # cascade delete
    score = relationship("UserScore", back_populates="user", cascade="all, delete-orphan", uselist=False)
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")