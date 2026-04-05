@echo off
echo ==============================================
echo    POS INTEGRATED SERVICES STARTUP
echo ==============================================

:: Start Main POS App (Express starts inside Electron after Vite is ready)
echo [1/2] Starting POS Cashier App...
start "POS App" cmd /c "cd /d D:\Ilham\Documents\Proyek\pos-app && npm run dev"

:: Wait for Express server on port 3001 (only needed for Cloudflare Tunnel)
echo [..] Menunggu Express server siap di port 3001 (untuk tunnel)...
:WAIT_EXPRESS
timeout /t 3 /nobreak >nul
netstat -an | findstr ":3001.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [..] Masih menunggu port 3001...
    goto WAIT_EXPRESS
)
echo [OK] Express server siap di port 3001!

:: Start Cloudflare Tunnel AFTER Express is ready
echo [2/2] Starting Cloudflare Tunnel...
start "POS Tunnel" cmd /c "cd /d D:\Ilham\Documents\Proyek\pos-app && start_tunnel.bat"

echo.
echo ==============================================
echo   Semua service sudah dijalankan!
echo ==============================================
echo   - POS App      : Vite:5173 + Electron
echo   - Express API  : port 3001 (ready)
echo   - CF Tunnel     : pos.tbersamapalandan.my.id
echo ==============================================
pause
