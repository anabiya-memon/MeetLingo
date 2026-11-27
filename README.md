# MeetLingo — English to Urdu Meeting Helper

## Run on Windows
1. Install Node.js LTS from https://nodejs.org/ if it is not already installed.
2. Extract this ZIP.
3. Double-click `start.bat`.
4. Keep the black terminal window open while using MeetLingo.
5. Open `http://localhost:3000` if the browser does not open automatically.

## Deploy to Vercel
1. Upload the contents of this folder to a new GitHub repository (the files inside `MeetLingo-Fixed`, not the outer folder).
2. In Vercel choose **Add New → Project** and import that repository.
3. Framework preset: **Other**. Build command: leave blank. Output directory: leave blank.
4. Deploy. The `/api/translate` serverless function is included.

## Important audio note
MeetLingo uses your browser's microphone through Web Speech Recognition. If you play the meeting through laptop speakers, your microphone may hear the client and your own voice. This can cause echo or poor recognition. Headphones usually improve accuracy. A normal website cannot automatically capture audio from the separate Zoom desktop app; microphone capture is the supported method here.

## Translation note
Translation uses the MyMemory translation service through the included backend endpoint. It does not require an OpenAI API key, but it depends on internet access and the third-party service's availability and usage limits. Avoid sending confidential or sensitive meeting content to a third-party translation service unless you have permission and are comfortable with its privacy terms.

## Reply suggestions
The reply helper provides built-in simple and professional response templates based on common meeting phrases. It does not call an AI model and may not understand every context. Review suggestions before saying or sending them.

## Browser support
Use the latest Google Chrome or Microsoft Edge. Allow microphone permission when prompted. Speech recognition availability depends on browser, operating system, language settings, and internet connection.
