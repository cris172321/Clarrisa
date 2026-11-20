@echo off
title For Clarrisa
echo ========================================================
echo   Starting Website For Clarrisa 💕
echo   Local Server: http://localhost:8080/
echo.
echo   [!] Her answers will automatically be saved to:
echo       - answers_log.txt (readable summary)
echo       - responses.json (full data)
echo       - Plus viewable directly on the website (Admin button)
echo ========================================================
echo.
echo Opening your browser now...
start http://localhost:8080/
echo.
echo Server is running. Keep this window open while she views it!
echo Press Ctrl+C to stop the server anytime.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
pause
