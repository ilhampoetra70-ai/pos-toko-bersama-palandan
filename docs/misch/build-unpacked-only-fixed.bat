@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Build Unpacked Only (Fixed)
color 0D

echo ============================================
echo    BUILD UNPACKED ONLY (FIXED)
echo ============================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "BUILD_OUTPUT=TOKO BERSAMA BARU"
set "BUILD_ROOT=%BUILD_OUTPUT%\win-unpacked"
set "BUILD_PATH="
set "BUILD_DIST_PATH="
set "ALL_OK=1"

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddHHmmss"') do set "CACHE_VERSION=%%I"
set "SW_CACHE_NAME=pos-admin-v%CACHE_VERSION%"

echo [INFO] CACHE_VERSION: %CACHE_VERSION%
echo [INFO] SW_CACHE_NAME: %SW_CACHE_NAME%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js tidak ditemukan di PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm tidak ditemukan di PATH.
  pause
  exit /b 1
)

:: Cek apakah aplikasi sedang berjalan
echo [INFO] Mengecek aplikasi yang sedang berjalan...
tasklist | findstr /I "Toko Bersama.exe" >nul
if not errorlevel 1 (
  echo [WARNING] Aplikasi Toko Bersama sedang berjalan. Menutup proses...
  taskkill /F /IM "Toko Bersama.exe" >nul 2>nul
  timeout /t 2 /nobreak >nul
)

:: Bersihkan folder build lama
echo [INFO] Membersihkan folder build lama...
if exist "%BUILD_OUTPUT%" (
  rmdir /s /q "%BUILD_OUTPUT%" >nul 2>nul
)

if exist "%BUILD_OUTPUT%" (
  echo [WARNING] rmdir gagal, mencoba via PowerShell...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%BUILD_OUTPUT%') { Remove-Item -LiteralPath '%BUILD_OUTPUT%' -Recurse -Force -ErrorAction SilentlyContinue }"
)

if exist "%BUILD_OUTPUT%" (
  echo [ERROR] Tidak bisa menghapus folder build lama: %BUILD_OUTPUT%
  echo Tutup semua proses yang mungkin mengunci folder lalu jalankan ulang script.
  pause
  exit /b 1
)

echo [INFO] Folder bersih, melanjutkan build...
echo.

:: Rebuild native modules
echo [INFO] NPM Rebuild...
call npm run postinstall
if errorlevel 1 (
  echo [ERROR] NPM rebuild gagal.
  pause
  exit /b 1
)

:: Build renderer
echo [INFO] Build Renderer...
call npm run build:renderer
if errorlevel 1 (
  echo [ERROR] Build renderer gagal.
  pause
  exit /b 1
)

:: Build unpacked only
echo [INFO] Build Unpacked...
call npx electron-builder --win dir --x64 --publish never
if errorlevel 1 (
  echo [ERROR] Build unpacked gagal.
  pause
  exit /b 1
)

:: Resolve build paths dinamis
set "CANDIDATE1=%BUILD_ROOT%\resources\app.asar.unpacked\mobile-admin-dist"
set "CANDIDATE2=%BUILD_ROOT%\resources\mobile-admin-dist"
if exist "%CANDIDATE1%" set "BUILD_PATH=%CANDIDATE1%"
if not defined BUILD_PATH if exist "%CANDIDATE2%" set "BUILD_PATH=%CANDIDATE2%"

if not defined BUILD_PATH (
  echo [ERROR] Build path mobile-admin-dist tidak ditemukan.
  echo [INFO] Candidate 1: %CANDIDATE1%
  echo [INFO] Candidate 2: %CANDIDATE2%
  pause
  exit /b 1
)

set "BUILD_DIST_PATH=%BUILD_PATH%\dist"

echo.
echo ============================================
echo    APPLYING FIXES TO BUILD
echo ============================================
echo [INFO] BUILD_PATH: %BUILD_PATH%
echo.

:: 1. Copy reports-fix.js (mandatory)
echo [INFO] Copying reports-fix.js...
if not exist "mobile-admin-dist\reports-fix.js" (
  echo [ERROR] Source file tidak ditemukan: mobile-admin-dist\reports-fix.js
  pause
  exit /b 1
)

copy /Y "mobile-admin-dist\reports-fix.js" "%BUILD_PATH%\reports-fix.js" >nul
if errorlevel 1 (
  echo [ERROR] Gagal copy reports-fix.js ke build path.
  pause
  exit /b 1
)
echo [OK] reports-fix.js copied ke root mobile-admin-dist

if exist "%BUILD_DIST_PATH%" (
  copy /Y "mobile-admin-dist\reports-fix.js" "%BUILD_DIST_PATH%\reports-fix.js" >nul
  if not errorlevel 1 echo [OK] reports-fix.js copied ke dist
)

:: 2. Ensure chart local vendor exists in build (optional but recommended)
if exist "mobile-admin-dist\assets\vendor\chart.umd.min.js" (
  if not exist "%BUILD_PATH%\assets\vendor" mkdir "%BUILD_PATH%\assets\vendor" >nul 2>nul
  copy /Y "mobile-admin-dist\assets\vendor\chart.umd.min.js" "%BUILD_PATH%\assets\vendor\chart.umd.min.js" >nul
  if not errorlevel 1 echo [OK] chart.umd.min.js copied ke build
)

:: 3. Update index.html version (root + dist)
echo [INFO] Updating index.html files...
if exist "%BUILD_PATH%\index.html" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_PATH%\index.html'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "if($c -match 'reports-fix\.js'){ $c=$c -replace 'reports-fix\.js\?v=[^\"'']*','reports-fix.js?v=%CACHE_VERSION%' } else { $c=$c -replace '</head>', '<script src=\"./reports-fix.js?v=%CACHE_VERSION%\"></script>`n</head>' }; " ^
    "Set-Content -LiteralPath $f -Value $c -Encoding UTF8 -NoNewline; Write-Host '[OK] index.html updated (%CACHE_VERSION%)'"
)

if exist "%BUILD_DIST_PATH%\index.html" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_DIST_PATH%\index.html'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "if($c -match 'reports-fix\.js'){ $c=$c -replace 'reports-fix\.js\?v=[^\"'']*','reports-fix.js?v=%CACHE_VERSION%' } else { $c=$c -replace '</head>', '<script src=\"./reports-fix.js?v=%CACHE_VERSION%\"></script>`n</head>' }; " ^
    "Set-Content -LiteralPath $f -Value $c -Encoding UTF8 -NoNewline; Write-Host '[OK] dist/index.html updated (%CACHE_VERSION%)'"
)

:: 4. Update Service Worker cache name (root + dist)
echo [INFO] Updating Service Worker cache version...
if exist "%BUILD_PATH%\sw.js" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_PATH%\sw.js'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "$c=$c -replace 'const\s+CACHE_NAME\s*=\s*''pos-admin-v[^'']*''', 'const CACHE_NAME = ''%SW_CACHE_NAME%'''; " ^
    "Set-Content -LiteralPath $f -Value $c -Encoding UTF8 -NoNewline; Write-Host '[OK] sw.js updated (%SW_CACHE_NAME%)'"
)

if exist "%BUILD_DIST_PATH%\sw.js" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_DIST_PATH%\sw.js'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "$c=$c -replace 'const\s+CACHE_NAME\s*=\s*''pos-admin-v[^'']*''', 'const CACHE_NAME = ''%SW_CACHE_NAME%'''; " ^
    "Set-Content -LiteralPath $f -Value $c -Encoding UTF8 -NoNewline; Write-Host '[OK] dist/sw.js updated (%SW_CACHE_NAME%)'"
)

:: 5. Copy Cloudflare files to correct resources path
echo [INFO] Copying Cloudflare Tunnel files...
if not exist "%BUILD_ROOT%\resources\cloudflare" mkdir "%BUILD_ROOT%\resources\cloudflare" >nul 2>nul

if exist "cloudflared.exe" (
  copy /Y "cloudflared.exe" "%BUILD_ROOT%\resources\cloudflare\cloudflared.exe" >nul
  if not errorlevel 1 (
    echo [OK] cloudflared.exe copied ke resources\cloudflare
  ) else (
    echo [WARNING] Gagal copy cloudflared.exe
  )
) else (
  echo [WARNING] cloudflared.exe tidak ditemukan.
)

if exist "config.yml" (
  copy /Y "config.yml" "%BUILD_ROOT%\resources\cloudflare\config.yml" >nul
  if not errorlevel 1 (
    echo [OK] config.yml copied ke resources\cloudflare
  ) else (
    echo [WARNING] Gagal copy config.yml
  )
) else (
  echo [WARNING] config.yml tidak ditemukan.
)

:: 6. Fix icon
echo [INFO] Fixing icon...
if exist "scripts\fix-icon.js" (
  call node scripts\fix-icon.js "%BUILD_ROOT%"
  if errorlevel 1 echo [WARNING] fix-icon.js gagal atau partial.
)

:: 7. Verification
echo.
echo ============================================
echo    VERIFICATION
echo ============================================

if exist "%BUILD_ROOT%\Toko Bersama.exe" (
  echo [OK] Executable found
) else (
  echo [X] Executable NOT found!
  set "ALL_OK=0"
)

if exist "%BUILD_PATH%\reports-fix.js" (
  echo [OK] reports-fix.js exists
) else (
  echo [X] reports-fix.js NOT found!
  set "ALL_OK=0"
)

if exist "%BUILD_PATH%\index.html" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_PATH%\index.html'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "if($c -match 'reports-fix\.js\?v=%CACHE_VERSION%'){ Write-Host '[OK] index.html version OK' } else { Write-Host '[X] index.html version mismatch'; exit 1 }"
  if errorlevel 1 set "ALL_OK=0"
) else (
  echo [X] index.html tidak ditemukan!
  set "ALL_OK=0"
)

if exist "%BUILD_PATH%\sw.js" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$f='%BUILD_PATH%\sw.js'; $c=Get-Content -LiteralPath $f -Raw -Encoding UTF8; " ^
    "if($c -match 'const\s+CACHE_NAME\s*=\s*''%SW_CACHE_NAME%'''){ Write-Host '[OK] sw.js cache version OK' } else { Write-Host '[X] sw.js cache version mismatch'; exit 1 }"
  if errorlevel 1 set "ALL_OK=0"
)

echo.
if "%ALL_OK%"=="1" (
  echo ============================================
  echo    BUILD SUCCESSFUL
  echo ============================================
  echo.
  echo Location: %BUILD_ROOT%
  for %%I in ("%BUILD_ROOT%\Toko Bersama.exe") do (
    echo Size: %%~zI bytes
    echo Date: %%~tI
  )
  echo.
  echo Catatan: lakukan hard refresh (Ctrl+Shift+R) pada PWA admin saat pertama kali buka.
) else (
  echo ============================================
  echo    BUILD COMPLETED WITH WARNINGS
  echo ============================================
)

pause
exit /b 0

