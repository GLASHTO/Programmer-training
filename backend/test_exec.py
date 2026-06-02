import asyncio
from app.services.code_executor import CodeExecutor

async def main():
    executor = CodeExecutor()
    # Тест 1: Обычный код
    res = await executor.run_python_code("print(2 + 2)")
    print(f"Test 1 (4?): {res}")

    # Тест 2: Ошибка в коде
    res = await executor.run_python_code("print(x)")
    print(f"Test 2 (Error?): {res}")

    # Тест 3: Бесконечный цикл (Таймаут)
    res = await executor.run_python_code("while True: pass", timeout=2)
    print(f"Test 3 (Timeout?): {res}")

if __name__ == "__main__":
    asyncio.run(main())