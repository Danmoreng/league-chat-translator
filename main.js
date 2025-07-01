const { app, BrowserWindow, globalShortcut, ipcMain, screen, shell, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const screenshot = require('screenshot-desktop');
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
require('dotenv').config();

// --- CONFIGURATION ---
const store = new Store();
let currentHotkey = store.get('hotkey', 'F1'); // Load saved hotkey or default to F1
let targetLanguage = store.get('targetLanguage', 'english'); // Load saved language or default to english

// --- GEMINI API SETUP ---
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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


// --- CORE FUNCTION: CAPTURE AND TRANSLATE ---
async function captureAndTranslate() {
    const rect = store.get('captureArea');
    if (!rect) {
        console.log('Capture area not set. Please run setup first.');
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

        console.log('Capturing full screen...');
        const fullScreenBuffer = await screenshot({
            screen: primaryDisplay.id,
            format: 'png',
        });

        console.log('Cropping image to scaled rect:', scaledRect);
        const croppedBuffer = await sharp(fullScreenBuffer)
            .extract({ left: scaledRect.x, top: scaledRect.y, width: scaledRect.width, height: scaledRect.height })
            .png()
            .toBuffer();

        console.log('Sending to Gemini...');
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
        console.log('Translation received:', translation);
        
        if (translationWindow && !translationWindow.isDestroyed()) {
            translationWindow.webContents.send('translation-update', translation);
        }

    } catch (error) {
        console.error('Error during capture or translation:', error);
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
    tray.setToolTip('In-Game Translator');
    tray.setContextMenu(contextMenu);

    // Create the persistent translation window
    const savedBounds = store.get('translationWindowBounds');
    translationWindow = new BrowserWindow({
        width: savedBounds ? savedBounds.width : 600,
        height: savedBounds ? savedBounds.height : 400,
        x: savedBounds ? savedBounds.x : screen.getPrimaryDisplay().workAreaSize.width - 615, // Near top-right
        y: savedBounds ? savedBounds.y : 15,
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
    if (!globalShortcut.register(currentHotkey, captureAndTranslate)) {
        console.error(`Failed to register hotkey: ${currentHotkey}`);
    }
    console.log(`Hotkey ${currentHotkey} registered. Press it to translate the selected area.`);

    const primaryDisplay = screen.getPrimaryDisplay();
    console.log('Primary Display Info:');
    console.log('  Bounds (physical pixels): ', primaryDisplay.bounds);
    console.log('  Work Area (logical pixels): ', primaryDisplay.workArea);
    console.log('  Scale Factor (devicePixelRatio): ', primaryDisplay.scaleFactor);

    // Send initial settings to the translation window
    if (translationWindow && !translationWindow.isDestroyed()) {
        translationWindow.webContents.send('load-settings', { hotkey: currentHotkey, targetLanguage: targetLanguage });
    }
});

app.on('will-quit', () => {
    // Unregister the hotkey when the app is about to close
    globalShortcut.unregisterAll();
});

// Hide the app from the dock (macOS specific)
app.dock?.hide();

// --- IPC HANDLERS (Communication from UI) ---
ipcMain.on('save-coords', (event, coords) => {
    store.set('captureArea', coords);
    console.log('Capture area saved:', coords);
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
    if (globalShortcut.isRegistered(currentHotkey)) {
        globalShortcut.unregister(currentHotkey);
    }
    currentHotkey = newHotkey;
    store.set('hotkey', currentHotkey);
    if (!globalShortcut.register(currentHotkey, captureAndTranslate)) {
        console.error(`Failed to register new hotkey: ${currentHotkey}`);
    }
    console.log(`New hotkey registered: ${currentHotkey}`);
});

ipcMain.on('save-language', (event, newLanguage) => {
    targetLanguage = newLanguage;
    store.set('targetLanguage', targetLanguage);
    console.log(`Target language set to: ${targetLanguage}`);
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