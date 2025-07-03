# League Chat Translator

This is a Windows desktop application built with Electron that allows you to translate in-game chat from League of Legends (or any other game/application) in real-time. It works by taking a screenshot of a pre-defined area of your screen, sending it to the Google Gemini API for translation, and displaying the result in a separate window.

## Features

*   **Custom Capture Area:** Select the exact portion of your screen where the chat appears.
*   **Hotkey Trigger:** Use a global hotkey (configurable, default is `F1`) to instantly capture and translate the chat.
*   **Google Gemini Power:** Utilizes the Gemini API for fast and accurate translations.
*   **Multi-language Support:** Currently supports translation to English and German.
*   **Persistent Configuration:** Your settings (capture area, hotkey, API key, and window positions) are saved locally, so you only need to set them up once.
*   **System Tray Integration:** The app runs conveniently in your system tray.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js:** You'll need Node.js to run the application from the source and build it. You can download it from [nodejs.org](https://nodejs.org/).
2.  **Google Gemini API Key:** The application requires a valid API key from Google to use the Gemini translation service.
    *   You can obtain a free API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation and Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/league-chat-translator.git
    cd league-chat-translator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```

### First-Time Setup

1.  **Set Capture Area:**
    *   When you first run the app, right-click the new icon in your system tray and select "Set Capture Area".
    *   Your screen will dim slightly. Click and drag to draw a box around the area where the game's chat text appears.
    *   The application will save this area and use it for all future translations. You can reset this at any time from the tray menu.

2.  **Configure Settings:**
    *   The main translation window will appear. Click the "Settings" button.
    *   **Enter your Google Gemini API Key.** This is required for the translation to work.
    *   (Optional) Change the translation hotkey from the default `F1`.
    *   (Optional) Change the target language for the translation.

3.  **Translate!**
    *   Once configured, simply press your selected hotkey during your game. The translated text will appear in the translation window.

## Configuration

All settings are stored locally in a `config.json` file, managed by `electron-store`. You can configure the following from the settings menu in the app:

*   **Gemini API Key:** Your API key for the Google Gemini service.
*   **Hotkey:** The global key combination to trigger a translation.
*   **Target Language:** The language you want the chat translated into (English or German).

The application also saves the position and size of the translation window and the coordinates of your selected capture area.

## Building the Application

You can build a distributable installer (`.exe`) for the application using `electron-builder`.

```bash
npm run build
```

The installer will be created in the `dist` directory.

---

**Note:** This README assumes a standard Electron project setup. The build process and dependencies are based on the `package.json` file provided.
