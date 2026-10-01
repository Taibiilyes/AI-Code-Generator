/**
 * AI-Code-Generator Client Application
 * Handles code editing, CodeMirror integration, AI prompt execution, 
 * live compilation & running, file workspace management, and diff reviews.
 */

document.addEventListener("DOMContentLoaded", () => {
    // State
    const state = {
        currentLanguage: "python", // 'python' or 'java'
        currentFile: "main.py",
        currentMode: "generate",
        editor: null,
        isModified: false,
        pendingAiCode: null,
        diffText: "",
        settings: {
            provider: localStorage.getItem("ai_provider") || "auto",
            apiKey: localStorage.getItem("ai_api_key") || "",
            model: localStorage.getItem("ai_model") || "",
            timeout: parseInt(localStorage.getItem("ai_timeout") || "15", 10)
        }
    };

    // DOM Elements
    const elements = {
        editorTextarea: document.getElementById("code-editor-textarea"),
        fileTreeContainer: document.getElementById("file-tree-container"),
        currentFileName: document.getElementById("current-file-name"),
        tabFileIcon: document.getElementById("tab-file-icon"),
        unsavedIndicator: document.getElementById("unsaved-indicator"),
        btnLangPython: document.getElementById("btn-lang-python"),
        btnLangJava: document.getElementById("btn-lang-java"),
        modeSelect: document.getElementById("mode-select"),
        btnRunCode: document.getElementById("btn-run-code"),
        btnSaveFile: document.getElementById("btn-save-file"),
        btnNewFile: document.getElementById("btn-new-file"),
        btnRefreshFiles: document.getElementById("btn-refresh-files"),
        btnTemplates: document.getElementById("btn-templates"),
        btnDownloadZip: document.getElementById("btn-download-zip"),
        btnHistory: document.getElementById("btn-history"),
        btnSettings: document.getElementById("btn-settings"),
        btnToggleTheme: document.getElementById("btn-toggle-theme"),
        btnToggleDir: document.getElementById("btn-toggle-direction"),
        btnViewEditor: document.getElementById("btn-view-editor"),
        btnViewDiff: document.getElementById("btn-view-diff"),
        editorBox: document.getElementById("editor-box"),
        diffBox: document.getElementById("diff-box"),
        diffContent: document.getElementById("diff-content"),
        btnApplyDiff: document.getElementById("btn-apply-diff"),
        btnRejectDiff: document.getElementById("btn-reject-diff"),
        aiPromptInput: document.getElementById("ai-prompt-input"),
        btnTriggerAi: document.getElementById("btn-trigger-ai"),
        aiExplanationText: document.getElementById("ai-explanation-text"),
        aiActiveModel: document.getElementById("ai-active-model"),
        consoleOutput: document.getElementById("console-output"),
        executionBadge: document.getElementById("execution-badge"),
        executionTimer: document.getElementById("execution-timer"),
        btnClearConsole: document.getElementById("btn-clear-console"),
        btnCopyConsole: document.getElementById("btn-copy-console"),
        btnToggleConsole: document.getElementById("btn-toggle-console"),
        consoleDrawer: document.getElementById("console-drawer"),
        modalTemplates: document.getElementById("modal-templates"),
        modalSettings: document.getElementById("modal-settings"),
        modalHistory: document.getElementById("modal-history"),
        templatesListContainer: document.getElementById("templates-list-container"),
        historyItemsContainer: document.getElementById("history-items-container"),
        btnSaveSettings: document.getElementById("btn-save-settings"),
        btnClearHistoryDb: document.getElementById("btn-clear-history-db")
    };

    // 1. Initialize CodeMirror
    function initEditor() {
        state.editor = CodeMirror.fromTextArea(elements.editorTextarea, {
            mode: "python",
            theme: "dracula",
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true
        });

        state.editor.on("change", () => {
            state.isModified = true;
            elements.unsavedIndicator.style.display = "inline";
        });

        // Keyboard Shortcut: Ctrl+Enter / Cmd+Enter to Run Code
        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                runCode();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveCurrentFile();
            }
        });
    }

    // 2. Set Language
    function setLanguage(lang) {
        state.currentLanguage = lang;
        if (lang === "python") {
            elements.btnLangPython.classList.add("active");
            elements.btnLangJava.classList.remove("active");
            state.editor.setOption("mode", "python");
            elements.tabFileIcon.className = "fa-brands fa-python file-icon";
        } else {
            elements.btnLangJava.classList.add("active");
            elements.btnLangPython.classList.remove("active");
            state.editor.setOption("mode", "text/x-java");
            elements.tabFileIcon.className = "fa-brands fa-java file-icon";
        }
    }

    // 3. Load Workspace Files
    async function loadWorkspaceFiles() {
        try {
            const res = await fetch("/api/files");
            const data = await res.json();
            if (data.success) {
                renderFileTree(data.files);
            }
        } catch (err) {
            console.error("Failed to load files:", err);
        }
    }

    function renderFileTree(files) {
        elements.fileTreeContainer.innerHTML = "";
        if (!files || files.length === 0) {
            elements.fileTreeContainer.innerHTML = `<div style="padding: 10px; color: var(--text-secondary); font-size: 11px;">لا توجد ملفات.</div>`;
            return;
        }

        files.forEach(file => {
            const item = document.createElement("div");
            item.className = `file-item ${file.path === state.currentFile ? "active" : ""}`;
            
            const iconClass = file.language === "python" ? "fa-brands fa-python" : 
                              file.language === "java" ? "fa-brands fa-java" : "fa-regular fa-file-code";

            item.innerHTML = `
                <div class="file-item-left">
                    <i class="${iconClass}"></i>
                    <span>${file.name}</span>
                </div>
                <button class="file-delete-btn" title="حذف الملف"><i class="fa-solid fa-trash-can"></i></button>
            `;

            // Click to open file
            item.querySelector(".file-item-left").addEventListener("click", () => {
                openFile(file.path);
            });

            // Delete file
            item.querySelector(".file-delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                deleteFile(file.path);
            });

            elements.fileTreeContainer.appendChild(item);
        });
    }

    // 4. Open File
    async function openFile(path) {
        try {
            const res = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.success) {
                state.currentFile = path;
                elements.currentFileName.textContent = path;
                state.editor.setValue(data.content);
                setLanguage(data.language);
                state.isModified = false;
                elements.unsavedIndicator.style.display = "none";
                showEditorView();
                loadWorkspaceFiles();
            }
        } catch (err) {
            console.error("Error opening file:", err);
        }
    }

    // 5. Save Current File
    async function saveCurrentFile() {
        const content = state.editor.getValue();
        try {
            const res = await fetch("/api/files/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: state.currentFile, content: content })
            });
            const data = await res.json();
            if (data.success) {
                state.isModified = false;
                elements.unsavedIndicator.style.display = "none";
                elements.btnSaveFile.innerHTML = '<i class="fa-solid fa-check"></i> <span>تم الحفظ</span>';
                setTimeout(() => {
                    elements.btnSaveFile.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>حفظ</span>';
                }, 1500);
                loadWorkspaceFiles();
            }
        } catch (err) {
            alert("خطأ أثناء حفظ الملف: " + err.message);
        }
    }

    // 6. Delete File
    async function deleteFile(path) {
        if (!confirm(`هل أنت متأكد من حذف الملف '${path}'؟`)) return;
        try {
            const res = await fetch("/api/files/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: path })
            });
            const data = await res.json();
            if (data.success) {
                loadWorkspaceFiles();
            }
        } catch (err) {
            alert("خطأ أثناء حذف الملف: " + err.message);
        }
    }

    // 7. Create New File
    function createNewFile() {
        const defaultName = state.currentLanguage === "python" ? "new_module.py" : "NewClass.java";
        const filename = prompt("أدخل اسم الملف الجديد مع الامتداد (.py أو .java):", defaultName);
        if (!filename) return;

        const initialCode = filename.endsWith(".java") ? 
            `public class ${filename.replace('.java', '')} {\n    public static void main(String[] args) {\n        System.out.println("New Java Class ready.");\n    }\n}` :
            `# ${filename}\ndef main():\n    print("New Python Module ready.")\n\nif __name__ == '__main__':\n    main()\n`;

        fetch("/api/files/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: filename, content: initialCode })
        }).then(() => {
            openFile(filename);
        });
    }

    // 8. Run Code
    async function runCode() {
        const code = state.editor.getValue();
        if (!code.trim()) {
            elements.consoleOutput.textContent = "⚠️ لا يوجد كود لتنفيذه في المحرر.";
            return;
        }

        elements.btnRunCode.disabled = true;
        elements.btnRunCode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التشغيل...</span>';
        elements.executionBadge.className = "badge-status";
        elements.executionBadge.textContent = "جاري التنفيذ...";
        elements.executionTimer.textContent = "";
        elements.consoleOutput.textContent = "⏳ جاري تشغيل ومعالجة الكود في البيئة المعزولة...\n";

        try {
            const res = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: state.currentLanguage,
                    code: code,
                    timeout: state.settings.timeout
                })
            });
            const data = await res.json();

            elements.executionTimer.textContent = `${data.execution_time_ms || 0} ms`;

            if (data.success) {
                elements.executionBadge.className = "badge-status badge-success";
                elements.executionBadge.textContent = "نجح التنفيذ (Exit: 0)";
                elements.consoleOutput.textContent = data.stdout || "✅ تم تشغيل البرنامج بنجاح بدون مخرجات نصية.";
            } else {
                elements.executionBadge.className = "badge-status badge-error";
                elements.executionBadge.textContent = `خطأ (Exit: ${data.exit_code})`;
                elements.consoleOutput.textContent = data.stderr || data.stdout || "❌ حدث خطأ أثناء التنفيذ.";
            }
        } catch (err) {
            elements.executionBadge.className = "badge-status badge-error";
            elements.executionBadge.textContent = "خطأ اتصال";
            elements.consoleOutput.textContent = "فشل الاتصال بالخادم: " + err.message;
        } finally {
            elements.btnRunCode.disabled = false;
            elements.btnRunCode.innerHTML = '<i class="fa-solid fa-play"></i> <span>تشغيل الكود</span>';
        }
    }

    // 9. Trigger AI Generation
    async function triggerAiGeneration() {
        const prompt = elements.aiPromptInput.value.trim();
        const mode = elements.modeSelect.value;
        const inputCode = state.editor.getValue();

        if (!prompt && mode === "generate") {
            alert("يرجى كتابة وصف أو طلب لما تريد برمجته أولاً.");
            return;
        }

        elements.btnTriggerAi.disabled = true;
        elements.btnTriggerAi.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>جاري توليد الكود...</span>';

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    language: state.currentLanguage,
                    mode: mode,
                    input_code: inputCode,
                    model: state.settings.model,
                    api_key: state.settings.apiKey,
                    provider: state.settings.provider
                })
            });
            const data = await res.json();

            if (data.success) {
                state.pendingAiCode = data.code;
                elements.aiExplanationText.textContent = data.explanation || "تم توليد الكود بنجاح.";
                
                // Switch language if returned mode was convert
                if (data.language && data.language !== state.currentLanguage) {
                    setLanguage(data.language);
                }

                // If mode is explain, don't change editor, just show explanation
                if (mode === "explain") {
                    return;
                }

                // Generate Diff
                await renderDiffView(inputCode, data.code);
            } else {
                alert("خطأ من مساعد الذكاء الاصطناعي: " + data.error);
            }
        } catch (err) {
            alert("خطأ أثناء الاتصال بالذكاء الاصطناعي: " + err.message);
        } finally {
            elements.btnTriggerAi.disabled = false;
            elements.btnTriggerAi.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>توليد وتطبيق الكود</span>';
        }
    }

    // 10. Diff View & Apply
    async function renderDiffView(original, modified) {
        try {
            const res = await fetch("/api/diff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    original: original,
                    modified: modified,
                    filename: state.currentFile
                })
            });
            const data = await res.json();
            
            // Format diff with colors
            const diffHtml = (data.diff || "لا توجد فروقات.")
                .split("\n")
                .map(line => {
                    if (line.startsWith("+") && !line.startsWith("+++")) {
                        return `<div class="diff-line-add">${escapeHtml(line)}</div>`;
                    } else if (line.startsWith("-") && !line.startsWith("---")) {
                        return `<div class="diff-line-del">${escapeHtml(line)}</div>`;
                    } else {
                        return `<div>${escapeHtml(line)}</div>`;
                    }
                }).join("");

            elements.diffContent.innerHTML = diffHtml;
            showDiffView();
        } catch (err) {
            console.error("Diff error:", err);
            // Fallback directly apply
            applyPendingCode();
        }
    }

    function showEditorView() {
        elements.editorBox.style.display = "block";
        elements.diffBox.style.display = "none";
        elements.btnViewEditor.classList.add("active");
        elements.btnViewDiff.classList.remove("active");
        state.editor.refresh();
    }

    function showDiffView() {
        elements.editorBox.style.display = "none";
        elements.diffBox.style.display = "flex";
        elements.btnViewDiff.classList.add("active");
        elements.btnViewEditor.classList.remove("active");
    }

    function applyPendingCode() {
        if (state.pendingAiCode !== null) {
            state.editor.setValue(state.pendingAiCode);
            state.isModified = true;
            elements.unsavedIndicator.style.display = "inline";
            showEditorView();
            state.pendingAiCode = null;
        }
    }

    function rejectPendingCode() {
        state.pendingAiCode = null;
        showEditorView();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // 11. Templates Modal
    async function openTemplatesModal() {
        try {
            const res = await fetch(`/api/snippets?language=${state.currentLanguage}`);
            const data = await res.json();
            elements.templatesListContainer.innerHTML = "";
            
            (data.snippets || []).forEach(item => {
                const card = document.createElement("div");
                card.className = "template-card";
                card.innerHTML = `
                    <div class="template-title">${item.title}</div>
                    <div class="template-desc">${item.description || ''}</div>
                `;
                card.addEventListener("click", () => {
                    state.editor.setValue(item.code);
                    closeModal(elements.modalTemplates);
                });
                elements.templatesListContainer.appendChild(card);
            });

            elements.modalTemplates.classList.add("active");
        } catch (err) {
            console.error(err);
        }
    }

    // 12. History Modal
    async function openHistoryModal() {
        try {
            const res = await fetch("/api/history?limit=20");
            const data = await res.json();
            elements.historyItemsContainer.innerHTML = "";

            if (!data.history || data.history.length === 0) {
                elements.historyItemsContainer.innerHTML = "<div style='color: var(--text-secondary);'>لا توجد طلبات سابقة.</div>";
            } else {
                data.history.forEach(item => {
                    const row = document.createElement("div");
                    row.className = "history-item";
                    row.innerHTML = `
                        <div class="history-item-header">
                            <span><i class="fa-solid fa-tag"></i> ${item.language.toUpperCase()} • ${item.mode}</span>
                            <span>${item.created_at}</span>
                        </div>
                        <div class="history-prompt">${escapeHtml(item.prompt || 'طلب بدون نص')}</div>
                        <div class="history-actions">
                            <button class="btn btn-secondary btn-sm btn-load-history"><i class="fa-solid fa-code"></i> فتح الكود في المحرر</button>
                        </div>
                    `;
                    row.querySelector(".btn-load-history").addEventListener("click", () => {
                        state.editor.setValue(item.generated_code);
                        setLanguage(item.language);
                        closeModal(elements.modalHistory);
                    });
                    elements.historyItemsContainer.appendChild(row);
                });
            }

            elements.modalHistory.classList.add("active");
        } catch (err) {
            console.error(err);
        }
    }

    function closeModal(modal) {
        modal.classList.remove("active");
    }

    // Event Listeners
    elements.btnLangPython.addEventListener("click", () => setLanguage("python"));
    elements.btnLangJava.addEventListener("click", () => setLanguage("java"));
    elements.btnRunCode.addEventListener("click", runCode);
    elements.btnSaveFile.addEventListener("click", saveCurrentFile);
    elements.btnNewFile.addEventListener("click", createNewFile);
    elements.btnRefreshFiles.addEventListener("click", loadWorkspaceFiles);
    elements.btnTriggerAi.addEventListener("click", triggerAiGeneration);
    elements.btnViewEditor.addEventListener("click", showEditorView);
    elements.btnViewDiff.addEventListener("click", showDiffView);
    elements.btnApplyDiff.addEventListener("click", applyPendingCode);
    elements.btnRejectDiff.addEventListener("click", rejectPendingCode);
    elements.btnTemplates.addEventListener("click", openTemplatesModal);
    elements.btnHistory.addEventListener("click", openHistoryModal);

    elements.btnDownloadZip.addEventListener("click", () => {
        window.location.href = "/api/files/download-zip";
    });

    elements.btnClearConsole.addEventListener("click", () => {
        elements.consoleOutput.textContent = "تم مسح مخرجات Terminal.";
    });

    elements.btnCopyConsole.addEventListener("click", () => {
        navigator.clipboard.writeText(elements.consoleOutput.textContent);
        alert("تم نسخ المخرجات إلى الحافظة.");
    });

    elements.btnToggleConsole.addEventListener("click", () => {
        elements.consoleDrawer.classList.toggle("collapsed");
    });

    elements.btnSettings.addEventListener("click", () => {
        document.getElementById("setting-provider").value = state.settings.provider;
        document.getElementById("setting-api-key").value = state.settings.apiKey;
        document.getElementById("setting-model").value = state.settings.model;
        document.getElementById("setting-timeout").value = state.settings.timeout;
        elements.modalSettings.classList.add("active");
    });

    elements.btnSaveSettings.addEventListener("click", () => {
        state.settings.provider = document.getElementById("setting-provider").value;
        state.settings.apiKey = document.getElementById("setting-api-key").value;
        state.settings.model = document.getElementById("setting-model").value;
        state.settings.timeout = parseInt(document.getElementById("setting-timeout").value, 10);

        localStorage.setItem("ai_provider", state.settings.provider);
        localStorage.setItem("ai_api_key", state.settings.apiKey);
        localStorage.setItem("ai_model", state.settings.model);
        localStorage.setItem("ai_timeout", state.settings.timeout.toString());

        elements.aiActiveModel.textContent = state.settings.provider === "auto" ? "Built-in AI" : state.settings.provider.toUpperCase();
        closeModal(elements.modalSettings);
    });

    elements.btnClearHistoryDb.addEventListener("click", async () => {
        if (!confirm("هل أنت متأكد من مسح كافة السجلات؟")) return;
        await fetch("/api/history/clear", { method: "POST" });
        openHistoryModal();
    });

    // Close modals on clicking X
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetId = e.target.getAttribute("data-close");
            if (targetId) closeModal(document.getElementById(targetId));
        });
    });

    // Quick Prompt Tags
    document.querySelectorAll(".qtag").forEach(tag => {
        tag.addEventListener("click", () => {
            elements.aiPromptInput.value = tag.getAttribute("data-text");
            elements.aiPromptInput.focus();
        });
    });

    // Theme Toggle
    elements.btnToggleTheme.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        state.editor.setOption("theme", isLight ? "eclipse" : "dracula");
        elements.btnToggleTheme.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });

    // RTL/LTR Toggle
    elements.btnToggleDir.addEventListener("click", () => {
        const currentDir = document.documentElement.getAttribute("dir") || "rtl";
        const newDir = currentDir === "rtl" ? "ltr" : "rtl";
        document.documentElement.setAttribute("dir", newDir);
    });

    // Init
    initEditor();
    loadWorkspaceFiles();
    openFile("main.py");
});
