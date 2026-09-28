@echo off
title LUWO - All Services
cd /d "%~dp0"

set "LUWO_ADMIN_USERNAME=luwo_admin"
set "LUWO_ADMIN_PASSWORD=LuwoAdmin2026!"

echo ==========================================
echo              LUWO STARTING
echo ==========================================
echo.

echo Stopping old LUWO processes...
for %%P in (8001 8002 8003 5173) do (
    powershell -NoProfile -Command "$processIds = Get-NetTCPConnection -LocalPort %%P -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($processId in $processIds) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }"
)
timeout /t 2 /nobreak >nul
echo Old processes stopped.
echo.

echo Preparing lesson assignments...
"%~dp0luwo_service2\.venv\Scripts\python.exe" "%~dp0luwo_service2\mysite\sync_lesson_assignments.py"
echo.

echo [1/4] Auth Service - 8001
start /b "" "%~dp0luwo_service1\.venv\Scripts\python.exe" -m uvicorn main:auth_app --app-dir "%~dp0luwo_service1" --host 127.0.0.1 --port 8001

echo [2/4] Learning Service - 8002
start /b "" "%~dp0luwo_service2\.venv\Scripts\python.exe" "%~dp0luwo_service2\mysite\manage.py" runserver 127.0.0.1:8002

echo [3/4] Assignment Service - 8003
start /b "" "%~dp0luwo_service3\.venv\Scripts\python.exe" -m uvicorn main:luwo_app --app-dir "%~dp0luwo_service3" --host 127.0.0.1 --port 8003

echo [4/4] Frontend - 5173
start /b "" "%~dp0luwo_service2\.venv\Scripts\python.exe" "%~dp0frontend\server.py"

echo.
echo ==========================================
echo              LUWO RUNNING
echo ==========================================
echo Auth:       http://127.0.0.1:8001
echo Learning:   http://127.0.0.1:8002
echo Assignment: http://127.0.0.1:8003
echo Frontend:   http://127.0.0.1:5173
echo ==========================================
echo.

timeout /t 4 /nobreak >nul
start "" http://127.0.0.1:5173/?v=20260816-46

echo Keep this window open.
pause
