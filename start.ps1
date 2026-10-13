Write-Host "Starting CampusSwap..." -ForegroundColor Cyan

# Start server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server'; node index.js" -WindowStyle Normal

Start-Sleep -Seconds 1

# Start client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\client'; npm run dev" -WindowStyle Normal

Write-Host "Server: http://localhost:5000" -ForegroundColor Green
Write-Host "Client: http://localhost:5173" -ForegroundColor Green
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
