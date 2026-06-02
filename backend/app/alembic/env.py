from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Чтобы Alembic видел наш проект
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from app.core.config import settings
from app.core.database import Base  # Все ваши модели должны быть подключены здесь

# Конфигурация Alembic
config = context.config
fileConfig(config.config_file_name)

# Подключаем метаданные моделей
target_metadata = Base.metadata

def run_migrations_offline():
    """Миграции без подключения к базе (SQL скрипт)."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Миграции с подключением к базе."""
    connectable = engine_from_config(
        {},  # пустой конфиг, берем URL напрямую
        url=settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
