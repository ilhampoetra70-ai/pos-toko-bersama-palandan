@echo off
chcp 65001 >nul
title Build Unpacked Only (Fixed)
color 0D

echo ============================================
echo    BUILD UNPACKED ONLY (FIXED)
echo ============================================
echo.

cd /d "%~dp0"

:: Cek apakah aplikasi sedang berjalan
echo [INFO] Mengecek aplikasi yang sedang berjalan...
tasklist | findstr /I "Toko Bersama.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Aplikasi Toko Bersama sedang berjalan!
    echo [INFO] Menutup aplikasi...
    taskkill /F /IM "Toko Bersama.exe" 2>nul
    timeout /t 3 /nobreak >nul
)

:: Hapus folder build lama dengan berbagai metode
echo [INFO] Membersihkan folder build lama...
if exist "TOKO BERSAMA BARU" (
    echo [INFO] Mencoba hapus folder...
    rmdir /s /q "TOKO BERSAMA BARU" 2>nul
    
    if exist "TOKO BERSAMA BARU" (
        echo [WARNING] Folder masih ada, mencoba metode alternatif...
        del /f /s /q "TOKO BERSAMA BARU\*" 2>nul
        rmdir /s /q "TOKO BERSAMA BARU" 2>nul
    )
    
    if exist "TOKO BERSAMA BARU" (
        echo [ERROR] Tidak bisa menghapus folder build lama!
        echo.
        echo Silakan lakukan langkah berikut secara manual:
        echo 1. Tutup semua aplikasi Toko Bersama
        echo 2. Buka Task Manager, cari "Toko Bersama.exe" dan end task
        echo 3. Hapus folder "TOKO BERSAMA BARU" secara manual
        echo 4. Jalankan ulang script ini
        echo.
        pause
        exit /b 1
    )
)

echo [INFO] Folder bersih, melanjutkan build...
echo.

:: Rebuild native modules
echo [INFO] NPM Rebuild...
call npm run postinstall
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NPM rebuild gagal!
    pause
    exit /b 1
)

:: Build renderer
echo [INFO] Build Renderer...
call npm run build:renderer
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build renderer gagal!
    pause
    exit /b 1
)

:: Build unpacked only
echo [INFO] Build Unpacked...
call npx electron-builder --win dir --x64
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ BUILD GAGAL!
    echo.
    echo Penyebab umum:
    echo - Folder build masih terkunci
    echo - Node modules corrupt
    echo.
    pause
    exit /b 1
)

:: Fix icon
echo [INFO] Fix Icon...
if exist "scripts\fix-icon.js" (
    call node scripts\fix-icon.js "TOKO BERSAMA BARU\win-unpacked"
)

:: Verifikasi
echo.
if exist "TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe" (
    echo ✅ BUILD BERHASIL!
    echo.
    echo Lokasi: TOKO BERSAMA BARU\win-unpacked\
    for %%I in ("TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe") do (
        echo Ukuran: %%~zI bytes
        echo Tanggal: %%~tI
    )
    echo.
) else (
    echo ⚠️  Executable tidak ditemukan - build mungkin gagal
)

pause
