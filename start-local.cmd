@echo off
cd /d "%~dp0frontend"
node scripts\start-local.mjs
if errorlevel 1 pause
