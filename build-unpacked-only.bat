@echo off
chcp 65001 >nul
title Build Unpacked Only
color 0D

echo ============================================
echo    BUILD UNPACKED ONLY
echo ============================================
echo.

cd /d "%~dp0"

:: Hapus unpacked lama
echo [INFO] Membersihkan unpacked lama...
if exist "TOKO BERSAMA BARU\win-unpacked" (
    rmdir /s /q "TOKO BERSAMA BARU\win-unpacked"
)

:: Rebuild native modules
echo [INFO] NPM Rebuild...
call npm run postinstall

:: Build renderer
echo [INFO] Build Renderer...
call npm run build:renderer

:: Build unpacked only
echo [INFO] Build Unpacked...
call npx electron-builder --win dir --x64

:: Fix icon
echo [INFO] Fix Icon...
if exist "scripts\fix-icon.js" (
    call node scripts\fix-icon.js "TOKO BERSAMA BARU\win-unpacked"
)

echo.
echo ✅ Build Unpacked selesai!
echo    Lokasi: TOKO BERSAMA BARU\win-unpacked\
echo    Executable: Toko Bersama.exe
echo.
pause
