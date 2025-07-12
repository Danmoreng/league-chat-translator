# League Chat Translator

This is a Windows desktop application built with Electron that allows you to translate in-game chat from League of Legends (or any other game/application) in real-time. It works by taking a screenshot of a pre-defined area of your screen, sending it to the Google Gemini API for translation, and displaying the result in a separate window.

## Download

You can download the latest release of the application from the [GitHub Releases page](https://github.com/Danmoreng/league-chat-translator/releases).

## How It Works

1.  **Press Hotkey:** You press a global hotkey (default is `T`).
2.  **Capture:** The app instantly takes a screenshot of a specific area of your screen that you defined during setup.
3.  **Translate:** The screenshot is sent to the Google Gemini AI, which reads the text and translates it to your chosen language.
4.  **Display:** The translated text appears in the app's window.

## Features

*   **Real-Time Translation:** Instantly translate chat with a single keypress.
*   **Custom Capture Area:** Select the exact portion of your screen where the chat appears.
*   **Hotkey Trigger:** Use a global hotkey (configurable, default is `T`) to translate.
*   **Google Gemini Power:** Utilizes the powerful Gemini AI for fast and accurate translations.
*   **Multi-language Support:** Currently supports translation to English and German.
*   **Persistent Configuration:** Your settings are saved locally, so you only need to set them up once.
*   **System Tray Integration:** The app runs conveniently in your system tray, staying out of your way.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Google Gemini API Key:** The application requires a valid API key from Google to work.
    *   You can obtain a free API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation and Usage

1.  Download the latest `.exe` installer from the [releases page](https://github.com/Danmoreng/league-chat-translator/releases).
2.  Run the installer and launch the application. It will appear in your system tray.

### First-Time Setup

You must configure three things before the app will work:

**Step 1: Set Capture Area**
This tells the app where the chat box is on your screen.

*   Right-click the app's icon in your system tray and select **"Set Capture Area"**.
*   Your screen will dim. Click and drag to draw a box around the area where chat text appears.
*   The screen will return to normal, and the area is now saved. You can reset this at any time.

**Step 2: Set Your API Key**
*   The main application window should be visible. If not, left-click the tray icon.
*   Click the **"Show Advanced"** button to reveal the settings.
*   Paste your **Google Gemini API Key** into the input box and click **"Save API Key"**.

**Step 3: Configure Your Hotkey (Optional)**
*   In the same advanced panel, you can change the hotkey from the default `T` if you wish.

### Translate!

*   Once configured, simply press your selected hotkey during your game. The translated text will appear in the translation window.

## Troubleshooting

*   **"Gemini API Key not set" error:** This means you haven't saved your API key yet. Please follow Step 2 in the setup guide.
*   **Translation is inaccurate:** The AI translation quality can vary. We've optimized the instructions given to the AI, but complex slang or typos can still be challenging.
*   **The hotkey doesn't work:** Make sure the app is running in the system tray. The hotkey might also be in use by another application. Try changing it in the settings.

## For Developers

If you want to run the application from the source code, follow these steps.

1.  **Prerequisites:**
    *   [Node.js](https://nodejs.org/)
    *   [Git](https://git-scm.com/)

2.  **Clone and Install:**
    ```bash
    # Clone the repository
    git clone https://github.com/Danmoreng/league-chat-translator.git

    # Navigate into the project directory
    cd league-chat-translator

    # Install dependencies
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```

4.  **Build the Application:**
    You can build a distributable installer (`.exe`) using `electron-builder`.
    ```bash
    npm run build
    ```
    The installer will be created in the `dist` directory.
