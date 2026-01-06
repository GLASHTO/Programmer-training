from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:your_password@localhost:5432/game_db")

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.scalar())
