"""
Project Workspace & File Manager for AI-Code-Generator.
Handles project files, workspace directory tree, diff patching, backups, and ZIP export.
"""

import os
import shutil
import zipfile
import difflib
import io
from datetime import datetime
from typing import List, Dict, Any, Optional

WORKSPACE_ROOT = os.path.abspath(os.environ.get("WORKSPACE_DIR", os.path.join(os.path.dirname(__file__), "workspace")))

def ensure_workspace():
    """Ensures that the workspace directory exists with sample starter files."""
    if not os.path.exists(WORKSPACE_ROOT):
        os.makedirs(WORKSPACE_ROOT, exist_ok=True)
        # Create starter files
        sample_py = os.path.join(WORKSPACE_ROOT, "main.py")
        if not os.path.exists(sample_py):
            with open(sample_py, "w", encoding="utf-8") as f:
                f.write('''# تطبيق AI-Code-Generator التجريبي
def greet(name: str) -> str:
    return f"مرحباً {name}! تم توليد هذا الكود بنجاح."

if __name__ == "__main__":
    print(greet("المطور الذكي"))
''')

        sample_java = os.path.join(WORKSPACE_ROOT, "Main.java")
        if not os.path.exists(sample_java):
            with open(sample_java, "w", encoding="utf-8") as f:
                f.write('''// تطبيق Java تجريبي
public class Main {
    public static void main(String[] args) {
        System.out.println("مرحباً بك في AI-Code-Generator (Java)!");
    }
}
''')

def get_safe_path(rel_path: str) -> str:
    """Resolves relative path inside workspace, preventing directory traversal attacks."""
    ensure_workspace()
    # Normalize path
    clean_path = os.path.normpath(rel_path.lstrip("/\\"))
    full_path = os.path.abspath(os.path.join(WORKSPACE_ROOT, clean_path))
    if not full_path.startswith(WORKSPACE_ROOT):
        raise ValueError("مسار الملف غير مسموح به (Directory Traversal Detected).")
    return full_path

def list_workspace_tree() -> List[Dict[str, Any]]:
    """Returns a tree structure of files and folders in workspace."""
    ensure_workspace()
    tree = []

    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Ignore hidden dirs or backups
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__" and d != "backups"]
        
        rel_root = os.path.relpath(root, WORKSPACE_ROOT)
        current_folder = "" if rel_root == "." else rel_root

        for f in sorted(files):
            if f.startswith(".") or f.endswith(".bak"):
                continue
            full_file_path = os.path.join(root, f)
            rel_file_path = os.path.relpath(full_file_path, WORKSPACE_ROOT).replace("\\", "/")
            stat = os.stat(full_file_path)
            
            # Determine language
            ext = os.path.splitext(f)[1].lower()
            lang = "python" if ext in [".py"] else "java" if ext in [".java"] else "text"

            tree.append({
                "name": f,
                "path": rel_file_path,
                "size": stat.st_size,
                "language": lang,
                "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            })

    return tree

def read_workspace_file(rel_path: str) -> Dict[str, Any]:
    """Reads content of a workspace file."""
    full_path = get_safe_path(rel_path)
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise FileNotFoundError(f"الملف '{rel_path}' غير موجود.")
    
    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    ext = os.path.splitext(full_path)[1].lower()
    lang = "python" if ext == ".py" else "java" if ext == ".java" else "text"

    return {
        "path": rel_path.replace("\\", "/"),
        "content": content,
        "language": lang,
        "lines": len(content.splitlines()),
        "size": len(content.encode("utf-8"))
    }

def save_workspace_file(rel_path: str, content: str, create_backup: bool = True) -> Dict[str, Any]:
    """Writes content to a workspace file with optional backup."""
    full_path = get_safe_path(rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    # Backup existing file if needed
    if create_backup and os.path.exists(full_path):
        backup_dir = os.path.join(WORKSPACE_ROOT, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        clean_name = os.path.basename(full_path)
        shutil.copy2(full_path, os.path.join(backup_dir, f"{clean_name}.{timestamp}.bak"))

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

    return {
        "success": True,
        "path": rel_path.replace("\\", "/"),
        "size": len(content.encode("utf-8")),
        "message": f"تم حفظ الملف '{rel_path}' بنجاح."
    }

def delete_workspace_file(rel_path: str) -> bool:
    """Deletes a file from the workspace."""
    full_path = get_safe_path(rel_path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        os.remove(full_path)
        return True
    return False

def compute_diff(old_code: str, new_code: str, filename: str = "file") -> str:
    """Computes unified diff between old code and new AI-generated code."""
    old_lines = old_code.splitlines(keepends=True)
    new_lines = new_code.splitlines(keepends=True)
    diff = difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=f"a/{filename} (Original)",
        tofile=f"b/{filename} (AI Modified)",
        lineterm=""
    )
    return "".join(diff)

def export_workspace_zip() -> io.BytesIO:
    """Packages all workspace files into an in-memory ZIP archive."""
    ensure_workspace()
    mem_zip = io.BytesIO()
    with zipfile.ZipFile(mem_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(WORKSPACE_ROOT):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["__pycache__", "backups"]]
            for file in files:
                if file.startswith(".") or file.endswith(".bak"):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, WORKSPACE_ROOT)
                zf.write(full_path, arcname=rel_path)
    mem_zip.seek(0)
    return mem_zip
