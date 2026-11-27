@echo off
title MeetLingo
cd /d "%~dp0"
echo Starting MeetLingo...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing required files for the first time...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Check your internet connection.
    pause
    exit /b 1
  )
)
start "" http://localhost:3000
node server.js
pause
