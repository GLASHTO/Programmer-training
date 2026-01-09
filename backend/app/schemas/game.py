from pydantic import BaseModel
from typing import Optional, List

## Task
class TaskCreate(BaseModel):
    title: str
    description: str
    task_score: int
    task_time: int
    expected_output: str


class TaskOut(TaskCreate):
    id: int

    class Config:
        from_attributes = True

## Team
class TeamBase(BaseModel):
    team_name: str


class TeamOut(TeamBase):
    id: int

    class Config:
        from_attributes = True

## UserScore (агрегат)
class UserScoreOut(BaseModel):
    user_id: int
    score: int

    class Config:
        from_attributes = True


## TeamScore (агрегат)
class TeamScoreOut(BaseModel):
    team_id: int
    team_score: int

    class Config:
        from_attributes = True
