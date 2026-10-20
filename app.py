"""
AI-Code-Generator - Main Flask Web Application.
A full-stack AI-assisted development IDE for generating, executing, and applying Python & Java code.
"""

import os
import io
import base64
from PIL import Image
from flask import Flask, render_template, request, jsonify, send_file
import db
import code_runner
import file_manager
import ai_engine

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ai-code-generator-secret-2026")
app.config["JSON_AS_ASCII"] = False

# Initialize database and workspace on startup
db.init_db()
file_manager.ensure_workspace()

@app.route("/")
@app.route("/id-card")
def index():
    """Renders the Professional ID Card Maker Studio (برنامج صنع بطاقات التعريف الوظيفية)."""
    return render_template("id_card_maker.html")

@app.route("/ide")
def ide_workspace():
    """Renders the AI Code Generator IDE workspace dashboard."""
    return render_template("index.html")

@app.route("/download-standalone")
def download_standalone():
    """Downloads the 100% self-contained single-file offline HTML program."""
    standalone_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SSG_ID_Card_Maker.html")
    if os.path.exists(standalone_path):
        return send_file(
            standalone_path,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name="SSG_ID_Card_Maker.html"
        )
    return render_template("id_card_maker.html")

@app.route("/download-app-zip")
def download_app_zip():
    """Downloads the standalone program inside a ZIP archive."""
    zip_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SSG_ID_Card_Maker.zip")
    if os.path.exists(zip_path):
        return send_file(
            zip_path,
            mimetype="application/zip",
            as_attachment=True,
            download_name="SSG_ID_Card_Maker.zip"
        )
    return render_template("id_card_maker.html")

@app.route("/api/export-pdf", methods=["POST"])
def export_a4_pdf():
    """Creates a 300-DPI multi-page A4 PDF from rendered A4 sheet images and returns a download link."""
    data = request.get_json() or {}
    pages_b64 = data.get("pages", [])
    filename = data.get("filename", "Cartes_Professionnelles_A4.pdf")
    safe_name = "".join(c for c in filename if c.isalnum() or c in ("_", "-", ".")).strip() or "Cartes_A4.pdf"
    if not safe_name.lower().endswith(".pdf"):
        safe_name += ".pdf"

    if not pages_b64:
        return jsonify({"success": False, "error": "لا توجد صفحات لتصديرها."}), 400

    try:
        pil_pages = []
        for b64_str in pages_b64:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            raw = base64.b64decode(b64_str)
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            pil_pages.append(im)

        exports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "exports")
        os.makedirs(exports_dir, exist_ok=True)
        out_path = os.path.join(exports_dir, safe_name)

        first_page = pil_pages[0]
        rest_pages = pil_pages[1:]
        first_page.save(
            out_path,
            format="PDF",
            resolution=300.0,
            save_all=True,
            append_images=rest_pages
        )

        return jsonify({
            "success": True,
            "filename": safe_name,
            "download_url": f"/download-pdf/{safe_name}",
            "pages_count": len(pil_pages)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/download-pdf/<path:filename>", methods=["GET"])
def download_pdf_file(filename):
    """Serves a generated A4 PDF file for direct download or browser viewing."""
    safe_name = os.path.basename(filename)
    exports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "exports")
    file_path = os.path.join(exports_dir, safe_name)
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "ملف PDF غير موجود."}), 404
    as_attach = request.args.get("inline", "0") != "1"
    return send_file(
        file_path,
        mimetype="application/pdf",
        as_attachment=as_attach,
        download_name=safe_name
    )

@app.route("/api/cards", methods=["GET"])
def list_id_cards():
    """Lists all saved employee ID cards."""
    try:
        cards = db.get_id_cards()
        return jsonify({"success": True, "cards": cards})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/cards", methods=["POST"])
def save_id_card_route():
    """Saves or updates an employee ID card."""
    data = request.get_json() or {}
    title = data.get("title", "بطاقة موظف").strip() or "بطاقة موظف"
    card_data = data.get("card_data", {})
    card_id = data.get("id")
    try:
        saved_id = db.save_id_card(title=title, card_data=card_data, card_id=card_id)
        return jsonify({"success": True, "id": saved_id, "message": "تم حفظ البطاقة بنجاح."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/cards/<int:card_id>", methods=["DELETE"])
def delete_id_card_route(card_id):
    """Deletes a saved employee ID card."""
    try:
        deleted = db.delete_id_card(card_id)
        return jsonify({"success": deleted, "message": "تم حذف البطاقة بنجاح." if deleted else "البطاقة غير موجودة."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "AI-Code-Generator",
        "supported_languages": ["python", "java"],
        "version": "1.0.0"
    })

@app.route("/api/generate", methods=["POST"])
def generate():
    """Generates, refactors, fixes, or explains code using AI."""
    data = request.get_json() or {}
    prompt = data.get("prompt", "").strip()
    language = data.get("language", "python").lower()
    mode = data.get("mode", "generate")
    input_code = data.get("input_code", "")
    model = data.get("model")
    api_key = data.get("api_key")
    provider = data.get("provider", "auto")

    if not prompt and mode == "generate":
        return jsonify({"success": False, "error": "يرجى كتابة وصف أو طلب لما تريد توليده."}), 400

    try:
        result = ai_engine.generate_ai_code(
            prompt=prompt,
            language=language,
            mode=mode,
            input_code=input_code,
            model=model,
            api_key=api_key,
            provider=provider
        )

        # Save to database history
        history_id = db.save_generation(
            prompt=prompt,
            language=language,
            mode=mode,
            model=result.get("model", "auto"),
            input_code=input_code,
            generated_code=result.get("code", ""),
            explanation=result.get("explanation", "")
        )

        return jsonify({
            "success": True,
            "id": history_id,
            "code": result.get("code", ""),
            "explanation": result.get("explanation", ""),
            "language": result.get("language", language),
            "model": result.get("model", "built-in"),
            "mode": mode
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/execute", methods=["POST"])
def execute():
    """Compiles and executes code in Python or Java."""
    data = request.get_json() or {}
    code = data.get("code", "")
    language = data.get("language", "python")
    timeout = int(data.get("timeout", 15))

    if not code.strip():
        return jsonify({"success": False, "stderr": "لا يوجد كود لتنفيذه.", "exit_code": -1}), 400

    try:
        result = code_runner.execute_code(language, code, timeout=timeout)
        
        # Save execution log to DB
        db.save_execution_log(
            language=language,
            code=code,
            stdout=result.get("stdout", ""),
            stderr=result.get("stderr", ""),
            exit_code=result.get("exit_code", -1),
            execution_time_ms=result.get("execution_time_ms", 0)
        )

        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "stdout": "",
            "stderr": f"خطأ داخلي في الخادم أثناء التنفيذ: {str(e)}",
            "exit_code": -1,
            "execution_time_ms": 0
        }), 500

@app.route("/api/files", methods=["GET"])
def list_files():
    """Lists all files in the workspace tree."""
    try:
        tree = file_manager.list_workspace_tree()
        return jsonify({"success": True, "files": tree})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/files/read", methods=["GET"])
def read_file():
    """Reads a file from the workspace."""
    path = request.args.get("path", "")
    if not path:
        return jsonify({"success": False, "error": "المسار مطلوب."}), 400
    try:
        data = file_manager.read_workspace_file(path)
        return jsonify({"success": True, **data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404

@app.route("/api/files/save", methods=["POST"])
def save_file():
    """Saves content into a workspace file."""
    data = request.get_json() or {}
    path = data.get("path", "")
    content = data.get("content", "")
    if not path:
        return jsonify({"success": False, "error": "مسار الملف مطلوب."}), 400
    try:
        res = file_manager.save_workspace_file(path, content)
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/files/delete", methods=["POST"])
def delete_file():
    """Deletes a file from the workspace."""
    data = request.get_json() or {}
    path = data.get("path", "")
    if not path:
        return jsonify({"success": False, "error": "مسار الملف مطلوب."}), 400
    try:
        deleted = file_manager.delete_workspace_file(path)
        return jsonify({"success": deleted, "message": "تم حذف الملف بنجاح." if deleted else "الملف غير موجود."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/files/download-zip", methods=["GET"])
def download_zip():
    """Downloads entire workspace as a ZIP package."""
    try:
        mem_zip = file_manager.export_workspace_zip()
        return send_file(
            mem_zip,
            mimetype="application/zip",
            as_attachment=True,
            download_name="project_workspace.zip"
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/diff", methods=["POST"])
def get_diff():
    """Computes code diff between original and modified code."""
    data = request.get_json() or {}
    original = data.get("original", "")
    modified = data.get("modified", "")
    filename = data.get("filename", "code")
    diff_text = file_manager.compute_diff(original, modified, filename)
    return jsonify({"success": True, "diff": diff_text})

@app.route("/api/history", methods=["GET"])
def history():
    """Retrieves recent AI code generations."""
    limit = int(request.args.get("limit", 20))
    records = db.get_recent_generations(limit)
    return jsonify({"success": True, "history": records})

@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    """Clears history."""
    db.clear_history()
    return jsonify({"success": True, "message": "تم مسح السجل بنجاح."})

@app.route("/api/snippets", methods=["GET"])
def snippets():
    """Retrieves pre-made snippets and templates."""
    lang = request.args.get("language")
    items = db.get_snippets(lang)
    return jsonify({"success": True, "snippets": items})

@app.route("/api/snippets/save", methods=["POST"])
def save_custom_snippet():
    """Saves a new custom template snippet."""
    data = request.get_json() or {}
    title = data.get("title", "Custom Snippet")
    language = data.get("language", "python")
    code = data.get("code", "")
    description = data.get("description", "")
    tags = data.get("tags", "")

    if not code.strip():
        return jsonify({"success": False, "error": "الكود لا يمكن أن يكون فارغاً."}), 400

    snippet_id = db.save_snippet(title, language, code, description, tags)
    return jsonify({"success": True, "id": snippet_id, "message": "تم حفظ القالب بنجاح."})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("DEBUG", "False").lower() in ["true", "1"]
    print(f"🚀 AI-Code-Generator is running at http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
