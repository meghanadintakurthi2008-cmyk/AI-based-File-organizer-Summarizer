# Start SmartFolder AI (Frontend + Backend + Browser)

Write-Host "Starting SmartFolder AI..." -ForegroundColor Cyan

# 1. Start Backend in separate process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python run.py"

# 2. Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# 3. Open browser
Start-Process "http://localhost:5173"

# 4. Start Vite frontend
npm run dev -- --host 127.0.0.1 --port 5173
