@echo off
setlocal EnableDelayedExpansion

title Register T7 Tutor Protocol Handler (t7tutor://)
echo ========================================================
echo   Registering T7 Tutor Protocol Handler (t7tutor://)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "BAT_PATH=%ROOT_DIR%T7Tutor\scripts\start_engine_background.bat"

if not exist "%BAT_PATH%" (
    echo [ERROR] Could not find: %BAT_PATH%
    pause
    exit /b 1
)

echo [*] Target script: %BAT_PATH%

:: Register t7tutor protocol in HKCU (No admin rights required)
reg add "HKCU\Software\Classes\t7tutor" /ve /d "URL:T7 Tutor Protocol" /f >nul
reg add "HKCU\Software\Classes\t7tutor" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\t7tutor\shell" /f >nul
reg add "HKCU\Software\Classes\t7tutor\shell\open" /f >nul
reg add "HKCU\Software\Classes\t7tutor\shell\open\command" /ve /d "\"%BAT_PATH%\" \"%%1\"" /f >nul

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] T7 Tutor protocol (t7tutor://) registered!
    echo.
    echo You can now click "Start T7 Tutor AI Engine" directly
    echo from your browser dashboard to launch the AI automatically!
    echo ========================================================
) else (
    echo [ERROR] Failed to register protocol.
)

echo.
echo Press any key to close...
pause >nul
