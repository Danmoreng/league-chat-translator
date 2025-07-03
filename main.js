const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const screenshot = require('screenshot-desktop');
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const { GlobalKeyboardListener } = require('node-global-key-listener');

let vkey = new GlobalKeyboardListener();


// --- CONFIGURATION ---
const store = new Store();
let currentHotkey = store.get('hotkey', 'F1'); // Load saved hotkey or default to F1
let targetLanguage = store.get('targetLanguage', 'english'); // Load saved language or default to english

// --- GEMINI API SETUP ---
let genAI;

function initializeGenAI() {
    const apiKey = store.get('geminiApiKey');
    if (apiKey) {
        genAI = new GoogleGenAI({ apiKey });
    } else {
        genAI = null; // Ensure genAI is null if no API key
    }
}

// Initialize genAI on app start
initializeGenAI();

let setupWindow;
let tray = null;
let translationWindow;
let debugWindow; // Declare debugWindow

// --- MAIN SETUP WINDOW ---
function createSetupWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    setupWindow = new BrowserWindow({
        x: 0,
        y: 0,
        width: primaryDisplay.workAreaSize.width,
        height: primaryDisplay.workAreaSize.height,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    // Make the window click-through initially, we'll enable clicks via renderer
    setupWindow.setIgnoreMouseEvents(true, { forward: true });
    setupWindow.loadFile('index.html');
    setupWindow.webContents.on('did-finish-load', () => {
        // Send saved coordinates to the UI if they exist
        const savedCoords = store.get('captureArea');
        if (savedCoords) {
            setupWindow.webContents.send('load-coords', savedCoords);
        }
    });

    setupWindow.on('closed', () => {
        setupWindow = null;
    });
}


function log(message) {
    console.log(message);
    if (translationWindow && !translationWindow.isDestroyed()) {
        translationWindow.webContents.send('log-message', message);
    }
}

// --- CORE FUNCTION: CAPTURE AND TRANSLATE ---
async function captureAndTranslate() {
    const rect = store.get('captureArea');
    if (!rect) {
        log('Capture area not set. Please run setup first.');
        return;
    }

    try {
        const primaryDisplay = screen.getPrimaryDisplay();
        const scaleFactor = primaryDisplay.scaleFactor;

        // Adjust rect coordinates by scale factor
        const scaledRect = {
            x: Math.round(rect.x * scaleFactor),
            y: Math.round(rect.y * scaleFactor),
            width: Math.round(rect.width * scaleFactor),
            height: Math.round(rect.height * scaleFactor),
        };

        log('Capturing full screen...');
        const fullScreenBuffer = await screenshot({
            screen: primaryDisplay.id,
            format: 'png',
        });

        log(`Cropping image to scaled rect: { x: ${scaledRect.x}, y: ${scaledRect.y}, width: ${scaledRect.width}, height: ${scaledRect.height} }`);
        const croppedBuffer = await sharp(fullScreenBuffer)
            .extract({ left: scaledRect.x, top: scaledRect.y, width: scaledRect.width, height: scaledRect.height })
            .png()
            .toBuffer();

        log('Sending to Gemini...');
        if (!genAI) {
            const errorMessage = 'Gemini API Key not set. Please go to settings and set your API key.';
            log(errorMessage);
            if (translationWindow && !translationWindow.isDestroyed()) {
                translationWindow.webContents.send('translation-update', errorMessage);
            }
            return;
        }

        let prompt = "You are a helpful assistant. Translate the text from this screenshot of a video game chat. Provide only the clean translation.";
        if (targetLanguage === 'german') {
            prompt = "You are a helpful assistant. Translate the text from this screenshot of a video game chat into German. Provide only the clean translation.";
        } else if (targetLanguage === 'english') {
            prompt = "You are a helpful assistant. Translate the text from this screenshot of a video game chat into English. Provide only the clean translation.";
        }

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash-lite-preview-06-17",
            contents: [{ text: prompt }, { inlineData: { data: croppedBuffer.toString('base64'), mimeType: 'image/png' } }]
        });
        const translation = result.candidates[0].content.parts[0].text;
        log(`Translation received: ${translation}`);
        
        if (translationWindow && !translationWindow.isDestroyed()) {
            translationWindow.webContents.send('translation-update', translation);
        }

    } catch (error) {
        log(`Error during capture or translation: ${error}`);
        if (translationWindow && !translationWindow.isDestroyed()) {
            translationWindow.webContents.send('translation-update', `Error: ${error.message}`);
        }
    }
}


// --- APP LIFECYCLE ---
app.whenReady().then(() => {
    // Create a system tray icon
    tray = new Tray(path.join(__dirname, 'icon.png')); // You'll need an icon.png file
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Set Capture Area', type: 'normal', click: createSetupWindow },
        { type: 'separator' },
        { label: 'Quit', type: 'normal', click: () => app.quit() }
    ]);
    tray.setToolTip('League Chat Translator');
    tray.setContextMenu(contextMenu);

    // Create the persistent translation window
    const savedBounds = store.get('translationWindowBounds');
    translationWindow = new BrowserWindow({
        width: savedBounds ? savedBounds.width : 600,
        height: savedBounds ? savedBounds.height : 400,
        x: savedBounds ? savedBounds.x : screen.getPrimaryDisplay().workAreaSize.width - 615, // Near top-right
        y: savedBounds ? savedBounds.y : 15,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        menu: null
    });
    translationWindow.loadFile('translation.html');
    translationWindow.setIgnoreMouseEvents(false); // Enable mouse interaction

    // Save window bounds on resize or move
    translationWindow.on('resize', () => {
        store.set('translationWindowBounds', translationWindow.getBounds());
    });
    translationWindow.on('move', () => {
        store.set('translationWindowBounds', translationWindow.getBounds());
    });

    translationWindow.on('closed', () => {
        translationWindow = null;
    });

    // Register the global hotkey
    vkey.addListener(function (e, down) {
        // Check if the pressed key is the configured hotkey
        if (e.state == "DOWN" && e.name == currentHotkey) {
            captureAndTranslate();
        }
    });

    log(`Hotkey ${currentHotkey} registered. Press it to translate the selected area.`);

    const primaryDisplay = screen.getPrimaryDisplay();
    log('Primary Display Info:');
    log(`  Bounds (physical pixels):  { x: ${primaryDisplay.bounds.x}, y: ${primaryDisplay.bounds.y}, width: ${primaryDisplay.bounds.width}, height: ${primaryDisplay.bounds.height} }`);
    log(`  Work Area (logical pixels):  { x: ${primaryDisplay.workArea.x}, y: ${primaryDisplay.workArea.y}, width: ${primaryDisplay.workArea.width}, height: ${primaryDisplay.workArea.height} }`);
    log(`  Scale Factor (devicePixelRatio):  ${primaryDisplay.scaleFactor}`);

    // Send initial settings to the translation window
    if (translationWindow && !translationWindow.isDestroyed()) {
        translationWindow.webContents.send('load-settings', { hotkey: currentHotkey, targetLanguage: targetLanguage });
    }
});

app.on('will-quit', () => {
    // Unregister the hotkey when the app is about to close
    vkey.kill();
});

// Hide the app from the dock (macOS specific)
app.dock?.hide();

// --- IPC HANDLERS (Communication from UI) ---
ipcMain.on('save-coords', (event, coords) => {
    store.set('captureArea', coords);
    log(`Capture area saved: { x: ${coords.x}, y: ${coords.y}, width: ${coords.width}, height: ${coords.height} }`);
    if (setupWindow && !setupWindow.isDestroyed()) {
        setupWindow.close();
    }
});

ipcMain.on('setup-ready', () => {
    if (setupWindow) {
        setupWindow.setIgnoreMouseEvents(false);
    }
});

ipcMain.on('close-setup', () => {
    if (setupWindow && !setupWindow.isDestroyed()) {
        setupWindow.close();
    }
});

ipcMain.on('save-hotkey', (event, newHotkey) => {
    currentHotkey = newHotkey;
    store.set('hotkey', currentHotkey);
    log(`New hotkey registered: ${currentHotkey}`);
});

ipcMain.on('save-language', (event, newLanguage) => {
    targetLanguage = newLanguage;
    store.set('targetLanguage', targetLanguage);
    log(`Target language set to: ${targetLanguage}`);
});

ipcMain.on('request-settings', (event) => {
    if (translationWindow && !translationWindow.isDestroyed()) {
        translationWindow.webContents.send('load-settings', { hotkey: currentHotkey, targetLanguage: targetLanguage });
    }
});

ipcMain.on('set-capture-area', () => {
    createSetupWindow();
});

ipcMain.on('capture-screenshot', () => {
    captureAndTranslate();
});

ipcMain.on('save-gemini-api-key', (event, apiKey) => {
    store.set('geminiApiKey', apiKey);
    initializeGenAI(); // Re-initialize genAI with the new key
    log('Gemini API Key saved.');
});