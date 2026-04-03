# Perbaikan Masalah Blank Screen dan Struk Buram

## 📋 Ringkasan Perbaikan

### 1. Masalah Blank Screen Setelah Build

**Penyebab:**
- Path file di `index.html` salah (`main.jsx` → harusnya `main.tsx`)
- Tidak ada error handling untuk chunk loading failures
- CSP mungkin terlalu ketat untuk beberapa konfigurasi

**Perbaikan yang Diterapkan:**
- ✅ Path diperbaiki: `/src/main.jsx` → `/src/main.tsx`
- ✅ Ditambahkan error handler untuk `vite:preloadError`
- ✅ Ditambahkan fallback UI saat terjadi error loading

### 2. Masalah Struk Buram/Tidak Terbaca

**Penyebab:**
- Font size terlalu kecil untuk printer thermal (9-11px)
- Warna abu-abu (#333, #666) tidak terbaca di printer hitam-putih
- Tidak ada CSS optimization untuk printer thermal

**Perbaikan yang Diterapkan:**
- ✅ Font size diperbesar:
  - Small: 9px → 11px
  - Medium: 10px → 12px (default)
  - Large: 11px → 14px
- ✅ CSS diupdate untuk semua template 58mm:
  - `color: #000 !important` (hitam pekat)
  - `background: #fff !important` (background putih)
  - `-webkit-print-color-adjust: exact` (jangan ubah warna saat print)
  - Font family konsisten: `'Courier New', 'Courier', monospace`
- ✅ Print options diperbarui:
  - `scaleFactor: 100` (tidak ada scaling, ikuti CSS asli)
  - `pageSize: 'A4'` (untuk kontrol layout)

---

## 🚀 Cara Build Aplikasi dengan Benar

### Langkah 1: Install Dependencies
```bash
cd D:\Ilham\Documents\Proyek\pos-app
npm install
```

### Langkah 2: Build Renderer (Vite)
```bash
npm run build:renderer
```

### Langkah 3: Build Full Electron App
```bash
# Build portable (single .exe file)
npm run build:portable

# Atau build directory only (for testing)
npm run build:dir
```

### Output Build
Hasil build akan ada di folder: `TOKO BERSAMA REVISI FINAL/`

---

## 🖨️ Pengaturan Printer Struk yang Disarankan

### Untuk Printer Thermal 58mm:

1. **Di Windows Settings:**
   - Buka Settings → Printers & Scanners
   - Pilih printer thermal Anda
   - Klik "Printing preferences"

2. **Setting yang disarankan:**
   - **Paper Size:** 58mm x 297mm (atau A4 dengan crop)
   - **Orientation:** Portrait
   - **Scale:** 100% (atau No Scaling)
   - **Quality:** Draft/Fast (untuk thermal)
   - **Darkness/Density:** High (jika ada opsi)

3. **Di Aplikasi POS:**
   - Settings → Printer Settings
   - Pilih "58mm" sebagai ukuran kertas
   - Pilih template "Formal Plus" atau "Tabel 3 Kolom" (paling jelas)
   - Font Size: "Large" (14px) untuk hasil terbaik

### Tips Printer Thermal:
- **Jarak Head:** Jangan terlalu dekat dengan kertas
- **Kualitas Kertas:** Gunakan kertas thermal berkualitas baik
- **Pembersihan:** Bersihkan head printer secara berkala
- **Kecepatan:** Turunkan kecepatan print jika hasil buram

---

## 🔧 Troubleshooting

### Jika Masih Blank Screen Setelah Build:

1. **Cek Console Error:**
   - Jalankan aplikasi dengan `DEBUG.bat` (jika ada)
   - Atau tekan `F12`/`Ctrl+Shift+I` untuk buka DevTools
   - Cek tab Console untuk error merah

2. **Cek File Assets:**
   ```
   TOKO BERSAMA REVISI FINAL/\resources/
   └── app.asar.unpacked/
       └── dist-renderer/
           ├── index.html
           ├── assets/
           │   ├── index-*.js
           │   ├── LoginPage-*.js
           │   └── ...
   ```

3. **Rebuild Jika Perlu:**
   ```bash
   npm run build:renderer
   npm run build:portable
   ```

### Jika Struk Masih Buram:

1. **Coba Template Berbeda:**
   - Settings → Printer Settings → Template
   - Pilih "Formal Plus" atau "Nota Ringkas"

2. **Perbesar Font:**
   - Settings → Printer Settings → Font Size
   - Pilih "Large"

3. **Cek Printer Driver:**
   - Update driver printer ke versi terbaru
   - Pastikan tidak ada error di printer queue

4. **Test Print Windows:**
   - Print test page dari Windows Printer Settings
   - Jika test page juga buram → masalah hardware/printer

---

## 📁 File yang Diubah

1. `index.html` - Path fix & error handling
2. `electron/printer.js` - Font sizes & print options
3. `electron/receipt_templates.js` - CSS optimization untuk thermal printers

---

## ✅ Checklist Sebelum Build

- [ ] `npm install` berhasil tanpa error
- [ ] `npm run dev` berjalan normal (tidak ada blank screen)
- [ ] Semua halaman bisa diakses (Login, Dashboard, Kasir, dll)
- [ ] Test print struk dari mode development
- [ ] Build renderer: `npm run build:renderer` sukses
- [ ] Build portable: `npm run build:portable` sukses
- [ ] Jalankan aplikasi hasil build dan test semua fitur

---

Dibuat: 31 Maret 2026
Versi perbaikan: 1.0
