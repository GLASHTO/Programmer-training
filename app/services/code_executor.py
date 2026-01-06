import subprocess
import tempfile
import os
import asyncio
import shutil

class CodeExecutor:


    # @staticmethod
    # async def run_python_code(code: str, timeout: int = 5):
    #     print("ExecuteStarted")
    #     # print(code)
    #     # Создаем временную директорию для файла с кодом
    #     with tempfile.TemporaryDirectory() as tmpdir:
    #         code_path = os.path.join(tmpdir, "main.py")
    #         with open(code_path, "w") as f:
    #             f.write(code)

    #         # Команда запуска Docker
    #         command = [
    #             "docker", "run", "--rm",
    #             "--network", "none",
    #             "--memory", "128m",
    #             "--cpus", "0.5",
    #             "-v", f"{tmpdir}:/app:ro",
    #             "sandbox-python",
    #             "python", "/app/main.py"
    #         ]

    #         try:
    #             # Запускаем процесс асинхронно
    #             proc = await asyncio.create_subprocess_exec(
    #                 *command,
    #                 stdout=asyncio.subprocess.PIPE,
    #                 stderr=asyncio.subprocess.PIPE
    #             )

    #             try:
    #                 stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                    
    #                 if proc.returncode == 0:
    #                     return {"success": True, "output": stdout.decode().strip()}
    #                 else:
    #                     return {"success": False, "error": stderr.decode().strip()}

    #             except asyncio.TimeoutError:
    #                 proc.kill()
    #                 return {"success": False, "error": "Превышено время ожидания (Timeout)"}

    #         except Exception as e:
    #             return {"success": False, "error": str(e)}


# Второй этап ТОЧНО РАБОТАЕТ с ТЕСТОМ
    @staticmethod
    async def run_python_code(code: str, timeout: int = 5):
        print("ExecuteStarted")   
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = os.path.abspath(tmpdir)
            code_path = os.path.join(tmpdir, "main.py")

            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)

            with open(code_path, "r", encoding="utf-8") as f:
                print(f.read(), "# ::::::File Writed")

            command = [
                "docker", "run", "--rm",
                "--network", "none",
                "--memory", "128m",
                "--cpus", "0.5",
                "--pids-limit", "64",
                "--read-only",
                "--tmpfs", "/tmp",
                "-v", f"{tmpdir}:/app:ro",
                "sandbox-python",
                "python", "/app/main.py"
            ]

            try:
                proc = await asyncio.create_subprocess_exec(
                    *command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                print("EXIT CODE:",proc.returncode)
                try:
                    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout)
                    stdout = stdout.decode()[:10000].strip()
                    stderr = stderr.decode()[:10000].strip()
                    print("EXIT CODE:",proc.returncode)
                    if proc.returncode == 0:
                        return {"success": True, "output": stdout}
                    return {"success": False, "error": stderr}

                except asyncio.TimeoutError:
                    proc.kill()
                    await proc.wait()
                    return {"success": False, "error": "Timeout"}

            except FileNotFoundError:
                return {"success": False, "error": "Docker не доступен"}
            except Exception as e:
                return {"success": False, "error": str(e)}

# # Третий этап: ПРОБА СОЗДАТЬ TEMPDIR в корне проекта
#     @staticmethod
#     async def run_python_code(code: str, timeout: int = 5):
#         # 1. Создаем папку temp_code в корне проекта (где лежит Back)
#         # Это решит проблему с путями в Windows
#         base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__))) # Выходим на уровень Back/
#         print("base-dir::::", base_dir)
#         tmpdir = os.path.join(base_dir, "temp_submissions")
        
#         if not os.path.exists(tmpdir):
#             os.makedirs(tmpdir)

#         # Создаем уникальное имя файла для этого запуска
#         import uuid
#         run_id = str(uuid.uuid4())
#         file_name = f"code_{run_id}.py"
#         code_path = os.path.join(tmpdir, file_name)

#         with open(code_path, "w", encoding="utf-8") as f:
#             f.write(code)

#         # 2. Команда запуска
#         # Монтируем файл напрямую как /app/main.py
#         command = [
#             "docker", "run", "--rm",
#             "--network", "none",
#             "--memory", "128m",
#             "--cpus", "0.5",
#             "-v", f"{os.path.abspath(code_path)}:/app/main.py:ro",
#             "sandbox-python",
#             "python", "/app/main.py"
#         ]

#         try:
#             proc = await asyncio.create_subprocess_exec(
#                 *command,
#                 stdout=asyncio.subprocess.PIPE,
#                 stderr=asyncio.subprocess.PIPE
#             )

#             try:
#                 stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                
#                 # Удаляем файл после выполнения
#                 if os.path.exists(code_path):
#                     os.remove(code_path)

#                 if proc.returncode == 0:
#                     return {"success": True, "output": stdout.decode().strip()}
#                 else:
#                     return {"success": False, "error": stderr.decode().strip()}

#             except asyncio.TimeoutError:
#                 if proc: proc.kill()
#                 if os.path.exists(code_path): os.remove(code_path)
#                 return {"success": False, "error": "Timeout"}

#         except Exception as e:
#             if os.path.exists(code_path): os.remove(code_path)
#             return {"success": False, "error": str(e)}



# Четвертая проба, свои импорты и способы отредактировать путь
# import os
# import asyncio
# import uuid

# class CodeExecutor:
#     @staticmethod
#     async def run_python_code(code: str, timeout: int = 5):
#         # 1. Создаем локальную папку для кодов, если её нет
#         # Она будет создана там, откуда вы запускаете uvicorn
#         tmp_folder = "temp_codes"
#         if not os.path.exists(tmp_folder):
#             os.makedirs(tmp_folder)

#         # Уникальное имя файла
#         file_id = str(uuid.uuid4())
#         file_name = f"{file_id}.py"
#         host_path = os.path.join(os.getcwd(), tmp_folder, file_name)
        
#         # Записываем код
#         with open(host_path, "w", encoding="utf-8") as f:
#             f.write(code)

#         # 2. Формируем путь для Docker
#         # В Windows Docker ожидает пути в формате /c/users/docs/.. или через прямые слеши
#         # os.path.abspath(host_path) вернет C:\... - заменим слеши
#         abs_path = os.path.abspath(host_path).replace("\\", "/")
        
#         # Если путь начинается с C:/, Docker иногда лучше понимает /c/
#         # if abs_path.get(1) == ":":
#         #     abs_path = "/" + abs_path[0].lower() + abs_path[2:]

#         # Исправляем ошибку: используем индексы строк [1] вместо .get(1)
#         # И преобразуем C:/ в /c/ для Docker
#         if len(abs_path) > 1 and abs_path[1] == ":":
#             abs_path = "/" + abs_path[0].lower() + abs_path[2:]

#         command = [
#             "docker", "run", "--rm",
#             "--network", "none",
#             "--memory", "128m",
#             "--cpus", "0.5",
#             "-v", f"{abs_path}:/app/main.py:ro", # Монтируем файл как /app/main.py
#             "sandbox-python",
#             "python", "/app/main.py"
#         ]

#         try:
#             proc = await asyncio.create_subprocess_exec(
#                 *command,
#                 stdout=asyncio.subprocess.PIPE,
#                 stderr=asyncio.subprocess.PIPE
#             )

#             try:
#                 stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                
#                 # Удаляем временный файл
#                 if os.path.exists(host_path):
#                     os.remove(host_path)

#                 if proc.returncode == 0:
#                     out = stdout.decode().strip()
#                     return {"success": True, "output": out}
#                 else:
#                     err = stderr.decode().strip()
#                     return {"success": False, "error": err}

#             except asyncio.TimeoutError:
#                 if proc: proc.kill()
#                 if os.path.exists(host_path): os.remove(host_path)
#                 return {"success": False, "error": "Timeout"}

#         except Exception as e:
#             if os.path.exists(host_path): os.remove(host_path)
#             return {"success": False, "error": str(e)}

    # @staticmethod
    # async def run_python_code(code: str, timeout: int = 5):
    #     # Команда: запускаем питон и говорим ему читать код из стандартного ввода (stdin)
    #     command = [
    #         "docker", "run", "--rm", "-i", # -i позволяет передавать данные
    #         "--network", "none",
    #         "--memory", "128m",
    #         "--cpus", "0.5",
    #         "sandbox-python",
    #         "python", "-c", code # Выполняем код напрямую как строку
    #     ]

    #     try:
    #         proc = await asyncio.create_subprocess_exec(
    #             *command,
    #             stdout=asyncio.subprocess.PIPE,
    #             stderr=asyncio.subprocess.PIPE
    #         )

    #         try:
    #             # Ждем выполнения
    #             stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                
    #             if proc.returncode == 0:
    #                 out = stdout.decode().strip()
    #                 return {"success": True, "output": out}
    #             else:
    #                 err = stderr.decode().strip()
    #                 return {"success": False, "error": err}

    #         except asyncio.TimeoutError:
    #             if proc:
    #                 try: proc.kill()
    #                 except: pass
    #             return {"success": False, "error": "Timeout"}

    #     except Exception as e:
    #         return {"success": False, "error": str(e)}