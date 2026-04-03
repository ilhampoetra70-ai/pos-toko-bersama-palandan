# 🎹 Keyboard Shortcuts - Pintasan Keyboard POS

Panduan lengkap penggunaan keyboard shortcut untuk navigasi cepat di aplikasi POS Kasir.

## 📋 Daftar Shortcut

### 🏠 Navigasi Umum

| Tombol | Fungsi | Keterangan |
|--------|--------|------------|
| `Insert` | Ke Halaman Kasir | Buka halaman transaksi |
| `Home` | Ke Dashboard | Kembali ke halaman utama (admin/supervisor) |
| `Page Up` | Ke Produk | Buka daftar produk (admin/supervisor) |
| `Page Down` | Ke Transaksi | Buka riwayat transaksi (admin/supervisor) |
| `End` | Ke Laporan | Buka halaman laporan (admin/supervisor) |

### 🛒 Operasi Kasir

| Tombol | Fungsi | Keterangan |
|--------|--------|------------|
| `F2` | Transaksi Baru | Reset keranjang, mulai transaksi baru |
| `F3` | Cari Produk | Fokus ke kolom pencarian produk |
| `F4` | Bayar / Checkout | Buka modal pembayaran (jika ada item) |
| `F6` | Cetak Struk Terakhir | Cetak ulang struk transaksi terakhir |
| `F7` | Kalkulator | Buka kalkulator cepat |
| `F8` | Simpan/Tampilkan Pesanan | Hold order / tampilkan pesanan tersimpan |
| `F9` | Data Pelanggan | Buka dialog pilih pelanggan |
| `Space` | Bayar | Shortcut cepat checkout (saat tidak di input) |

### ⌨️ Shortcut dengan Ctrl

| Tombol | Fungsi | Keterangan |
|--------|--------|------------|
| `Ctrl + F` | Cari Produk | Alternatif F3 |
| `Ctrl + N` | Transaksi Baru | Alternatif F2 |
| `Ctrl + P` | Print | Cetak struk (saat modal receipt terbuka) |
| `Ctrl + S` | Simpan | Simpan form (jika sedang edit) |

### ❓ Bantuan & Lainnya

| Tombol | Fungsi | Keterangan |
|--------|--------|------------|
| `F1` | Bantuan Shortcut | Tampilkan modal pintasan keyboard |
| `F10` | Pengaturan | Buka halaman settings |
| `F11` | Layar Penuh | Toggle fullscreen mode |
| `Esc` | Tutup / Batal | Tutup modal atau batalkan aksi |

## 💡 Tips Penggunaan

### Untuk Kasir:
1. **Mulai Transaksi**: Tekan `F2` → Scan barcode / Cari produk (`F3`) → Tambah item → Tekan `F4` untuk bayar
2. **Cari Cepat**: Gunakan `Ctrl + F` atau `F3` untuk langsung fokus ke pencarian
3. **Checkout Cepat**: Tekan `Space` saat tidak ada input yang aktif untuk langsung checkout
4. **Bantuan**: Lupa shortcut? Tekan `F1` kapan saja

### Untuk Admin:
1. **Navigasi Cepat**: Gunakan `Home`, `Page Up`, `Page Down`, `End` untuk berpindah antar menu utama
2. **Multi-tasking**: Kombinasikan shortcut navigasi dengan operasi kasir

## 🔧 Troubleshooting

**Shortcut tidak berfungsi?**
- Pastikan tidak sedang mengetik di input field
- Cek apakah modal dialog sedang terbuka (fokus mungkin teralihkan)
- Beberapa shortcut seperti `F11` (fullscreen) mungkin ditangkap oleh browser/OS

**Konflik Shortcut?**
- Jika menggunakan browser, pastikan tidak ada extension yang menggunakan shortcut sama
- Pada aplikasi desktop (Electron), semua shortcut seharusnya berfungsi normal

## 📝 Catatan Pengembang

Untuk menambahkan shortcut baru:
1. Edit file `src/hooks/useKeyboardShortcuts.ts`
2. Tambahkan definisi key di `SHORTCUT_KEYS`
3. Tambahkan konfigurasi di fungsi builder (e.g., `createCashierShortcuts`)
4. Update dokumentasi ini

---

*Dokumen ini diperbarui secara berkala. Terakhir update: 2026-04-02*
