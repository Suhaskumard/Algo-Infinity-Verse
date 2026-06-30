// Playground/playground.js

import { executeSandboxedCode } from '../modules/code-executor.js';
import { getCurrentTheme, onThemeChange, THEMES } from '../modules/theme.js';

// DOM Elements
const output = document.getElementById("output");
const languageSelector = document.getElementById("language");
const themeIndicator = document.getElementById("themeIndicator");

// Editor instance
const editor = ace.edit("editor");

// Current state
let currentLanguage = "javascript";
let currentTheme = getCurrentTheme();

// Language templates
const templates = {
    javascript: `// JavaScript Playground\n\nfunction greet(name) {\n  return \`Hello \${name}\`;\n}\n\nconsole.log(greet("Learner"));\n`,
    typescript: `// TypeScript Playground\n\ninterface User {\n  name: string;\n}\n\nconst user: User = {\n  name: "Learner"\n};\n\nconsole.log(user);\n`,
    dart: `// Dart Playground\n\nvoid main() {\n  print("Hello Learner");\n}\n`,
    python: `# Python Playground\n\ndef greet(name):\n    return f"Hello {name}"\n\nprint(greet("Learner"))\n`,
    java: `// Java Playground\n\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Learner");\n  }\n}\n`,
    cpp: `// C++ Playground\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello Learner" << endl;\n  return 0;\n}\n`
};

// Theme configurations for Ace
const ACE_THEMES = {
    dark: 'monokai',
    light: 'eclipse'
};

// Code storage for each language
const codeStorage = {
    javascript: templates.javascript,
    typescript: templates.typescript,
    dart: templates.dart,
    python: templates.python,
    java: templates.java,
    cpp: templates.cpp
};

// --- INITIALIZATION ---

/**
 * Initialize editor with theme and language
 */
function initEditor() {
    // Set initial theme based on app theme
    const theme = getCurrentTheme();
    const aceTheme = theme === THEMES.DARK ? ACE_THEMES.dark : ACE_THEMES.light;
    
    editor.setTheme(`ace/theme/${aceTheme}`);
    editor.session.setMode("ace/mode/javascript");
    editor.setOptions({
        fontSize: '14px',
        fontFamily: 'Fira Code, monospace, Consolas',
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showPrintMargin: false,
        tabSize: 2,
        useSoftTabs: true,
        wrap: true
    });
    
    // Load saved code or default
    const savedCode = localStorage.getItem(`playground-code-${currentLanguage}`);
    if (savedCode) {
        editor.setValue(savedCode, -1);
    } else {
        editor.setValue(templates[currentLanguage], -1);
    }
    
    // Update theme indicator
    updateThemeIndicator(theme);
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for theme changes from app
    const unsubscribe = onThemeChange(function(theme) {
        updateEditorTheme(theme);
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
}

// --- THEME FUNCTIONS ---

/**
 * Update editor theme
 * @param {string} theme - 'light' or 'dark'
 */
function updateEditorTheme(theme) {
    const aceTheme = theme === THEMES.DARK ? ACE_THEMES.dark : ACE_THEMES.light;
    
    // Update Ace theme
    editor.setTheme(`ace/theme/${aceTheme}`);
    
    // Update editor container class
    const editorContainer = document.getElementById('editor');
    if (editorContainer) {
        editorContainer.classList.remove('light-theme', 'dark-theme');
        editorContainer.classList.add(theme === THEMES.DARK ? 'dark-theme' : 'light-theme');
    }
    
    // Update indicator
    updateThemeIndicator(theme);
    
    currentTheme = theme;
}

/**
 * Update theme indicator in UI
 */
function updateThemeIndicator(theme) {
    if (!themeIndicator) return;
    
    const icon = themeIndicator.querySelector('i');
    const text = themeIndicator.querySelector('span');
    
    if (theme === THEMES.DARK) {
        if (icon) {
            icon.className = 'fas fa-moon';
        }
        if (text) {
            text.textContent = 'Dark Mode';
        }
        themeIndicator.classList.add('dark');
        themeIndicator.classList.remove('light');
    } else {
        if (icon) {
            icon.className = 'fas fa-sun';
        }
        if (text) {
            text.textContent = 'Light Mode';
        }
        themeIndicator.classList.add('light');
        themeIndicator.classList.remove('dark');
    }
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Run button
    document.getElementById("runBtn").addEventListener("click", runCode);
    
    // Clear button
    document.getElementById("clearBtn").addEventListener("click", clearOutput);
    
    // Reset button
    document.getElementById("resetBtn").addEventListener("click", resetEditor);
    
    // Language selector
    languageSelector.addEventListener("change", (event) => {
        const selectedLang = event.target.value.toLowerCase();
        
        // Save current code before switching
        codeStorage[currentLanguage] = editor.getValue();
        localStorage.setItem(`playground-code-${currentLanguage}`, codeStorage[currentLanguage]);
        
        // Switch language
        currentLanguage = selectedLang;
        
        // Load saved code or template
        const savedCode = localStorage.getItem(`playground-code-${selectedLang}`);
        if (savedCode) {
            editor.setValue(savedCode, -1);
        } else {
            editor.setValue(templates[selectedLang] || templates.javascript, -1);
        }
        
        // Update editor mode
        const modes = {
            javascript: 'ace/mode/javascript',
            typescript: 'ace/mode/typescript',
            dart: 'ace/mode/dart',
            python: 'ace/mode/python',
            java: 'ace/mode/java',
            cpp: 'ace/mode/c_cpp'
        };
        editor.session.setMode(modes[selectedLang] || 'ace/mode/javascript');
        
        // Update language badge
        updateLanguageBadge(selectedLang);
    });
    
    // Auto-save on editor change
    editor.session.on('change', function() {
        saveCode();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter or Cmd+Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
    
    // Listen for theme changes from the theme toggle
    document.addEventListener('themeChanged', function(event) {
        const theme = event.detail.theme;
        updateEditorTheme(theme);
    });
    
    // Re-apply theme on window focus (for cross-tab sync)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            const theme = getCurrentTheme();
            if (theme !== currentTheme) {
                updateEditorTheme(theme);
            }
        }
    });
}

// --- CODE MANAGEMENT ---

function saveCode() {
    const code = editor.getValue();
    localStorage.setItem(`playground-code-${currentLanguage}`, code);
}

function clearOutput() {
    output.textContent = "";
}

function resetEditor() {
    if (confirm('Reset editor to default code?')) {
        editor.setValue(templates[currentLanguage] || templates.javascript, -1);
        clearOutput();
        saveCode();
    }
}

function updateLanguageBadge(language) {
    const badge = document.getElementById('languageBadge');
    if (badge) {
        const names = {
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            dart: 'Dart',
            python: 'Python',
            java: 'Java',
            cpp: 'C++'
        };
        badge.textContent = names[language] || language;
    }
}

// --- CONSOLE CAPTURE ---

function formatValue(value) {
    if (typeof value === "object" && value !== null) {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "[Object]";
        }
    }
    return String(value);
}

function createConsoleCapture() {
    const logs = [];
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };

    console.log = (...args) => {
        const message = args.map(formatValue).join(" ");
        logs.push(message);
        originalConsole.log(...args);
    };

    console.warn = (...args) => {
        const message = "⚠️ " + args.map(formatValue).join(" ");
        logs.push(message);
        originalConsole.warn(...args);
    };

    console.error = (...args) => {
        const message = "❌ " + args.map(formatValue).join(" ");
        logs.push(message);
        originalConsole.error(...args);
    };

    return {
        logs,
        restore() {
            console.log = originalConsole.log;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
        },
    };
}

// --- RUNNERS ---

const runners = {
    javascript: runJavaScript,
    typescript: runTypeScript,
    dart: runDart,
    python: runPython,
    java: runJava,
    cpp: runCpp
};

function runCode() {
    const language = languageSelector.value.toLowerCase();
    const code = editor.getValue();

    if (runners[language]) {
        runners[language](code);
    } else {
        output.textContent = `❌ Runner for language "${language}" is not implemented.`;
    }
}

async function runJavaScript(code) {
    clearOutput();
    output.textContent = "⏳ Running (Sandboxed)...";

    try {
        const logs = await executeSandboxedCode(code, 3000);
        if (logs && logs.length > 0) {
            output.textContent = logs.join("\n");
        } else {
            output.textContent = "✅ Code executed successfully (no output).";
        }
    } catch (error) {
        output.textContent = `❌ ${error.message}`;
    }
}

async function runTypeScript(code) {
    clearOutput();
    output.textContent = "⏳ Compiling TypeScript...";

    try {
        // Compile TypeScript to JavaScript
        const compiled = ts.transpile(code, {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            strict: false
        });

        // Execute the compiled code
        output.textContent = "⏳ Running compiled JavaScript...";
        const logs = await executeSandboxedCode(compiled, 3000);
        
        if (logs && logs.length > 0) {
            output.textContent = logs.join("\n");
        } else {
            output.textContent = "✅ TypeScript compiled and executed successfully.";
        }
    } catch (error) {
        output.textContent = `❌ TypeScript Error: ${error.message}`;
    }
}

async function runDart(code) {
    clearOutput();
    output.textContent = "⏳ Running Dart via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 90,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runPython(code) {
    clearOutput();
    output.textContent = "⏳ Running Python via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 71,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runJava(code) {
    clearOutput();
    output.textContent = "⏳ Running Java via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 62,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runCpp(code) {
    clearOutput();
    output.textContent = "⏳ Running C++ via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 54,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

// --- EXPORT ---

export {
    initEditor,
    updateEditorTheme,
    runCode,
    clearOutput,
    resetEditor,
    saveCode
};

// --- INITIALIZE ---

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initEditor);

// Also re-initialize if theme changes
document.addEventListener('themeChanged', function(event) {
    const theme = event.detail.theme;
    updateEditorTheme(theme);
});