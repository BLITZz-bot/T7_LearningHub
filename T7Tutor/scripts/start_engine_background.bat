@echo off
setlocal

:: Get absolute path to T7Tutor directory
set "SCRIPT_DIR=%~dp0"
set "T7TUTOR_DIR=%SCRIPT_DIR%.."

cd /d "%T7TUTOR_DIR%"

:: 1. Check & Start Ollama in background
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    :: Check if Ollama is already responding on port 11434
    powershell -Command "$r = try { (Invoke-WebRequest -Uri 'http://localhost:11434' -TimeoutSec 1).StatusCode } catch { 0 }; if ($r -ne 200) { Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden }" >nul 2>&1
)

:: 2. Start DeepTutor Web Launcher in hidden/minimized window
powershell -Command "Start-Process python -ArgumentList 'scripts/start_web.py' -WorkingDirectory '%T7TUTOR_DIR%' -WindowStyle Minimized" >nul 2>&1

exit /b 0
