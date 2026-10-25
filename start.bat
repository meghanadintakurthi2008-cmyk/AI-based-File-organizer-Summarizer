@echo off
title SmartFolder AI Launcher
echo ========================================================
echo   Launching SmartFolder AI (Frontend + Backend)
echo ========================================================

start "SmartFolder Backend" cmd /k "cd backend && python run.py"
timeout /t 2 /nobreak >nul
start http://localhost:5173
npm run dev -- --host 127.0.0.1 --port 5173
