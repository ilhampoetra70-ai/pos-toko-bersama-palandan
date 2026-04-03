@echo off
TITLE Port Cleaner (5173 & 3001)
SETLOCAL EnableDelayedExpansion

echo ========================================
echo       CLEANING DEVELOPMENT PORTS
echo ========================================

:: PORT 5173 (Vite)
echo Searching for processes on Port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    set PID=%%a
    echo Found PID !PID! on Port 5173. Killing...
    taskkill /F /PID !PID!
)

:: PORT 3001 (API Server)
echo Searching for processes on Port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    set PID=%%a
    echo Found PID !PID! on Port 3001. Killing...
    taskkill /F /PID !PID!
)

:: PORT 5174 (Vite)
echo Searching for processes on Port 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    set PID=%%a
    echo Found PID !PID! on Port 5174. Killing...
    taskkill /F /PID !PID!
)

echo.
echo ========================================
echo Done! Ports 5173 and 3001, 5174 should be free.
echo Anda sekarang bisa menjalankan "npm run dev"
echo ========================================
echo.
pause
