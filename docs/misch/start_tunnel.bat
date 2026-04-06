@echo off
SETLOCAL EnableDelayedExpansion
TITLE POS Toko Bersama - Cloudflare Tunnel

:: Pindah ke direktori script
pushd "%~dp0"

:: Cek file config.yml
if not exist "config.yml" (
    echo [ERROR] File config.yml tidak ditemukan!
    echo Pastikan file ini ada di folder: %~dp0
    pause
    exit /b 1
)

:: Cek cloudflared.exe
if not exist "cloudflared.exe" (
    echo [ERROR] cloudflared.exe tidak ditemukan!
    echo Silahkan download dari: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    pause
    exit /b 1
)

cls
echo ========================================
echo   CLOUDFLARE TUNNEL - POS TOKO BERSAMA
echo ========================================
echo.
echo Domain : https://app.tbersamapalandan.my.id
echo Local  : http://localhost:3001
echo.
echo Tunnel : tbpalandan
echo.
echo ========================================
echo.
echo [INFO] Menjalankan tunnel...
echo [INFO] Tekan CTRL+C untuk berhenti
echo.

:: Jalankan tunnel
"%~dp0cloudflared.exe" --config "%~dp0config.yml" tunnel run tbpalandan

:: Jika error
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Tunnel berhenti dengan kode error: %errorlevel%
    pause
)

popd
