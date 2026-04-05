@echo off
:: ================================================================
:: SCRIPT: Paksa Ambil Alih Akses Folder .git
:: HARUS DIJALANKAN SEBAGAI ADMINISTRATOR (Run as Administrator)
:: ================================================================

:: Cek apakah dijalankan sebagai administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Script ini HARUS dijalankan sebagai Administrator!
    echo Klik kanan file ini, lalu pilih "Run as administrator".
    pause
    exit /b 1
)

set TARGET=D:\Ilham\Documents\Proyek\pos-app\.git

echo ================================================================
echo  PAKSA AMBIL ALIH AKSES FOLDER .git
echo  Target: %TARGET%
echo ================================================================
echo.

:: --- TAHAP 1: Nonaktifkan proteksi dengan seSubAuthority (kurangi privilege restriction) ---
echo [1/6] Mengaktifkan hak Seize Ownership lewat policy...
secedit /configure /cfg %windir%\inf\defltbase.inf /db defltbase.sdb /verbose >nul 2>&1
echo      Selesai.
echo.

:: --- TAHAP 2: Paksa ambil kepemilikan menggunakan subinacl jika ada, atau icacls langsung ---
echo [2/6] Paksa reset semua permission inheritance...
icacls "%TARGET%" /reset /T /C /Q
echo      Selesai.
echo.

:: --- TAHAP 3: Paksa ambil kepemilikan (takeown) ---
echo [3/6] Mengambil alih kepemilikan (takeown paksa)...
takeown /F "%TARGET%" /R /A /D Y
takeown /F "%TARGET%" /R /D Y
echo      Selesai.
echo.

:: --- TAHAP 4: Berikan Full Control ke Administrators dan user saat ini ---
echo [4/6] Memberikan Full Control ke Administrators...
icacls "%TARGET%" /grant Administrators:(OI)(CI)F /T /C /Q
echo.
echo [5/6] Memberikan Full Control ke user: %USERNAME%...
icacls "%TARGET%" /grant "%USERNAME%":(OI)(CI)F /T /C /Q
echo.

:: --- TAHAP 5: Hapus atribut tersembunyi dan read-only ---
echo [6/6] Menghapus atribut Hidden, Read-Only, System...
attrib -h -r -s "%TARGET%" /S /D
echo      Selesai.
echo.

:: --- TAHAP 6: Coba hapus folder .git (opsional, aktifkan jika ingin langsung dihapus) ---
echo ================================================================
echo  Semua proses selesai!
echo.
echo  Sekarang coba cek apakah folder .git sudah bisa diakses.
echo  Jika berhasil, Anda bisa menghapus folder .git secara manual
echo  lalu jalankan: git init
echo ================================================================
echo.
echo Jika MASIH gagal, kemungkinan folder dikunci oleh proses aktif.
echo Coba restart komputer dan jalankan script ini lagi.
echo.
pause
