# Start SmartFolder AI (Frontend + Backend + Browser)

Write-Host "Starting SmartFolder AI..." -ForegroundColor Cyan

# 1. Start Backend in separate process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python run.py"

# 2. Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# 3. Open browser
Start-Process "http://localhost:5176"

# 4. Start Vite frontend
npm run dev
