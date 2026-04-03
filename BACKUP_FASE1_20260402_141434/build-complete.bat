@echo off
chcp 65001 >nul
title Build Toko Bersama - Unpacked + Portable
color 0B

echo ============================================
echo    BUILD TOKO BERSAMA
echo    Unpacked + Portable Edition
echo ============================================
echo.

:: Set working directory ke pos-app
cd /d "%~dp0"
echo [INFO] Working directory: %CD%
echo.

:: Cek apakah node_modules ada
if not exist "node_modules" (
    echo [ERROR] node_modules tidak ditemukan!
    echo [INFO] Jalankan 'npm install' terlebih dahulu.
    pause
    exit /b 1
)

:: ============================================
:: STEP 1: NPM Rebuild (Native Modules)
:: ============================================
echo [STEP 1/5] NPM Rebuild - Membangun ulang native modules...
echo --------------------------------------------
call npm run postinstall
if %errorlevel% neq 0 (
    echo [ERROR] NPM rebuild gagal!
    pause
    exit /b 1
)
echo [OK] NPM rebuild selesai.
echo.

:: ============================================
:: STEP 2: Hapus Build Lama (Untuk Menimpa)
:: ============================================
echo [STEP 2/5] Membersihkan build lama...
echo --------------------------------------------
if exist "TOKO BERSAMA BARU" (
    echo [INFO] Menghapus folder "TOKO BERSAMA BARU"...
    rmdir /s /q "TOKO BERSAMA BARU"
    if exist "TOKO BERSAMA BARU" (
        echo [WARNING] Gagal menghapus folder, mungkin sedang digunakan.
        echo [INFO] Mencoba rename folder lama...
        move "TOKO BERSAMA BARU" "TOKO BERSAMA BARU_OLD_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1
    ) else (
        echo [OK] Build lama berhasil dihapus.
    )
) else (
    echo [INFO] Tidak ada build lama.
)

if exist "dist-renderer" (
    echo [INFO] Membersihkan dist-renderer lama...
    rmdir /s /q "dist-renderer"
)
echo [OK] Pembersihan selesai.
echo.

:: ============================================
:: STEP 3: Build Renderer (Vite)
:: ============================================
echo [STEP 3/5] Build Renderer (Vite)...
echo --------------------------------------------
call npm run build:renderer
if %errorlevel% neq 0 (
    echo [ERROR] Build renderer gagal!
    pause
    exit /b 1
)
echo [OK] Build renderer selesai.
echo.

:: ============================================
:: STEP 4: Build Unpacked (Directory)
:: ============================================
echo [STEP 4/5] Build Unpacked (Directory)...
echo --------------------------------------------
echo [INFO] Target: win-unpacked dengan icon custom
echo [INFO] Icon: assets\tb_logo_1771832778678.png

call npx electron-builder --win dir --x64
if %errorlevel% neq 0 (
    echo [ERROR] Build unpacked gagal!
    pause
    exit /b 1
)

:: Fix icon untuk executable unpacked
echo [INFO] Mengaplikasikan icon ke executable...
if exist "scripts\fix-icon.js" (
    call node scripts\fix-icon.js "TOKO BERSAMA BARU\win-unpacked"
)
echo [OK] Build unpacked selesai.
echo.

:: ============================================
:: STEP 5: Build Portable
:: ============================================
echo [STEP 5/5] Build Portable...
echo --------------------------------------------
echo [INFO] Membuat versi portable...

call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo [ERROR] Build portable gagal!
    pause
    exit /b 1
)
echo [OK] Build portable selesai.
echo.

:: ============================================
:: HASIL BUILD
:: ============================================
echo ============================================
echo    BUILD SELESAI! ✅
echo ============================================
echo.
echo [HASIL BUILD]:
echo --------------------------------------------

:: Cek dan tampilkan hasil unpacked
if exist "TOKO BERSAMA BARU\win-unpacked" (
    echo 📁 UNPACKED:
    echo    Lokasi: TOKO BERSAMA BARU\win-unpacked\
    echo    Executable: Toko Bersama.exe
    for %%F in ("TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe") do (
        echo    Ukuran: %%~zF bytes
    )
    echo.
)

:: Cek dan tampilkan hasil portable
for %%F in ("TOKO BERSAMA BARU\Toko Bersama*-Portable.exe") do (
    echo 💼 PORTABLE:
    echo    File: %%~nxF
    echo    Lokasi: TOKO BERSAMA BARU\
    echo    Ukuran: %%~zF bytes
    echo.
)

echo --------------------------------------------
echo [CATATAN]:
echo    - Icon aplikasi: tb_logo_1771832778678.png
    - Folder lama telah ditimpa (overwrite)
echo    - Native modules telah di-rebuild
echo.
echo [LANJUTKAN DENGAN]:
echo    - Jalankan unpacked: .\TOKO BERSAMA BARU\win-unpacked\Toko Bersama.exe
    - Jalankan portable: .\TOKO BERSAMA BARU\Toko Bersama-*-Portable.exe
echo.
pause
