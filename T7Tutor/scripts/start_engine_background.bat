@echo off
setlocal

:: Get absolute path to T7Tutor directory
set "SCRIPT_DIR=%~dp0"
set "T7TUTOR_DIR=%SCRIPT_DIR%.."

cd /d "%T7TUTOR_DIR%"

:: Start DeepTutor Web Launcher in hidden/minimized window
powershell -Command "Start-Process python -ArgumentList 'scripts/start_web.py' -WorkingDirectory '%T7TUTOR_DIR%' -WindowStyle Minimized" >nul 2>&1

exit /b 0
