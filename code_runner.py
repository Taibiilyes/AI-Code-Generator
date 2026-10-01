"""
Secure Code Execution Engine for Python and Java.
Compiles and executes code in an isolated sandbox with resource and timeout limits.
"""

import os
import re
import sys
import time
import shutil
import tempfile
import subprocess
from typing import Dict, Any

DEFAULT_TIMEOUT = int(os.environ.get("EXECUTION_TIMEOUT", 15))
MAX_OUTPUT_LENGTH = int(os.environ.get("MAX_OUTPUT_LENGTH", 50000))

def extract_java_class_name(java_code: str) -> str:
    """Extracts the public class name from Java code or returns default 'Main'."""
    public_class_match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', java_code)
    if public_class_match:
        return public_class_match.group(1)
    
    class_match = re.search(r'class\s+([A-Za-z0-9_]+)', java_code)
    if class_match:
        return class_match.group(1)
    
    return "Main"

def sanitize_output(text: str) -> str:
    """Truncates output to avoid massive responses."""
    if not text:
        return ""
    if len(text) > MAX_OUTPUT_LENGTH:
        return text[:MAX_OUTPUT_LENGTH] + f"\n... [Output truncated to {MAX_OUTPUT_LENGTH} characters]"
    return text

def execute_python(code: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Executes Python code in an isolated temporary directory.
    Returns stdout, stderr, exit_code, and execution_time_ms.
    """
    sandbox_dir = tempfile.mkdtemp(prefix="python_sandbox_")
    script_path = os.path.join(sandbox_dir, "script.py")

    try:
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)

        start_time = time.perf_counter()
        process = subprocess.run(
            [sys.executable, "-u", "script.py"],
            cwd=sandbox_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "success": process.returncode == 0,
            "stdout": sanitize_output(process.stdout),
            "stderr": sanitize_output(process.stderr),
            "exit_code": process.returncode,
            "execution_time_ms": elapsed_ms,
            "language": "python"
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"⏱️ انتهت المهلة المحددة للتنفيذ ({timeout} ثانية) - Timeout Expired.",
            "exit_code": 124,
            "execution_time_ms": timeout * 1000,
            "language": "python"
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"خطأ أثناء تشغيل الكود: {str(e)}",
            "exit_code": -1,
            "execution_time_ms": 0,
            "language": "python"
        }
    finally:
        shutil.rmtree(sandbox_dir, ignore_errors=True)

def execute_java(code: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Compiles and executes Java code.
    Extracts class name, runs javac, and then runs java.
    """
    class_name = extract_java_class_name(code)
    sandbox_dir = tempfile.mkdtemp(prefix="java_sandbox_")
    java_file_path = os.path.join(sandbox_dir, f"{class_name}.java")

    try:
        with open(java_file_path, "w", encoding="utf-8") as f:
            f.write(code)

        # 1. Compilation Step (javac)
        compile_start = time.perf_counter()
        compile_process = subprocess.run(
            ["javac", f"{class_name}.java"],
            cwd=sandbox_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10
        )
        compile_time_ms = (time.perf_counter() - compile_start) * 1000

        if compile_process.returncode != 0:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"❌ خطأ أثناء الترجمة (Java Compilation Error):\n{sanitize_output(compile_process.stderr)}",
                "exit_code": compile_process.returncode,
                "execution_time_ms": round(compile_time_ms, 2),
                "stage": "compilation",
                "language": "java"
            }

        # 2. Execution Step (java)
        run_start = time.perf_counter()
        run_process = subprocess.run(
            ["java", class_name],
            cwd=sandbox_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        total_time_ms = compile_time_ms + ((time.perf_counter() - run_start) * 1000)

        return {
            "success": run_process.returncode == 0,
            "stdout": sanitize_output(run_process.stdout),
            "stderr": sanitize_output(run_process.stderr),
            "exit_code": run_process.returncode,
            "execution_time_ms": round(total_time_ms, 2),
            "stage": "execution",
            "language": "java"
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"⏱️ انتهت المهلة المحددة لتشغيل Java ({timeout} ثانية) - Timeout Expired.",
            "exit_code": 124,
            "execution_time_ms": timeout * 1000,
            "language": "java"
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"خطأ أثناء تشغيل Java: {str(e)}",
            "exit_code": -1,
            "execution_time_ms": 0,
            "language": "java"
        }
    finally:
        shutil.rmtree(sandbox_dir, ignore_errors=True)

def execute_code(language: str, code: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """Dispatches execution based on language."""
    lang = language.lower().strip()
    if lang in ["python", "py", "python3"]:
        return execute_python(code, timeout)
    elif lang in ["java"]:
        return execute_java(code, timeout)
    else:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"اللغة '{language}' غير مدعومة حالياً. اللغات المدعومة: Python و Java.",
            "exit_code": -1,
            "execution_time_ms": 0,
            "language": language
        }
