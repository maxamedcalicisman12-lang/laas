@echo off
title LAAS Real Estate - Starting...
echo.
echo ========================================
echo   LAAS Real Estate - Labada server shubo
echo ========================================
echo.
echo Backend  -> http://localhost:8001
echo Frontend -> http://localhost:5173
echo.
echo Si aad u joojiso, xidh furaha labada window.
echo.

cd /d "%~dp0"
call npm install
call npm run dev
pause
