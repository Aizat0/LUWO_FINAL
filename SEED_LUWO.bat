@echo off
title LUWO - Seed Development Data
cd /d "%~dp0"

echo ==========================================
echo          LUWO DATA SEEDING
echo ==========================================
echo.

echo [1/2] Education content
"%~dp0luwo_service2\.venv\Scripts\python.exe" "%~dp0luwo_service2\mysite\seed_data.py"
if errorlevel 1 goto error

echo.
echo [2/2] Assignments and questions
"%~dp0luwo_service3\.venv\Scripts\python.exe" "%~dp0luwo_service3\seed_data.py"
if errorlevel 1 goto error

echo.
echo Seed completed successfully.
echo Running this file again will not create duplicates.
pause
exit /b 0

:error
echo.
echo Seed failed. Check the error above.
pause
exit /b 1
