# 🧠 AI-Code-Generator

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Java-11%20%7C%2017%20%7C%2021-orange?logo=openjdk&logoColor=white" alt="Java">
  <img src="https://img.shields.io/badge/Flask-3.x-black?logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

> **تطبيق متطور يستخدم الذكاء الاصطناعي لتوليد، فحص، اختبار، وتشغيل وتطبيق الأكواد البرمجية تلقائياً بلغتي Python و Java.**

---

## 🌟 الميزات الرئيسية (Key Features)

- ✨ **توليد الأكواد الذكي (Smart AI Code Generation):**
  - دعم كامل للغتي **Python** و **Java**.
  - محرك ذكاء اصطناعي ذكي مدمج يعمل محلياً دون الحاجة لمفتاح خارجي، مع إمكانية ربط **OpenAI (GPT-4o)** و **Anthropic (Claude 3.5)**.
- ⚡ **التنفيذ الفوري والترجمة (Live Sandbox Execution):**
  - تشغيل كود Python فورياً مع قياس الأداء وسرعة الاستجابة بالمللي ثانية (`ms`).
  - ترجمة وتشغيل كود Java (`javac` + `java`) تلقائياً مع معالجة ذكية لأسماء الـ Classes.
- 🔄 **مقارنة التغييرات وتطبيقها تلقائياً (Diff Viewer & Auto Patcher):**
  - عرض الفروقات جنباً إلى جنب (Side-by-Side Unified Diff) قبل اعتماد الكود.
  - زر بنقرة واحدة لتطبيق الكود المولد أو التراجع عنه.
- 🛠️ **أدوات المطور المتقدمة:**
  - **إعادة الهيكلة (Refactoring):** تحسين جودة الكود، إضافة Type Hints، ومراعاة معايير Clean Code.
  - **فحص وإصلاح الأخطاء (Bug Fixing):** كشف المشاكل المنطقية والنحوية وتقديم الكود المصحح مع الشرح.
  - **شرح وتحليل الكود (Code Explanation):** تفكيك وفهم منطق البرنامج خطوة بخطوة باللغة العربية والإنجليزية.
  - **توليد اختبارات الوحدة (Unit Test Generator):** إنشاء فحوصات تلقائية (`unittest` لـ Python و `JUnit` لـ Java).
  - **التحويل بين اللغات:** تحويل الكود بين Python و Java بسلاسة.
- 📁 **إدارة ملفات المشروع (Workspace Explorer):**
  - إنشاء، تعديل، وحذف ملفات متعددة داخل بيئة العمل.
  - تصدير وتنزيل المشروع كاملاً كملف مضغوط `ZIP`.
- 🌙 **واجهة مستخدم احترافية (Developer-Grade UI):**
  - محرر CodeMirror مدمج مع دعم كامل للألوان والتنسيق التلقائي.
  - دعم المظهر الداكن والفاتح (Dark / Light Themes).
  - دعم كامل للغتين العربية (RTL) والإنجليزية (LTR).
  - وحدة تحكم (Terminal / Console) تفاعلية.

---

## 📂 هيكل المشروع (Project Architecture)

```text
AI-Code-Generator/
├── app.py                      # خادم الويب وتوجيهات REST API
├── ai_engine.py                # محرك توليد وتعديل الكود بالذكاء الاصطناعي
├── code_runner.py              # البيئة المعزولة لتشغيل وترجمة Python و Java
├── file_manager.py             # إدارة ملفات مساحة العمل وتوليد الـ Diff والـ ZIP
├── db.py                       # قاعدة بيانات SQLite لسجل التوليد والقوالب
├── test_app.py                 # حزمة الاختبارات الآلية الشاملة
├── Dockerfile                  # حاوية Docker تدعم بيئتي Python و OpenJDK معاً
├── docker-compose.yml          # إعداد التشغيل السريع عبر Docker Compose
├── render.yaml                 # قالب النشر التلقائي على سحابة Render
├── requirements.txt            # متطلبات مكتبات Python
├── .env.example                # نموذج المتغيرات البيئية
├── templates/
│   └── index.html              # واجهة المستخدم التفاعلية المتكاملة
├── static/
│   ├── css/
│   │   └── style.css           # التصميم والتنسيقات الحديثة
│   └── js/
│       └── app.js              # المنطق البرمجي التفاعلي للعميل
└── workspace/                  # مجلد مساحة عمل وتجارب الأكواد
```

---

## 🚀 التشغيل السريع (Quick Start)

### 1. التشغيل المحلي (Local Machine)

تأكد من تثبيت **Python 3.10+** و **Java JDK 11+**:

```bash
# استنساخ المستودع
git clone https://github.com/Taibiilyes/AI-Code-Generator.git
cd AI-Code-Generator

# تثبيت المتطلبات
pip install -r requirements.txt

# تشغيل الخادم
python app.py
```

افتح المتصفح على: `http://localhost:5000`

---

### 2. التشغيل عبر Docker

لا يتطلب تثبيت Java أو إعداد البيئة يدوياً:

```bash
# بناء وتشغيل الحاوية
docker-compose up --build
```

افتح المتصفح على: `http://localhost:5000`

---

## 🧪 تشغيل الاختبارات الآلية (Running Tests)

```bash
python test_app.py
```

---

## 📡 واجهات برمجة التطبيقات (REST API Endpoints)

| Endpoint | Method | الوصف |
| :--- | :---: | :--- |
| `/api/health` | `GET` | فحص حالة الخادم واللغات المدعومة |
| `/api/generate` | `POST` | توليد أو تحسين أو إصلاح الكود بالذكاء الاصطناعي |
| `/api/execute` | `POST` | ترجمة وتشغيل كود Python أو Java في Sandbox |
| `/api/files` | `GET` | استعراض شجرة ملفات المشروع |
| `/api/files/save` | `POST` | حفظ وتحديث محتوى ملف |
| `/api/files/download-zip` | `GET` | تنزيل كامل المشروع كملف ZIP |
| `/api/diff` | `POST` | حساب ومقارنة الفروقات بين كودين |
| `/api/history` | `GET` | استرجاع سجل العمليات السابقة |

---

## 👤 المؤلف (Author)

- **إلياس طايبي (Ilyes Taibi)**
- GitHub: [@Taibiilyes](https://github.com/Taibiilyes)

## 📄 الترخيص (License)

هذا المشروع مرخص تحت رخصة **MIT**.
