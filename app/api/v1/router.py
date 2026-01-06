from fastapi import APIRouter
from app.api.v1 import users, teams, tasks, games, auth

router = APIRouter()

# Объединяем все роутеры в один главный
router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(teams.router, prefix="/teams", tags=["Teams"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(games.router, prefix="/games", tags=["Games"])