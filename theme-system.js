// Theme system and UI improvements for ScriptPad

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create theme selector
    createThemeSelector();
    
    // Apply initial theme (either from localStorage or default)
    applyTheme(getSavedTheme());
    
    // Add theme change event listener
    document.getElementById('themeSelect').addEventListener('change', function() {
        const selectedTheme = this.value;
        applyTheme(selectedTheme);
        saveTheme(selectedTheme);
    });
    
    // Add animation to the logo
    animateLogo();
    
    // Add "New Line" button from previous solution
    addNewLineButton();
    
    // Improve Enter key handling
    improveEnterKeyHandling();
    
    // Define moveCursorTo function globally
    window.moveCursorTo = function(node, offset = 0) {
        // Ensure editor has focus
        document.getElementById('editor').focus();
        
        if (!node) return;
        
        // Create a new range
        const range = document.createRange();
        const selection = window.getSelection();
        
        try {
            if (node.nodeType === 3) { // Text node
                // Set cursor position in text node
                range.setStart(node, Math.min(offset, node.textContent.length));
                range.collapse(true); // Collapse to start point
            } else if (node.nodeType === 1) { // Element node
                if (node.childNodes.length > 0) {
                    // If there's content, place cursor at appropriate position
                    if (node.firstChild.nodeType === 3) { // If first child is text node
                        range.setStart(node.firstChild, Math.min(offset, node.firstChild.textContent.length));
                        range.collapse(true);
                    } else {
                        // Place at beginning of first child
                        range.setStart(node.firstChild, 0);
                        range.collapse(true);
                    }
                } else {
                    // If empty element, add a text node and place cursor there
                    const textNode = document.createTextNode('');
                    node.appendChild(textNode);
                    range.setStart(textNode, 0);
                    range.collapse(true);
                }
            }
            
            // Apply the range to selection
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Update line numbers after moving cursor
            if (window.updateLineNumbers) {
                window.updateLineNumbers();
            }
        } catch (e) {
            console.error('Error moving cursor:', e);
        }
    };
});

// Create theme selector dropdown
function createThemeSelector() {
    // Create theme selector container
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    
    // Create label
    const themeLabel = document.createElement('span');
    themeLabel.className = 'theme-label';
    themeLabel.textContent = 'Theme:';
    
    // Create select element
    const themeSelect = document.createElement('select');
    themeSelect.id = 'themeSelect';
    
    // Define themes
    const themes = [
        { value: 'default', label: 'Blue Ocean' },
        { value: 'night-owl', label: 'Night Owl' },
        { value: 'monokai', label: 'Monokai' },
        { value: 'solarized-light', label: 'Solarized Light' },
        { value: 'cotton-candy', label: 'Cotton Candy' }
    ];
    
    // Add options to select
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.label;
        themeSelect.appendChild(option);
    });
    
    // Assemble theme selector
    themeSelector.appendChild(themeLabel);
    themeSelector.appendChild(themeSelect);
    
    // Add to toolbar (after logo)
    const toolbar = document.querySelector('.toolbar');
    const logo = document.querySelector('.logo');
    toolbar.insertBefore(themeSelector, logo.nextSibling);
    
    // Add function to update line numbers correctly
    window.updateLineNumbers = function() {
        const editor = document.getElementById('editor');
        const lineNumbers = document.getElementById('lineNumbers');
        
        if (!editor || !lineNumbers) return;
        
        // Count actual elements in the editor
        const childElements = editor.children;
        const totalLines = Math.max(1, childElements.length);
        
        // Build line numbers HTML
        let html = '';
        for (let i = 1; i <= totalLines; i++) {
            html += i + '<br>';
        }
        lineNumbers.innerHTML = html;
        
        // Sync scrolling
        editor.addEventListener('scroll', function() {
            lineNumbers.scrollTop = editor.scrollTop;
        });
        
        // Adjust line numbers container height to match editor content
        lineNumbers.style.height = editor.scrollHeight + 'px';
    };
}

// Apply selected theme
function applyTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove(
        'theme-default',
        'theme-night-owl',
        'theme-monokai',
        'theme-solarized-light',
        'theme-cotton-candy'
    );
    
    // Add the selected theme class
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    // Update selected option in dropdown
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

// Save theme to localStorage
function saveTheme(theme) {
    localStorage.setItem('scriptpad-theme', theme);
}

// Get saved theme from localStorage
function getSavedTheme() {
    return localStorage.getItem('scriptpad-theme') || 'default';
}

// Set current script element - globally accessible
window.setCurrentElement = function(elementType) {
    const currentElement = document.getElementById('currentElement');
    if (currentElement) {
        currentElement.textContent = `Element: ${elementType.charAt(0).toUpperCase() + elementType.slice(1)}`;
    }
    window.currentScriptElement = elementType;
};

// Add subtle animation to the logo
function animateLogo() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.innerHTML = 'Script<span style="color: var(--button-hover);">Pad</span> ✏️';
        
        // Add bounce effect on hover
        logo.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        logo.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    }
}

// Add "New Line" button
function addNewLineButton() {
    const formatButtons = document.querySelector('.format-buttons');
    if (!formatButtons) return;
    
    const newLineBtn = document.createElement('button');
    newLineBtn.id = 'newLineBtn';
    newLineBtn.title = 'New Line (Alternative to Enter)';
    newLineBtn.textContent = '↩️ New Line';
    newLineBtn.style.backgroundColor = 'var(--button-hover)';
    formatButtons.appendChild(newLineBtn);
    
    // Add click event handler
    newLineBtn.addEventListener('click', function() {
        // Create a new element based on the current context
        insertNewLine();
    });
    
    // Define the insertNewLine function globally
    window.insertNewLine = function() {
        const editor = document.getElementById('editor');
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
            window.moveCursorTo(newDiv);
            if (window.setCurrentElement) window.setCurrentElement('action');
        } else {
            // Split the content at cursor position
            let beforeText = '';
            let afterText = '';
            
            if (range.startContainer.nodeType === 3) { // Text node
                const textContent = range.startContainer.textContent;
                beforeText = textContent.substring(0, range.startOffset);
                afterText = textContent.substring(range.startOffset);
                
                // Update text content
                range.startContainer.textContent = beforeText;
            }
            
            // Create a new empty element after the current one
            const newDiv = document.createElement('div');
            
            // Determine type based on context
            let nextElementType = 'action'; // Default
            switch (currentNode.className) {
                case 'scene-heading': nextElementType = 'action'; break;
                case 'action': nextElementType = 'action'; break;
                case 'character': nextElementType = 'dialogue'; break;
                case 'dialogue': nextElementType = 'action'; break;
                case 'parenthetical': nextElementType = 'dialogue'; break;
                case 'transition': nextElementType = 'scene-heading'; break;
            }
            
            newDiv.className = nextElementType;
            
            // Add text after cursor to new element if any
            if (afterText) {
                newDiv.textContent = afterText;
            }
            
            // Insert the new div after current node
            if (currentNode.nextSibling) {
                editor.insertBefore(newDiv, currentNode.nextSibling);
            } else {
                editor.appendChild(newDiv);
            }
            
            // Move cursor to new div
            window.moveCursorTo(newDiv);
            if (window.setCurrentElement) window.setCurrentElement(nextElementType);
        }
        
        // Update line numbers after inserting new line
        if (window.updateLineNumbers) {
            window.updateLineNumbers();
        }
    };
}

// Improve Enter key handling
function improveEnterKeyHandling() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Add a specific keydown event listener for Enter key
    editor.addEventListener('keydown', function(e) {
        // Check if the key pressed is Enter
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default behavior
            
            // Get selection and range
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            let currentNode = range.startContainer;
            
            // Find the parent div of the current position
            while (currentNode && currentNode.nodeType !== 1) {
                currentNode = currentNode.parentNode;
            }
            
            // If we're not in a proper element, create an action element
            if (!currentNode || currentNode === editor) {
                const newDiv = document.createElement('div');
                newDiv.className = 'action';
                editor.appendChild(newDiv);
                moveCursorTo(newDiv);
                setCurrentElement('action');
                updateLineNumbers(); // Update line numbers after adding new element
                return;
            }
            
            // Get the text before and after the cursor
            let textBefore = '';
            let textAfter = '';
            
            if (range.startContainer.nodeType === 3) { // Text node
                const textContent = range.startContainer.textContent;
                textBefore = textContent.substring(0, range.startOffset);
                textAfter = textContent.substring(range.startOffset);
                
                // Update the text node with only text before cursor
                range.startContainer.textContent = textBefore;
                
                // If there was other content after the cursor in the same node
                if (currentNode !== editor && textAfter) {
                    // We'll handle this text in the new element
                }
            } else {
                // Handle case where cursor is at an empty spot
                textBefore = '';
                textAfter = '';
            }
            
            // Determine what the next element should be based on screenplay formatting rules
            let nextElementType = 'action'; // Default
            
            switch (currentNode.className) {
                case 'scene-heading':
                    nextElementType = 'action';
                    break;
                case 'action':
                    nextElementType = 'action';
                    break;
                case 'character':
                    nextElementType = 'dialogue';
                    break;
                case 'dialogue':
                    nextElementType = 'action';
                    break;
                case 'parenthetical':
                    nextElementType = 'dialogue';
                    break;
                case 'transition':
                    nextElementType = 'scene-heading';
                    break;
            }
            
            // Create the new element with text after cursor
            const newDiv = document.createElement('div');
            newDiv.className = nextElementType;
            
            // Only add the text after cursor if there is any
            if (textAfter) {
                newDiv.textContent = textAfter;
            }
            
            // Insert new element after the current node
            if (currentNode.nextSibling) {
                editor.insertBefore(newDiv, currentNode.nextSibling);
            } else {
                editor.appendChild(newDiv);
            }
            
            // Move cursor to the new element
            moveCursorTo(newDiv);
            setCurrentElement(nextElementType);
            
            // Add a subtle flash effect to show the new element was created
            newDiv.style.transition = 'background-color 0.5s';
            newDiv.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
            setTimeout(() => {
                newDiv.style.backgroundColor = '';
            }, 500);
            
            // Update line numbers after handling Enter key
            updateLineNumbers();
            
            // Log for debugging
            console.log('Enter key pressed - created new ' + nextElementType + ' element');
        }
    }, true); // Use capture phase to ensure this fires before other handlers
}