@echo off
chcp 65001 >nul
title Build Unpacked Only
color 0D

echo ============================================
echo    BUILD UNPACKED ONLY
echo ============================================
echo.

cd /d "%~dp0"

:: Hapus unpacked lama dengan force
echo [INFO] Membersihkan folder build lama...
if exist "TOKO BERSAMA BARU" (
    echo [INFO] Menutup aplikasi yang sedang berjalan (jika ada)...
    taskkill /F /IM "Toko Bersama.exe" 2>nul
    timeout /t 2 /nobreak >nul
    
    echo [INFO] Menghapus folder lama...
    rmdir /s /q "TOKO BERSAMA BARU" 2>nul
    if exist "TOKO BERSAMA BARU" (
        echo [WARNING] Folder tidak bisa dihapus, mencoba dengan takeown...
        takeown /F "TOKO BERSAMA BARU" /R /D Y 2>nul
        icacls "TOKO BERSAMA BARU" /grant %username%:F /T 2>nul
        rmdir /s /q "TOKO BERSAMA BARU" 2>nul
    )
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
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ BUILD GAGAL!
    echo.
    echo Kemungkinan penyebab:
    echo 1. Folder "TOKO BERSAMA BARU" sedang digunakan oleh aplikasi lain
    echo 2. Permission denied - jalankan sebagai Administrator
    echo 3. Node modules corrupt - coba hapus node_modules dan npm install
    echo.
    echo Solusi:
    echo - Tutup aplikasi Toko Bersama jika sedang berjalan
    echo - Hapus folder "TOKO BERSAMA BARU" secara manual
    echo - Jalankan ulang script ini
    echo.
    pause
    exit /b 1
)

:: Fix icon
echo [INFO] Fix Icon...
if exist "scripts\fix-icon.js" (
    call node scripts\fix-icon.js "TOKO BERSAMA BARU\win-unpacked"
)

:: Verifikasi build berhasil
if exist "TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe" (
    echo.
    echo ✅ BUILD BERHASIL!
    echo    Lokasi: TOKO BERSAMA BARU\win-unpacked\
    echo    Executable: Toko Bersama.exe
    echo    Ukuran: 
    for %%I in ("TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe") do echo    %%~zI bytes
    echo.
) else (
    echo.
    echo ⚠️  Build mungkin gagal - executable tidak ditemukan
    echo.
)
pause
