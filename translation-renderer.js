const appContainer = document.getElementById('app-container');
const toggleAdvancedButton = document.getElementById('toggle-advanced-button');
const advancedPanel = document.getElementById('advanced-panel');
const hotkeyDisplay = document.getElementById('hotkey-display');
const hotkeyInput = document.getElementById('hotkey-input');
const languageSelect = document.getElementById('language-select');
const setAreaButton = document.getElementById('set-area-button');
const captureButton = document.getElementById('capture-button');
const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const translationContent = document.getElementById('translation-content');
const logOutput = document.getElementById('log-output');

const loadingSpinner = document.getElementById('loading-spinner');

toggleAdvancedButton.addEventListener('click', () => {
    appContainer.classList.toggle('advanced-visible');
    advancedPanel.classList.toggle('hidden');
    toggleAdvancedButton.textContent = advancedPanel.classList.contains('hidden') ? 'Show Advanced' : 'Hide Advanced';
});

window.api.onTranslationUpdate((text) => {
    translationContent.innerText = text;
    loadingSpinner.style.display = 'none';
});

window.api.onLogMessage((message) => {
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logOutput.appendChild(logEntry);
    logOutput.scrollTop = logOutput.scrollHeight;
});

// Send hotkey update to main process
hotkeyInput.addEventListener('change', () => {
    window.api.saveHotkey(hotkeyInput.value);
    hotkeyDisplay.textContent = hotkeyInput.value;
});

// Send language update to main process
languageSelect.addEventListener('change', () => {
    window.api.saveLanguage(languageSelect.value);
});

// Request to set capture area
setAreaButton.addEventListener('click', () => {
    window.api.setCaptureArea();
});

// Request to capture screenshot
captureButton.addEventListener('click', () => {
    translationContent.innerText = '';
    loadingSpinner.style.display = 'block';
    window.api.captureScreenshot();
});

saveApiKeyButton.addEventListener('click', () => {
    window.api.saveGeminiApiKey(geminiApiKeyInput.value);
    alert('Gemini API Key saved!');
});

// Receive initial settings from main process
window.api.onLoadSettings((settings) => {
    if (settings.hotkey) {
        hotkeyInput.value = settings.hotkey;
        hotkeyDisplay.textContent = settings.hotkey;
    }
    if (settings.targetLanguage) {
        languageSelect.value = settings.targetLanguage;
    }
});

// Request initial settings when the renderer is ready
window.addEventListener('DOMContentLoaded', () => {
    window.api.requestSettings();
});