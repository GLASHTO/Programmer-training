from pydantic import BaseModel
from typing import Optional


### Базовая схема (общая)
class UserBase(BaseModel):
    username: str
    active: bool = True
    team_id: Optional[int] = None




### Создание пользователя
class UserCreate(BaseModel):
    username: str
    password: str




### Ответ API (без пароля)
class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

### Токен для JWT авторизации
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"