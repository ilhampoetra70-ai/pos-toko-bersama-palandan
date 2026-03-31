@echo off
chcp 65001 >nul
title Build Portable Only
color 0E

echo ============================================
echo    BUILD PORTABLE ONLY
echo ============================================
echo.

cd /d "%~dp0"

:: Hapus portable lama
echo [INFO] Membersihkan portable lama...
for %%F in ("TOKO BERSAMA BARU\Toko Bersama*-Portable.exe") do (
    del /q "%%F"
)

:: Rebuild native modules
echo [INFO] NPM Rebuild...
call npm run postinstall

:: Build renderer
echo [INFO] Build Renderer...
call npm run build:renderer

:: Build portable only
echo [INFO] Build Portable...
call npx electron-builder --win portable --x64

echo.
echo ✅ Build Portable selesai!
for %%F in ("TOKO BERSAMA BARU\Toko Bersama*-Portable.exe") do (
    echo    File: %%~nxF (%%~zF bytes)
)
echo.
pause
