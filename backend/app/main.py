from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as api_router
from app.core.database import Base, engine

from sqladmin import Admin, ModelView
from app.models.user import User, Team
from app.models.game import Task
from app.models.submission import Submission, UserScore, TeamScore

# Автоматическое создание таблиц при запуске (для учебного проекта это проще всего)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Code Battle Arena API")

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем объект админки
admin = Admin(app, engine)

# Описываем, как модели будут выглядеть в админке
class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username, User.active]
    column_searchable_list = [User.username]
    icon = "fa-solid fa-user"

class TaskAdmin(ModelView, model=Task):
    column_list = [Task.id, Task.title, Task.task_score, Task.task_time]
    icon = "fa-solid fa-list-check"

class SubmissionAdmin(ModelView, model=Submission):
    column_list = [Submission.id, Submission.user_id, Submission.task_id, Submission.status, Submission.created_at]
    column_sortable_list = [Submission.created_at]
    icon = "fa-solid fa-code"

class ScoreAdmin(ModelView, model=UserScore):
    column_list = [UserScore.user_id, UserScore.user_score]
    name = "Личный счет"
    icon = "fa-solid fa-star"

# Регистрируем представления
admin.add_view(UserAdmin)
admin.add_view(TaskAdmin)
admin.add_view(SubmissionAdmin)
admin.add_view(ScoreAdmin)

# Подключаем все маршруты через один главный роутер
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Server is running"}