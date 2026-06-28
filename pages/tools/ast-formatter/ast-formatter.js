/**
 * ast-formatter.js
 * Logic for the AST Code Formatter Tool.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initial dummy code for the editor
    const initialCode = `function calculateTotal( items){
let total=0;
for(let i =0;i<items.length; i++){
total +=items[i].price* items[i].quantity;
    if(items[i].discount) {
 total-= items[i].discount
}
}
return  total;
}

const cart=[{price: 10,quantity: 2},{price: 5,quantity:1, discount: 2}];
console.log(calculateTotal(cart))`;

    // 1. Initialize CodeMirror Instances
    const inputEditor = CodeMirror(document.getElementById("inputEditorContainer"), {
        lineNumbers: true,
        mode: "javascript",
        theme: "material-palenight",
        value: initialCode,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true
    });

    const outputEditor = CodeMirror(document.getElementById("outputEditorContainer"), {
        lineNumbers: true,
        mode: "javascript",
        theme: "material-palenight",
        value: "",
        readOnly: true
    });

    // Elements
    const btnFormat = document.getElementById("btnFormat");
    const btnReset = document.getElementById("btnReset");
    const btnCopy = document.getElementById("btnCopy");
    const btnReplace = document.getElementById("btnReplace");
    const errorBanner = document.getElementById("errorBanner");
    
    const indentStyle = document.getElementById("indentStyle");
    const quoteStyle = document.getElementById("quoteStyle");
    const semiStyle = document.getElementById("semiStyle");

    // 2. Format Logic
    function formatCode() {
        const rawCode = inputEditor.getValue();
        errorBanner.classList.add("hidden");

        if (!rawCode.trim()) {
            outputEditor.setValue("");
            return;
        }

        try {
            // Parse AST using Acorn
            const ast = acorn.parse(rawCode, {
                ecmaVersion: "latest",
                sourceType: "module",
                locations: true
            });

            // Construct Escodegen Formatting Options
            let indentString = "    "; // 4 spaces
            if (indentStyle.value === "2spaces") indentString = "  ";
            else if (indentStyle.value === "tab") indentString = "\t";

            const options = {
                format: {
                    indent: {
                        style: indentString,
                        base: 0,
                        adjustMultilineComment: false
                    },
                    quotes: quoteStyle.value, // 'single', 'double', 'auto'
                    semicolons: semiStyle.value === "true",
                    space: " ",
                    newline: "\n",
                    safeConcatenation: true
                }
            };

            // Generate Formatted Code using Escodegen
            const formattedCode = escodegen.generate(ast, options);
            outputEditor.setValue(formattedCode);

        } catch (error) {
            // Display Syntax Error
            errorBanner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Syntax Error: ${error.message}`;
            errorBanner.classList.remove("hidden");
            console.error("AST Parsing Error:", error);
        }
    }

    // 3. Event Listeners
    btnFormat.addEventListener("click", formatCode);

    // Auto-format on setting change
    indentStyle.addEventListener("change", formatCode);
    quoteStyle.addEventListener("change", formatCode);
    semiStyle.addEventListener("change", formatCode);

    btnReset.addEventListener("click", () => {
        if(confirm("Reset to default example code?")) {
            inputEditor.setValue(initialCode);
            errorBanner.classList.add("hidden");
            outputEditor.setValue("");
            formatCode();
        }
    });

    btnCopy.addEventListener("click", () => {
        const val = outputEditor.getValue();
        if (val) {
            navigator.clipboard.writeText(val).then(() => {
                const icon = btnCopy.innerHTML;
                btnCopy.innerHTML = `<i class="fas fa-check"></i>`;
                setTimeout(() => btnCopy.innerHTML = icon, 2000);
            });
        }
    });

    btnReplace.addEventListener("click", () => {
        const val = outputEditor.getValue();
        if (val) {
            inputEditor.setValue(val);
        }
    });

    // Initial formatting run
    setTimeout(formatCode, 100);
});
