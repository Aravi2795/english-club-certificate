@echo off
echo Starting Communication Club E-Certificate Portal...
start "" http://localhost:5000/index.html
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
