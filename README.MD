# Code Battle Arena

Веб-приложение для проведения соревнований по программированию с системой автоматической проверки кода.

## 🛠 Технологический стек

* **Frontend:** React, Vite, HTML/CSS (Hybrid MPA)
* **Backend:** Python 3.13, FastAPI, Uvicorn
* **Database:** PostgreSQL (в Docker контейнере)
* **Sandbox:** Docker (для безопасного исполнения кода)

## 📋 Предварительные требования

Перед запуском убедитесь, что у вас установлены:

1. **Docker** (и запущен демон Docker).
2. **Python 3.13** или новее.
3. **Node.js** (версия 18+ рекомендуется) и **npm**.

## 🚀 Установка и настройка (Первый запуск)

### 1. Настройка Базы Данных

Убедитесь, что контейнер с базой данных создан (используя `docker-compose` или вручную). Если контейнер `game_db_cont` уже существует, этот шаг можно пропустить.

```bash
cd backend
docker-compose up -d db

```

### 2. Настройка Backend

```bash
cd backend
# Создание виртуального окружения
python3.13 -m venv venv

# Активация (Linux/macOS)
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

```

### 3. Настройка Frontend

```bash
cd frontend-html
npm install

```

---

## ▶️ Запуск проекта

Для работы приложения необходимо открыть **3 терминала** и выполнить следующие команды:

### Терминал 1: База Данных

Запуск существующего контейнера с базой данных PostgreSQL.

```bash
docker start game_db_cont && docker attach game_db_cont

```

### Терминал 2: Backend (API)

Запуск сервера FastAPI.

```bash
# Переход в папку проекта (замените путь на свой при необходимости)
cd backend

# Активация виртуального окружения
source venv/bin/activate

# Запуск сервера
python3.13 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

```

* **API доступен по адресу:** `http://localhost:8000`
* **Документация (Swagger):** `http://localhost:8000/docs`

### Терминал 3: Frontend (Клиент)

Запуск сервера разработки Vite.

```bash
# Переход в папку фронтенда
cd frontend-html

# Запуск в режиме разработки
npm run dev

```

* **Приложение доступно по адресу:** `http://localhost:3000`

---

## 📜 Скрипт быстрого запуска (для Linux/macOS)

Вы можете сохранить этот код в файл `start.sh` в корне проекта для быстрого запуска всех сервисов (потребует установки `gnome-terminal` или аналогичного, либо ручного запуска).

Если вы хотите запускать всё одной командой последовательно (как в вашем примере), используйте этот блок:

```bash
#!/bin/bash

# 1. Запуск БД
echo "Starting Database..."
docker start game_db_cont

# 2. Запуск Backend (в фоне или отдельном окне, здесь пример последовательного запуска)
echo "Starting Backend..."
source ./backend/venv/bin/activate
cd ./backend
# Запускаем в фоне, чтобы скрипт продолжился
python3.13 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 3. Запуск Frontend
echo "Starting Frontend..."
cd ../frontend-html
npm run dev

# При остановке скрипта убиваем процесс бэкенда
kill $BACKEND_PID

```


## 🐛 Возможные проблемы

* **Порт 8000 занят:** Остановите другие процессы Python или измените порт в команде запуска uvicorn.
* **Ошибка подключения к БД:** Убедитесь, что контейнер `game_db_cont` запущен (`docker ps`) и настройки в `.env` файле (или `config.py`) соответствуют параметрам контейнера.
* **Python not found:** Убедитесь, что `python3.13` установлен и добавлен в PATH.