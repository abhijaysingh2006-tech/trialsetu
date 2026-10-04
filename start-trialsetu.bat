@echo off
title TrialSetu CTMS & Pharmacovigilance
echo ========================================================
echo   Starting TrialSetu Platform (SIH 2026 PS SIH26046)
echo   Local URL: http://localhost:3000
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause
