const hotkeyInput = document.getElementById('hotkey-input');
const languageSelect = document.getElementById('language-select');
const setAreaButton = document.getElementById('set-area-button');
const captureButton = document.getElementById('capture-button');
const translationContent = document.getElementById('translation-content');

window.api.onTranslationUpdate((text) => {
    translationContent.innerText = text;
});

// Send hotkey update to main process
hotkeyInput.addEventListener('change', () => {
    window.api.saveHotkey(hotkeyInput.value);
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
    window.api.captureScreenshot();
});

// Receive initial settings from main process
window.api.onLoadSettings((settings) => {
    if (settings.hotkey) {
        hotkeyInput.value = settings.hotkey;
    }
    if (settings.targetLanguage) {
        languageSelect.value = settings.targetLanguage;
    }
});

// Request initial settings when the renderer is ready
window.addEventListener('DOMContentLoaded', () => {
    window.api.requestSettings();
});