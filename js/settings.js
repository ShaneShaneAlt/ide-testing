// js/settings.js

const settings = {
    theme: 'dark',
    fontSize: 14,
    keybindings: 'vscode'
};

const themeSelect = document.getElementById('theme-select');
const fontSizeInput = document.getElementById('font-size-input');
const keybindingSelect = document.getElementById('keybinding-select');
const clearDataBtn = document.getElementById('clear-all-data-btn');

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('ryxide_settings'));
    if (savedSettings) {
        Object.assign(settings, savedSettings);
    }
    applySettings();
    updateUI();
}

function saveSettings() {
    localStorage.setItem('ryxide_settings', JSON.stringify(settings));
    applySettings(); // Apply immediately on change
}

function applySettings() {
    // For now, this just logs. We'll add theme switching logic later.
    console.log("Applying settings:", settings);
}

function updateUI() {
    themeSelect.value = settings.theme;
    fontSizeInput.value = settings.fontSize;
    keybindingSelect.value = settings.keybindings;
}

function clearAllData() {
    const confirmation = prompt('This will delete all projects and settings. This cannot be undone. Type "DELETE" to confirm.');
    if (confirmation === 'DELETE') {
        // Clear Local Storage
        localStorage.clear();
        
        // Clear IndexedDB
        window.indexedDB.deleteDatabase('RyxIDE-DB');

        alert('All data has been deleted.');
        // Redirect to home page to re-trigger onboarding
        window.location.href = 'index.html';
    } else {
        alert('Action canceled.');
    }
}

// --- Event Listeners ---
themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    saveSettings();
});

fontSizeInput.addEventListener('change', (e) => {
    settings.fontSize = e.target.value;
    saveSettings();
});

keybindingSelect.addEventListener('change', (e) => {
    settings.keybindings = e.target.value;
    saveSettings();
});

clearDataBtn.addEventListener('click', clearAllData);

// Initial load
loadSettings();
