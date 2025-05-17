// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const editor = document.getElementById('editor');
const lineNumbers = document.getElementById('lineNumbers');
const wordCount = document.getElementById('wordCount');
const pageCount = document.getElementById('pageCount');
const currentElement = document.getElementById('currentElement');
const modal = document.getElementById('pdfPreviewModal');
const closeModal = document.querySelector('.close');
const pdfViewer = document.getElementById('pdfViewer');

// Format buttons
const sceneBtn = document.getElementById('sceneBtn');
const actionBtn = document.getElementById('actionBtn');
const characterBtn = document.getElementById('characterBtn');
const dialogueBtn = document.getElementById('dialogueBtn');
const parentheticalBtn = document.getElementById('parentheticalBtn');
const transitionBtn = document.getElementById('transitionBtn');

// File operation buttons
const newBtn = document.getElementById('newBtn');
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Script state
let scriptTitle = 'Untitled Script';
let lastSavedContent = '';
let currentScriptElement = 'action';
let autoFormatEnabled = true;
let currentLineCount = 1;

// Initialize editor with placeholder content
initializeEditor();

// Helper function to initialize editor with sample content
function initializeEditor() {
    editor.innerHTML = `<div class="scene-heading">INT. COFFEE SHOP - DAY</div>
<div class="action">A bustling coffee shop. Steam rises from cups. ALEX (30s, energetic) sits at a corner table, typing furiously on a laptop.</div>
<div class="character">ALEX</div>
<div class="dialogue">This script writing tool is exactly what I needed!</div>
<div class="action">A notification pops up on the laptop screen.</div>
<div class="parenthetical">(excited)</div>
<div class="dialogue">Now I can write anywhere on my iPad!</div>
<div class="transition">CUT TO:</div>`;
    
    updateLineNumbers();
    updateWordAndPageCount();
    setCurrentElement('action');
}

// Improved function to update line numbers
function updateLineNumbers() {
    // Count actual line breaks in the editor content
    const text = editor.innerHTML;
    
    // Count both <div> tags and <br> tags for accurate line counting
    const divCount = (text.match(/<div/g) || []).length;
    const brCount = (text.match(/<br/g) || []).length;
    
    // Calculate total lines - account for the initial div that might not have a matching closing tag
    const totalLines = Math.max(1, divCount + brCount);
    currentLineCount = totalLines;
    
    // Build line numbers HTML
    let html = '';
    for (let i = 1; i <= totalLines; i++) {
        html += i + '<br>';
    }
    lineNumbers.innerHTML = html;
    
    // Adjust line numbers container height to match editor content if needed
    lineNumbers.style.height = editor.scrollHeight + 'px';
}

// Function to update word and page count
function updateWordAndPageCount() {
    const text = editor.innerText;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Rough approximation: standard screenplay page is about 250 words
    const pages = Math.max(1, Math.ceil(words / 250));
    
    wordCount.textContent = `Words: ${words}`;
    pageCount.textContent = `Pages: ${pages}`;
}

// Set current script element
function setCurrentElement(elementType) {
    currentScriptElement = elementType;
    currentElement.textContent = `Element: ${elementType.charAt(0).toUpperCase() + elementType.slice(1)}`;
}

// Format the current line based on element type
function formatCurrentElement(elementType) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // Find the parent div of the current node
    while (currentNode && currentNode.nodeType !== 1) {
        currentNode = currentNode.parentNode;
    }
    
    if (!currentNode || currentNode === editor) {
        // Create a new div if we're directly in the editor
        const newDiv = document.createElement('div');
        newDiv.className = elementType;
        
        if (range.startContainer === editor) {
            // If we're at the editor level, append a new div
            editor.appendChild(newDiv);
            moveCursorTo(newDiv);
        } else {
            // We're in a text node directly under the editor
            const textNode = range.startContainer;
            const text = textNode.textContent;
            
            const beforeCursor = text.substring(0, range.startOffset);
            const afterCursor = text.substring(range.startOffset);
            
            // Replace the text with a properly formatted div
            newDiv.textContent = beforeCursor;
            textNode.textContent = '';
            textNode.parentNode.insertBefore(newDiv, textNode);
            
            if (afterCursor.trim()) {
                const remainingDiv = document.createElement('div');
                remainingDiv.className = 'action'; // Default following text to action
                remainingDiv.textContent = afterCursor;
                textNode.parentNode.insertBefore(remainingDiv, textNode.nextSibling);
            }
            
            // Move cursor to end of new div
            moveCursorTo(newDiv, newDiv.textContent.length);
        }
    } else {
        // Update the class of the existing div
        currentNode.className = elementType;
    }
    
    setCurrentElement(elementType);
    updateLineNumbers(); // Update line numbers after formatting
}

// Move cursor to specified node
function moveCursorTo(node, offset = 0) {
    if (node.nodeType === 3) { // Text node
        const range = document.createRange();
        range.setStart(node, offset);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else if (node.nodeType === 1) { // Element node
        if (node.childNodes.length > 0) {
            // If the node has children, place cursor at specified offset in first child
            if (node.firstChild.nodeType === 3) { // If first child is text node
                moveCursorTo(node.firstChild, Math.min(offset, node.firstChild.textContent.length));
            } else {
                moveCursorTo(node.firstChild, 0);
            }
        } else {
            // If the node has no children, add an empty text node and place cursor there
            const textNode = document.createTextNode('');
            node.appendChild(textNode);
            moveCursorTo(textNode, 0);
        }
    }
}

// Auto-format detection based on line content
function detectElementType(text) {
    text = text.trim();
    
    // Scene heading detection
    if (/^(INT|EXT|INT\.\/EXT|I\/E)[\s\.]/.test(text.toUpperCase())) {
        return 'scene-heading';
    }
    
    // Character detection (all caps)
    if (/^[A-Z][A-Z\s\d]+$/.test(text) && text.length < 40) {
        return 'character';
    }
    
    // Parenthetical detection
    if (/^\(.*\)$/.test(text)) {
        return 'parenthetical';
    }
    
    // Transition detection
    if (/^(FADE TO:|CUT TO:|DISSOLVE TO:|SMASH CUT TO:|QUICK CUT TO:|FADE OUT|TO BLACK)$/.test(text.toUpperCase()) || 
        (/TO:$/.test(text.toUpperCase()) && text === text.toUpperCase())) {
        return 'transition';
    }
    
    // For dialogue, let's assume it comes after a character or parenthetical
    const previousElement = getPreviousElementType();
    if (previousElement === 'character' || previousElement === 'parenthetical') {
        return 'dialogue';
    }
    
    // Default to action
    return 'action';
}

// Get the type of the previous element
function getPreviousElementType() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // Find the parent div of the current node
    while (currentNode && currentNode.nodeType !== 1) {
        currentNode = currentNode.parentNode;
    }
    
    if (!currentNode || currentNode === editor) return null;
    
    // Get the previous sibling element
    const previousElement = currentNode.previousElementSibling;
    if (!previousElement) return null;
    
    return previousElement.className;
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'pt',
        format: 'letter',
        orientation: 'portrait'
    });
    
    const margins = {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
    };
    
    // Use script title as filename
    const filename = scriptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    
    // Set font to Courier
    doc.setFont('courier', 'normal');
    doc.setFontSize(12);
    
    // Function to process each script element
    function processElements() {
        const elements = editor.children;
        let y = margins.top;
        const pageHeight = doc.internal.pageSize.height - margins.bottom;
        const lineHeight = 16;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const text = element.textContent.trim();
            
            if (!text) continue;
            
            // Check if we need a new page
            if (y + lineHeight > pageHeight) {
                doc.addPage();
                y = margins.top;
            }
            
            // Format based on element type
            switch (element.className) {
                case 'scene-heading':
                    doc.setFont('courier', 'bold');
                    doc.text(text.toUpperCase(), margins.left, y);
                    doc.setFont('courier', 'normal');
                    y += lineHeight * 2;
                    break;
                    
                case 'action':
                    // Split long paragraphs
                    const wrappedText = doc.splitTextToSize(text, doc.internal.pageSize.width - margins.left - margins.right);
                    doc.text(wrappedText, margins.left, y);
                    y += lineHeight * wrappedText.length + lineHeight;
                    break;
                    
                case 'character':
                    doc.text(text.toUpperCase(), margins.left + 150, y);
                    y += lineHeight;
                    break;
                    
                case 'dialogue':
                    const wrappedDialogue = doc.splitTextToSize(text, doc.internal.pageSize.width - margins.left - margins.right - 150);
                    doc.text(wrappedDialogue, margins.left + 100, y);
                    y += lineHeight * wrappedDialogue.length + lineHeight;
                    break;
                    
                case 'parenthetical':
                    doc.text(text, margins.left + 120, y);
                    y += lineHeight;
                    break;
                    
                case 'transition':
                    doc.text(text.toUpperCase(), margins.left + 300, y);
                    y += lineHeight * 2;
                    break;
            }
            
            // Check if we need a new page after adding content
            if (y > pageHeight) {
                doc.addPage();
                y = margins.top;
            }
        }
    }
    
    processElements();
    
    // Save PDF
    doc.save(filename);
    
    // Show preview
    const blobPdf = doc.output('blob');
    viewPDF(blobPdf);
}

// Save script as JSON
function saveScript() {
    const scriptData = {
        title: scriptTitle,
        content: editor.innerHTML,
        lastModified: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(scriptData)], { type: 'application/json' });
    const filename = scriptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.script';
    
    saveAs(blob, filename);
    lastSavedContent = editor.innerHTML;
}

// Open a script file or PDF
function openFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    if (file.name.endsWith('.script')) {
        // Open script file
        reader.onload = function(e) {
            try {
                const scriptData = JSON.parse(e.target.result);
                editor.innerHTML = scriptData.content || '';
                scriptTitle = scriptData.title || 'Untitled Script';
                lastSavedContent = editor.innerHTML;
                
                updateLineNumbers();
                updateWordAndPageCount();
            } catch (error) {
                alert('Error opening script file: ' + error.message);
            }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
        // Open PDF file
        reader.onload = function(e) {
            const typedArray = new Uint8Array(e.target.result);
            viewPDF(typedArray);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file format. Please open .script or .pdf files.');
    }
}

// View PDF content
function viewPDF(pdfData) {
    // Clear the viewer
    pdfViewer.innerHTML = '';
    
    // Load the PDF document
    pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
        // Show the modal
        modal.style.display = 'block';
        
        // Get total pages
        const totalPages = pdf.numPages;
        
        // Function to render a page
        function renderPage(pageNum) {
            pdf.getPage(pageNum).then(function(page) {
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                // Create canvas for this page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Add canvas to viewer
                pdfViewer.appendChild(canvas);
                
                // Render PDF page
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                page.render(renderContext).promise.then(function() {
                    // If we have more pages, render the next one
                    if (pageNum < totalPages) {
                        renderPage(pageNum + 1);
                    }
                });
            });
        }
        
        // Start rendering pages from page 1
        renderPage(1);
    }).catch(function(error) {
        console.error('Error rendering PDF:', error);
        alert('Error rendering PDF: ' + error.message);
    });
}

// Prompt for script title
function promptForTitle() {
    const title = prompt('Enter script title:', scriptTitle);
    if (title !== null) {
        scriptTitle = title || 'Untitled Script';
    }
}

// Create a new script
function newScript() {
    if (editor.innerHTML !== lastSavedContent) {
        if (!confirm('You have unsaved changes. Create a new script anyway?')) {
            return;
        }
    }
    
    scriptTitle = 'Untitled Script';
    editor.innerHTML = '';
    lastSavedContent = '';
    updateLineNumbers();
    updateWordAndPageCount();
}

// FIXED: Improved Enter key handling for multiple blank lines
function handleEnterKey(e) {
    e.preventDefault();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;

    // Find the parent div of the current position
    while (currentNode && currentNode.nodeType !== 1) {
        currentNode = currentNode.parentNode;
    }

    if (!currentNode || currentNode === editor) {
        // If we're directly in the editor, create a new action element
        const newDiv = document.createElement('div');
        newDiv.className = 'action';
        editor.appendChild(newDiv);
        moveCursorTo(newDiv, 0);
        setCurrentElement('action');
    } else {
        // Calculate offset in the currentNode for the split
        let offset = 0;
        let text = '';
        if (range.startContainer.nodeType === 3) {
            // If inside a text node, sum up all text nodes before and add range offset
            let walker = document.createTreeWalker(currentNode, NodeFilter.SHOW_TEXT, null, false);
            let total = 0;
            let found = false;
            while (walker.nextNode()) {
                let n = walker.currentNode;
                if (n === range.startContainer) {
                    offset = total + range.startOffset;
                    found = true;
                    break;
                }
                total += n.textContent.length;
            }
            text = currentNode.textContent || '';
            if (!found) offset = text.length;
        } else {
            text = currentNode.textContent || '';
            offset = text.length;
        }

        const textBefore = text.substring(0, offset);
        const textAfter = text.substring(offset);

        // Update the current node with text before cursor
        currentNode.textContent = textBefore;

        // Determine the type of the next element based on context
        let nextElementType = 'action'; // Default
        switch (currentNode.className) {
            case 'scene-heading': nextElementType = 'action'; break;
            case 'action': nextElementType = 'action'; break;
            case 'character': nextElementType = 'dialogue'; break;
            case 'dialogue': nextElementType = 'action'; break;
            case 'parenthetical': nextElementType = 'dialogue'; break;
            case 'transition': nextElementType = 'scene-heading'; break;
        }

        // Create new element with text after cursor
        const newDiv = document.createElement('div');
        newDiv.className = nextElementType;
        newDiv.textContent = textAfter;

        // Insert after current node
        if (currentNode.nextSibling) {
            editor.insertBefore(newDiv, currentNode.nextSibling);
        } else {
            editor.appendChild(newDiv);
        }

        // Move cursor to new div
        moveCursorTo(newDiv, 0);
        setCurrentElement(nextElementType);
    }

    updateLineNumbers();
}

// Helper function to get the offset within a parent node
function getTextNodeOffset(parentNode, textNode) {
    let offset = 0;
    const childNodes = parentNode.childNodes;
    
    for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child === textNode) {
            break;
        }
        if (child.nodeType === 3) { // Text node
            offset += child.textContent.length;
        }
    }
    
    return offset;
}

// Event Listeners
editor.addEventListener('input', function() {
    updateLineNumbers();
    updateWordAndPageCount();
    
    if (autoFormatEnabled) {
        // Get current line if there's a selection
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            let node = range.startContainer;
            
            // Find the parent div of the current position
            while (node && node.nodeType !== 1) {
                node = node.parentNode;
            }
            
            // Auto-format if we've just finished typing a complete line
            if (node && node !== editor && node.textContent.endsWith('\n')) {
                const text = node.textContent.trim();
                const detectedType = detectElementType(text);
                
                // Only change the type if it's different
                if (node.className !== detectedType) {
                    node.className = detectedType;
                    setCurrentElement(detectedType);
                }
            }
        }
    }
});

editor.addEventListener('keydown', function(e) {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '    ');
    }
    
    // FIXED: Improved Enter key handling 
    if (e.key === 'Enter') {
        handleEnterKey(e);
    }
    
    // Keyboard shortcuts with Ctrl key
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                formatCurrentElement('scene-heading');
                break;
            case '2':
                e.preventDefault();
                formatCurrentElement('action');
                break;
            case '3':
                e.preventDefault();
                formatCurrentElement('character');
                break;
            case '4':
                e.preventDefault();
                formatCurrentElement('dialogue');
                break;
            case '5':
                e.preventDefault();
                formatCurrentElement('parenthetical');
                break;
            case '6':
                e.preventDefault();
                formatCurrentElement('transition');
                break;
            case 's':
                e.preventDefault();
                saveScript();
                break;
            case 'o':
                e.preventDefault();
                fileInput.click();
                break;
            case 'n':
                e.preventDefault();
                newScript();
                break;
            case 'e':
                e.preventDefault();
                exportToPDF();
                break;
        }
    }
});

// Update line numbers after paste operations
editor.addEventListener('paste', function() {
    // Use setTimeout to ensure content is fully pasted before updating
    setTimeout(function() {
        updateLineNumbers();
        updateWordAndPageCount();
    }, 0);
});

// Format button handlers
sceneBtn.addEventListener('click', () => formatCurrentElement('scene-heading'));
actionBtn.addEventListener('click', () => formatCurrentElement('action'));
characterBtn.addEventListener('click', () => formatCurrentElement('character'));
dialogueBtn.addEventListener('click', () => formatCurrentElement('dialogue'));
parentheticalBtn.addEventListener('click', () => formatCurrentElement('parenthetical'));
transitionBtn.addEventListener('click', () => formatCurrentElement('transition'));

// File operation button handlers
newBtn.addEventListener('click', newScript);
openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', openFile);
saveBtn.addEventListener('click', () => {
    promptForTitle();
    saveScript();
});
exportPdfBtn.addEventListener('click', () => {
    promptForTitle();
    exportToPDF();
});

// Modal close button
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside the content
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle window resize
window.addEventListener('resize', updateLineNumbers);

// Make sure line numbers match actual content height
window.addEventListener('load', function() {
    // Set initial line numbers with proper height
    updateLineNumbers();
    
    // Ensure line numbers container matches editor height
    lineNumbers.style.height = editor.scrollHeight + 'px';
});

// Initial setup tasks
updateLineNumbers();
updateWordAndPageCount();