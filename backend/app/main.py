from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as api_router
from app.core.database import Base, engine

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

# Подключаем все маршруты через один главный роутер
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Server is running"}