// js/ide.js
import { getProject, saveProject } from './db.js';

let editor;
let currentProject;

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('project'), 10);

    if (!projectId) {
        alert("No project ID specified!");
        window.location.href = 'index.html';
        return;
    }
    
    currentProject = await getProject(projectId);
    
    if (currentProject) {
        document.title = `${currentProject.name} - RyxIDE`;
        initializeEditor();
        renderFileTree();
        // Open the first file by default
        if (currentProject.files.length > 0) {
            openFileInEditor(currentProject.files[0].id);
        }
    } else {
        alert("Project not found!");
        window.location.href = 'index.html';
    }

    setupEventListeners();
});

function initializeEditor() {
    // Monaco Editor's loader is available globally
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    window.MonacoEnvironment = {
        getWorkerUrl: function (workerId, label) {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = {
                    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/'
                };
                importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/worker/workerMain.js');`
            )}`;
        }
    };

    require(["vs/editor/editor.main"], function () {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: `// Welcome to RyxIDE\n// Select a file from the explorer to begin.`,
            language: 'javascript',
            theme: 'vs-dark', // Default theme
            automaticLayout: true,
            roundedSelection: true
        });

        // Update cursor position in status bar
        editor.onDidChangeCursorPosition(e => {
            const pos = e.position;
            document.getElementById('cursor-status').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
        });
    });
}

function setupEventListeners() {
    document.getElementById('run-btn').addEventListener('click', runCode);
}


// --- UI RENDERING ---
function renderFileTree() {
    const fileTreeContainer = document.getElementById('file-tree');
    fileTreeContainer.innerHTML = ''; // Clear old tree
    currentProject.files.forEach(file => {
        const fileElement = document.createElement('div');
        // Simple file item for now, can be improved later
        fileElement.textContent = file.name;
        fileElement.dataset.fileId = file.id;
        fileElement.className = 'file-item'; // Add a class for styling
        fileElement.addEventListener('click', () => openFileInEditor(file.id));
        fileTreeContainer.appendChild(fileElement);
    });
}


// --- CORE FUNCTIONALITY ---
function openFileInEditor(fileId) {
    const file = currentProject.files.find(f => f.id === fileId);
    if (file && editor) {
        editor.setValue(file.content);
        // Set language based on file extension
        const extension = file.name.split('.').pop();
        let language = 'plaintext';
        switch (extension) {
            case 'js': language = 'javascript'; break;
            case 'html': language = 'html'; break;
            case 'css': language = 'css'; break;
            case 'py': language = 'python'; break;
            case 'php': language = 'php'; break;
            case 'ts': language = 'typescript'; break;
        }
        monaco.editor.setModelLanguage(editor.getModel(), language);
        document.getElementById('language-status').textContent = language.toUpperCase();
    }
}

function runCode() {
    if (!editor) return;

    const code = editor.getValue();
    const model = editor.getModel();
    const language = model.getLanguageId();
    const previewFrame = document.getElementById('preview-iframe');

    console.log(`Running code in language: ${language}`);

    if (language === 'html') {
        // Simple HTML/CSS/JS runner
        // A more robust version would find the corresponding CSS/JS files
        const doc = previewFrame.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
    } else {
        // Placeholder for other languages
        alert(`Runner for "${language}" is not implemented yet.`);
    }
}
