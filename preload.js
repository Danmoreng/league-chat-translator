const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Renderer -> Main
    setupReady: () => ipcRenderer.send('setup-ready'),
    saveCoords: (coords) => ipcRenderer.send('save-coords', coords),
    closeSetup: () => ipcRenderer.send('close-setup'),
    saveHotkey: (hotkey) => ipcRenderer.send('save-hotkey', hotkey),
    saveLanguage: (language) => ipcRenderer.send('save-language', language),
    requestSettings: () => ipcRenderer.send('request-settings'),
    setCaptureArea: () => ipcRenderer.send('set-capture-area'),
    captureScreenshot: () => ipcRenderer.send('capture-screenshot'),

    // Main -> Renderer
    onLoadCoords: (callback) => ipcRenderer.on('load-coords', (event, ...args) => callback(...args)),
    onTranslationUpdate: (callback) => ipcRenderer.on('translation-update', (event, ...args) => callback(...args)),
    onDebugImage: (callback) => ipcRenderer.on('debug-image', (event, ...args) => callback(...args)),
    onLoadSettings: (callback) => ipcRenderer.on('load-settings', (event, ...args) => callback(...args))
});