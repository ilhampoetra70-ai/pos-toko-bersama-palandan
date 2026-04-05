@echo off
chcp 65001 >nul
title Build Cepat Toko Bersama
color 0A

echo ============================================
echo    BUILD CEPAT TOKO BERSAMA
echo    (Tanpa NPM Rebuild)
echo ============================================
echo.

cd /d "%~dp0"

:: Hapus build lama
echo [INFO] Membersihkan build lama...
if exist "TOKO BERSAMA BARU" (
    rmdir /s /q "TOKO BERSAMA BARU"
)
if exist "dist-renderer" (
    rmdir /s /q "dist-renderer"
)

:: Build
echo [INFO] Building...
call npm run build:renderer && npx electron-builder --win dir portable --x64

:: Fix icon
if exist "scripts\fix-icon.js" (
    call node scripts\fix-icon.js "TOKO BERSAMA BARU\win-unpacked"
)

echo.
echo ✅ Build selesai!
echo.
pause
