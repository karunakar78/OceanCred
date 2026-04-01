Write-Host "Starting OceanCred Services..." -ForegroundColor Green

# Start Backend using existing venv
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; .\..\venv\Scripts\Activate.ps1; python run.py`""

# Start Web (React/Vite)
Write-Host "Starting Web Application..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd web; npm run dev`""

# Start Mobile (React Native/Expo)
Write-Host "Starting Mobile Application..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd mobile; npm start`""

Write-Host "All services started in separate windows!" -ForegroundColor Green
