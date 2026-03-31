@echo off
chcp 65001 >nul
title Build Toko Bersama
color 0B

echo ============================================
echo    TOKO BERSAMA - BUILD SYSTEM
echo ============================================
echo.
echo Pilih jenis build:
echo.
echo  [1] Build Lengkap (Unpacked + Portable)
echo      - NPM Rebuild + Icon Custom + Timpa File Lama
echo.
echo  [2] Build Cepat (Tanpa NPM Rebuild)
echo      - Hapus build lama dan rebuild
echo.
echo  [3] Build Portable Only
echo      - Hanya membuat file .exe portable
echo.
echo  [4] Build Unpacked Only
echo      - Hanya membuat folder win-unpacked
echo.
echo  [5] Buka Folder Build
echo.
echo  [0] Keluar
echo.
echo ============================================
set /p choice="Pilihan Anda (0-5): "

cd /d "%~dp0"

if "%choice%"=="1" goto full
if "%choice%"=="2" goto quick
if "%choice%"=="3" goto portable
if "%choice%"=="4" goto unpacked
if "%choice%"=="5" goto openfolder
if "%choice%"=="0" goto exit
goto invalid

:full
call build-complete.bat
goto end

:quick
call build-quick.bat
goto end

:portable
call build-portable-only.bat
goto end

:unpacked
call build-unpacked-only.bat
goto end

:openfolder
if exist "TOKO BERSAMA BARU" (
    explorer "TOKO BERSAMA BARU"
) else (
    echo [ERROR] Folder build belum ada!
    pause
)
goto end

:invalid
echo [ERROR] Pilihan tidak valid!
pause
goto end

:exit
echo Keluar...

:end
