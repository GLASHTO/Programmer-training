from pydantic import BaseModel
from typing import Optional
from datetime import datetime

## Создание сабмита, user_id также не нужен так как берется из токена, team_id не нужен так как берем это значение из БД
class SubmissionCreate(BaseModel):
    # user_id: int
    task_id: int
    code: str


## Ответ API
class SubmissionOut(BaseModel):
    id: int
    user_id: int
    task_id: int
    team_id: Optional[int]
    score: int
    status: bool
    created_at: datetime
    code: str

    class Config:
        from_attributes = True

