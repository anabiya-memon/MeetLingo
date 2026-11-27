# MeetLingo — English to Urdu Meeting Translator

A small private-use web app with live English speech recognition, English-to-Urdu translation, and a manual text translator.

## Requirements

- Windows, macOS, or Linux computer
- Node.js 18 or newer (no extra npm packages are required)
- Google Chrome or Microsoft Edge for live speech recognition
- Internet connection for speech recognition and translation

## Run on Windows

1. Extract the ZIP file into a folder.
2. Open that folder in File Explorer.
3. Click the address bar, type `cmd`, and press Enter.
4. Run these commands:

   ```bash
   node server.js
   ```

5. Open **http://localhost:3000** in Google Chrome or Microsoft Edge.
6. Press **Start listening** and allow microphone access.

You can also double-click `start.bat` to start the local server. No extra npm packages need to be installed.

## Using with Zoom on the same laptop

This first version listens through the computer's default microphone. For it to hear the other meeting participants, set Zoom's speaker output to the laptop speakers and keep the volume at a clear, moderate level. Headphones generally stop the microphone from hearing the other participants.

A browser page cannot directly capture audio from the separate Zoom desktop app. Direct app/system-audio capture needs a supported audio-routing setup (for example, a suitable loopback input or virtual audio device) and is not included in this version. Do not assume the microphone method will work well in every room or laptop setup.

## Privacy and limitations

- This app does not record or save meeting audio, and it does not store a transcript database. Captions remain in the page until cleared or refreshed.
- Browser speech recognition may send microphone audio to the browser's speech-recognition provider. This behaviour is controlled by the browser, not this app.
- Recognised English text is sent to the MyMemory translation service through the local server to obtain Urdu translation. Do not use it for confidential meetings or sensitive information unless the meeting participants and your organisation allow that third-party processing.
- The app does not send anything to Zoom and does not alter Zoom's interface. Keep to your meeting's consent, recording, accessibility, and confidentiality rules.
- MyMemory's official usage page currently lists 5,000 characters/day for anonymous free use. Its limits can change, and translations can be imperfect. Verify important numbers, names, contracts, and instructions.
- Live speech recognition is most reliable in Chrome or Edge on desktop. If it is unavailable, use the manual translator below.

## Project structure

- `server.js` — local Node.js server and translation API proxy
- `public/index.html` — page structure
- `public/styles.css` — responsive dark interface
- `public/app.js` — speech recognition, live captions, and UI behaviour
