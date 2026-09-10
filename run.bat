@echo off
echo Starting AcademicAI Platform...
start "AcademicAI Backend API" cmd /k "cd /d %~dp0 && set PYTHONPATH=backend && .\backend\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
start "AcademicAI Frontend Next.js" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 >nul
start http://localhost:3000
