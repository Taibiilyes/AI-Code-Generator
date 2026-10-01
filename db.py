"""
Database management for AI-Code-Generator.
Handles history of generations, execution logs, and code snippets.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "ai_code_generator.db")

def get_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables in the SQLite database."""
    conn = get_connection()
    cursor = conn.cursor()

    # Table for AI code generation history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS generation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            language TEXT NOT NULL,
            mode TEXT NOT NULL,
            model TEXT,
            input_code TEXT,
            generated_code TEXT NOT NULL,
            explanation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table for code execution logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS execution_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            stdout TEXT,
            stderr TEXT,
            exit_code INTEGER,
            execution_time_ms REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table for saved code snippets / templates
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS snippets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()

    # Seed initial built-in templates if table is empty
    cursor.execute("SELECT COUNT(*) as count FROM snippets")
    count = cursor.fetchone()["count"]
    if count == 0:
        seed_default_snippets(conn)

    conn.close()

def seed_default_snippets(conn):
    """Seed initial high-quality Python & Java code templates."""
    cursor = conn.cursor()
    default_snippets = [
        (
            "Python: Fast HTTP API Server",
            "python",
            """from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleAPIHandler(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        if self.path == '/api/status':
            self._send_response({'status': 'online', 'service': 'AI-Code-Generator'})
        else:
            self._send_response({'message': f'Hello from Python! Path: {self.path}'})

def run_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), SimpleAPIHandler)
    print(f"🚀 Python HTTP Server running on http://localhost:{port}")
    server.serve_forever()

if __name__ == '__main__':
    print("Testing API Handler...")
    print("Ready to start server.")
""",
            "خادم API خفيف باستخدام مكتبات Python القياسية بدون متطلبات خارجية.",
            "api,server,web,python"
        ),
        (
            "Python: Data Analysis & Statistics",
            "python",
            """import math
from typing import List, Dict, Any

class DataAnalyzer:
    def __init__(self, data: List[float]):
        if not data:
            raise ValueError("Data list cannot be empty")
        self.data = sorted(data)

    def mean(self) -> float:
        return sum(self.data) / len(self.data)

    def median(self) -> float:
        n = len(self.data)
        mid = n // 2
        if n % 2 == 0:
            return (self.data[mid - 1] + self.data[mid]) / 2.0
        return float(self.data[mid])

    def variance(self) -> float:
        m = self.mean()
        return sum((x - m) ** 2 for x in self.data) / len(self.data)

    def std_dev(self) -> float:
        return math.sqrt(self.variance())

    def summary(self) -> Dict[str, Any]:
        return {
            "count": len(self.data),
            "min": min(self.data),
            "max": max(self.data),
            "mean": round(self.mean(), 4),
            "median": round(self.median(), 4),
            "std_dev": round(self.std_dev(), 4)
        }

if __name__ == '__main__':
    samples = [12.5, 18.2, 14.8, 22.1, 19.5, 30.0, 15.4, 26.8]
    analyzer = DataAnalyzer(samples)
    print("📊 إحصائيات البيانات:")
    for key, val in analyzer.summary().items():
        print(f"  - {key}: {val}")
""",
            "فئة تحليل إحصائي للبيانات وحساب المتوسط والانحراف المعياري.",
            "data,statistics,math,python"
        ),
        (
            "Java: Object-Oriented Banking System",
            "java",
            """import java.util.*;

public class Main {
    static class Account {
        private final String accountNumber;
        private final String ownerName;
        private double balance;
        private final List<String> transactions;

        public Account(String accountNumber, String ownerName, double initialBalance) {
            this.accountNumber = accountNumber;
            this.ownerName = ownerName;
            this.balance = initialBalance;
            this.transactions = new ArrayList<>();
            addTransaction("Account opened with balance: $" + initialBalance);
        }

        public synchronized void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
            balance += amount;
            addTransaction("Deposited: $" + amount + " | New Balance: $" + balance);
        }

        public synchronized boolean withdraw(double amount) {
            if (amount <= 0 || amount > balance) return false;
            balance -= amount;
            addTransaction("Withdrew: $" + amount + " | New Balance: $" + balance);
            return true;
        }

        private void addTransaction(String log) {
            transactions.add(new Date() + ": " + log);
        }

        public void printStatement() {
            System.out.println("========================================");
            System.out.println("Statement for: " + ownerName + " (" + accountNumber + ")");
            System.out.println("Current Balance: $" + String.format("%.2f", balance));
            System.out.println("---------------- Transactions ----------");
            for (String t : transactions) {
                System.out.println("  " + t);
            }
            System.out.println("========================================");
        }
    }

    public static void main(String[] args) {
        System.out.println("🚀 بدء تشغيل نظام الحسابات البنكية (Java OOP)");
        Account acc = new Account("ACC-98214", "Ilyes Taibi", 5000.0);
        acc.deposit(1250.50);
        acc.withdraw(300.00);
        acc.printStatement();
    }
}
""",
            "نظام مصرفي بلغة جافا يطبق مبادئ الكبسلة (Encapsulation) وتتبع المعاملات.",
            "oop,banking,threads,java"
        ),
        (
            "Java: Multi-Threaded Task Processor",
            "java",
            """import java.util.concurrent.*;
import java.util.*;

public class Main {
    static class TaskWorker implements Callable<String> {
        private final int taskId;

        public TaskWorker(int taskId) {
            this.taskId = taskId;
        }

        @Override
        public String call() throws Exception {
            long start = System.currentTimeMillis();
            Thread.sleep((long) (Math.random() * 500 + 200));
            long elapsed = System.currentTimeMillis() - start;
            return "Task #" + taskId + " completed in " + elapsed + " ms on " + Thread.currentThread().getName();
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("⚙️ تشغيل معالج المهام المتعددة بلغة Java (Concurrency)");
        int numThreads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        List<Future<String>> futures = new ArrayList<>();

        for (int i = 1; i <= 6; i++) {
            futures.add(executor.submit(new TaskWorker(i)));
        }

        for (Future<String> future : futures) {
            System.out.println("✅ " + future.get());
        }

        executor.shutdown();
        System.out.println("🎉 اكتملت جميع المهام بنجاح!");
    }
}
""",
            "معالجة متزامنة للمهام باستخدام ExecutorService و Callables بلغة Java.",
            "threads,concurrency,executor,java"
        )
    ]

    cursor.executemany(
        "INSERT INTO snippets (title, language, code, description, tags) VALUES (?, ?, ?, ?, ?)",
        default_snippets
    )
    conn.commit()

def save_generation(prompt, language, mode, model, input_code, generated_code, explanation=""):
    """Saves an AI generation record into the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO generation_history (prompt, language, mode, model, input_code, generated_code, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (prompt, language, mode, model, input_code, generated_code, explanation))
    conn.commit()
    history_id = cursor.lastrowid
    conn.close()
    return history_id

def get_recent_generations(limit=25):
    """Retrieves recent AI generations."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, prompt, language, mode, model, generated_code, explanation, created_at
        FROM generation_history
        ORDER BY id DESC
        LIMIT ?
    ''', (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def save_execution_log(language, code, stdout, stderr, exit_code, execution_time_ms):
    """Saves a code execution record into the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO execution_logs (language, code, stdout, stderr, exit_code, execution_time_ms)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (language, code, stdout, stderr, exit_code, execution_time_ms))
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    return log_id

def get_snippets(language=None):
    """Retrieves code templates/snippets, optionally filtered by language."""
    conn = get_connection()
    cursor = conn.cursor()
    if language:
        cursor.execute("SELECT * FROM snippets WHERE language = ? ORDER BY id ASC", (language.lower(),))
    else:
        cursor.execute("SELECT * FROM snippets ORDER BY id ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def save_snippet(title, language, code, description="", tags=""):
    """Saves a new custom snippet/template."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO snippets (title, language, code, description, tags)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, language, code, description, tags))
    conn.commit()
    snippet_id = cursor.lastrowid
    conn.close()
    return snippet_id

def clear_history():
    """Clears generation and execution history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM generation_history")
    cursor.execute("DELETE FROM execution_logs")
    conn.commit()
    conn.close()
