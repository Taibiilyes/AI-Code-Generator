"""
Automated Test Suite for AI-Code-Generator.
Verifies REST APIs, Python/Java execution sandboxes, AI engine, and database integrity.
"""

import unittest
import json
import os
import shutil
from app import app
import db
import code_runner
import file_manager
import ai_engine

class TestAICodeGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.client = app.test_client()
        db.init_db()
        file_manager.ensure_workspace()

    def test_01_health_check(self):
        """Test health check endpoint."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("python", data["supported_languages"])
        self.assertIn("java", data["supported_languages"])

    def test_02_python_execution(self):
        """Test executing Python code in sandbox."""
        py_code = 'print("Testing Python Execution: OK")'
        result = code_runner.execute_code("python", py_code)
        self.assertTrue(result["success"])
        self.assertIn("Testing Python Execution: OK", result["stdout"])
        self.assertEqual(result["exit_code"], 0)

    def test_03_java_execution(self):
        """Test compiling and executing Java code in sandbox."""
        java_code = '''
        public class Main {
            public static void main(String[] args) {
                System.out.println("Testing Java Execution: OK");
            }
        }
        '''
        result = code_runner.execute_code("java", java_code)
        self.assertTrue(result["success"])
        self.assertIn("Testing Java Execution: OK", result["stdout"])
        self.assertEqual(result["exit_code"], 0)

    def test_04_ai_generation_offline(self):
        """Test smart AI code generation without API key."""
        res_py = ai_engine.generate_ai_code("أنشئ خادم REST API", "python", "generate")
        self.assertIn("code", res_py)
        self.assertTrue(len(res_py["code"]) > 50)
        self.assertEqual(res_py["language"], "python")

        res_java = ai_engine.generate_ai_code("نظام حسابات بنكية متقدم", "java", "generate")
        self.assertIn("code", res_java)
        self.assertTrue(len(res_java["code"]) > 50)
        self.assertEqual(res_java["language"], "java")

    def test_05_api_generate_endpoint(self):
        """Test /api/generate REST API endpoint."""
        payload = {
            "prompt": "خوارزمية الترتيب السريع QuickSort",
            "language": "python",
            "mode": "generate"
        }
        response = self.client.post(
            "/api/generate",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("code", data)

    def test_06_api_execute_endpoint(self):
        """Test /api/execute REST API endpoint."""
        payload = {
            "language": "python",
            "code": "import math\nprint(f'PI={round(math.pi, 2)}')"
        }
        response = self.client.post(
            "/api/execute",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("PI=3.14", data["stdout"])

    def test_07_file_manager_operations(self):
        """Test workspace file management and ZIP export."""
        # Save file
        save_res = file_manager.save_workspace_file("test_calc.py", "def add(a, b): return a + b\n")
        self.assertTrue(save_res["success"])

        # Read file
        read_res = file_manager.read_workspace_file("test_calc.py")
        self.assertIn("def add", read_res["content"])

        # Delete file
        del_res = file_manager.delete_workspace_file("test_calc.py")
        self.assertTrue(del_res)

        # Download ZIP
        zip_resp = self.client.get("/api/files/download-zip")
        self.assertEqual(zip_resp.status_code, 200)
        self.assertEqual(zip_resp.mimetype, "application/zip")

    def test_08_database_history(self):
        """Test saving and retrieving generation history."""
        hist_id = db.save_generation(
            prompt="Test Prompt",
            language="python",
            mode="generate",
            model="test-model",
            input_code="",
            generated_code="print('test')",
            explanation="Test explanation"
        )
        self.assertIsNotNone(hist_id)
        recent = db.get_recent_generations(5)
        self.assertTrue(len(recent) > 0)

if __name__ == "__main__":
    unittest.main()
