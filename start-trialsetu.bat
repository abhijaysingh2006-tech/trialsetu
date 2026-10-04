@echo off
title TrialSetu CTMS & Pharmacovigilance
echo ========================================================
echo   Starting TrialSetu Platform (SIH 2026 PS SIH26046)
echo   Mode: High-Performance Production Server
echo   Local URL: http://localhost:3000
echo ========================================================
cd /d "%~dp0frontend"
if not exist ".next\BUILD_ID" (
    echo Building production package...
    call npm run build
)
echo Server is running! Open http://localhost:3000 in your browser.
npm run start
pause
