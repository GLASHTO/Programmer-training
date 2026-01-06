import os

class Settings:
    PROJECT_NAME: str = "Code Battle Arena"
    PROJECT_VERSION: str = "1.0.0"
    
    # Настройки базы данных (PostgreSQL)
    # Формат: postgresql://user:password@host:port/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:your_password@localhost:5432/game_db")
    
    # Настройки безопасности
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 часа

settings = Settings()