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
        // Simulate an Enter key press
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        
        // Send it to the editor
        document.getElementById('editor').dispatchEvent(enterEvent);
    });
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
            
            // Create a new element based on the current element type
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
                return;
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
            
            // Create the new element
            const newDiv = document.createElement('div');
            newDiv.className = nextElementType;
            
            // Insert after the current node
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
            
            // Log for debugging
            console.log('Enter key pressed - created new ' + nextElementType + ' element');
        }
    }, true); // Use capture phase to ensure this fires before other handlers
}