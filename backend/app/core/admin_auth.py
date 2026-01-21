from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from app.core.security import verify_password, create_access_token
from app.core.database import SessionLocal
from app.models.user import User

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form.get("username"), form.get("password")

        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        db.close()

        if user and verify_password(password, user.hashed_password):
            token = create_access_token(data={"sub": user.username})
            request.session.update({"token": token})
            return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False
        # Здесь можно добавить проверку валидности JWT токена
        return True

# Секретный ключ для сессий админки
authentication_backend = AdminAuth(secret_key="SUPER_SECRET_ADMIN_KEY")