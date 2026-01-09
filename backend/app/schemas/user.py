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

### Аутентификация пользователя
class UserLogin(BaseModel):
    username: str
    password: str
    
class UserPasswChange(BaseModel):
    id: int
    password: str

### Ответ API (без пароля)
class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True

### Ответ API (без пароля)
class OneUserOut(UserBase):
    id: int

### Добавление пользователя в команду
class UserToTeam(BaseModel):
    user_id: int
    team_id: int

### Токен для JWT авторизации
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"