@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 18 or newer, then run this file again.
  pause
  exit /b 1
)
echo Starting MeetLingo...
echo Open http://localhost:3000 in Chrome or Edge.
node server.js
pause
