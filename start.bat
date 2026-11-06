@echo off
title SmartFolder AI Launcher
echo ========================================================
echo   Launching SmartFolder AI (Frontend + Backend)
echo ========================================================

start "SmartFolder Backend" cmd /k "cd backend && python run.py"
timeout /t 3 /nobreak >nul
start http://localhost:5176
npm run dev
