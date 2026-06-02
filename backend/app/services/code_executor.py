import tempfile
import os
import asyncio

class CodeExecutor:

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