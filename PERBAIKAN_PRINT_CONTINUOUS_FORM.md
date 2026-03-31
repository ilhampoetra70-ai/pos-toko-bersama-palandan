# Perbaikan Print Continuous Form & Thermal Printer

## Masalah yang Diperbaiki

### 1. Header Terpotong
**Sebab:** CSS tidak mengatur page break dengan benar, margin terlalu kecil  
**Solusi:** 
- Ditambahkan `@page { margin: 15mm 12mm; }`
- Menggunakan `page-break-inside: avoid` pada header
- Padding atas yang cukup (`padding-top: 5mm`)

### 2. Tulisan Buram/Tidak Jelas
**Sebab:** 
- Font size terlalu kecil (9-11px)
- Warna abu-abu (#333) tidak kontras di printer thermal
- Font sans-serif tidak cocok untuk printer dot matrix

**Solusi:**
- Font size diperbesar: Small=12px, Medium=14px, Large=16px
- Warna hitam pekat: `#000000 !important`
- Font family: `'Courier New', Courier, monospace` (Font A/B compatible)
- Kontras tinggi dengan background putih

### 3. Font A & B Printer Thermal
Printer thermal ESC/POS memiliki 2 font built-in:
- **Font A**: 12x24 dots (~13pt) - Font normal, lebih besar
- **Font B**: 9x17 dots (~10pt) - Font compressed, lebih kecil

Dengan menggunakan font `Courier New` monospace, kita mendapatkan kompatibilitas yang mirip dengan Font A/B printer thermal.

---

## Template Baru untuk Continuous Form

### 1. **CF Thermal Simple (Recommended)**
- `cf-thermal-1` - Template yang dioptimalkan untuk printer thermal/dot matrix
- Font: 13pt (Font A equivalent)
- High contrast, monospace font
- Page break handling yang benar
- Header tidak terpotong

### 2. **CF Thermal Compact**
- `cf-thermal-2` - Versi ringkas dengan font lebih kecil (11pt)
- Cocok untuk nota dengan banyak item
- Font B equivalent

---

## Cara Menggunakan

### Di Aplikasi:
1. Buka **Settings** → **Printer Settings**
2. Pilih **Paper Width**: `CF (Continuous Form)`
3. Pilih **Template**: `CF Thermal Simple (Recommended)`
4. Pilih **Font Size**: `Large` (16px) untuk hasil terbaik
5. Simpan dan test print

### Setting Printer Windows:
1. Buka **Settings** → **Printers & Scanners**
2. Pilih printer thermal Anda → **Printing Preferences**
3. Atur:
   - **Paper Size**: Legal atau A4 (tergantung panjang kertas)
   - **Orientation**: Portrait
   - **Scale**: 100% atau "Actual Size"
   - **Quality**: Draft/Fast (untuk thermal)

---

## Perubahan File

### File yang Dimodifikasi:
1. `electron/receipt_templates.js` - Menambahkan import template thermal
2. `electron/receipt_templates_thermal.js` - File baru dengan template thermal optimized
3. `electron/printer.js` - Update font sizes dan print options

### Detail Perubahan:

#### Font Sizes (printer.js)
```javascript
// SEBELUM:
small: 9px, medium: 10px, large: 11px

// SESUDAH:
small: 12px (Font B), medium: 14px (Font A), large: 16px (Font A large)
```

#### Print Options (printer.js)
```javascript
// Untuk Continuous Form:
pageSize: 'Legal'  // Lebih panjang dari A4
scaleFactor: 100   // Tidak ada scaling
```

#### CSS Optimizations (receipt_templates_thermal.js)
```css
@page { margin: 15mm 12mm; }

body {
  font-family: 'Courier New', monospace;  /* Font A/B compatible */
  font-size: 13pt;                         /* Font A size */
  color: #000 !important;                  /* Hitam pekat */
  background: #fff !important;             /* Putih */
}

.header-section {
  page-break-inside: avoid;    /* Prevent cutoff */
  page-break-after: avoid;     /* Keep with content */
}
```

---

## Troubleshooting

### Masih Terpotong?
- Coba naikkan margin di printer settings Windows
- Pastikan "Scale" diatur ke 100% atau "No Scaling"
- Gunakan template "CF Thermal Simple"

### Masih Buram?
- Pilih Font Size: **Large**
- Bersihkan head printer thermal
- Ganti kertas thermal dengan kualitas lebih baik
- Turunkan kecepatan print di setting printer

### Tidak Sejajar/Serong?
- Pastikan kertas continuous form terpasang dengan benar
- Sesuaikan paper guide di printer
- Cek apakah tractor feed menggigit kertas dengan rata

### Karakter Terpotong di Tepi?
- Naikkan margin di CSS (`@page { margin: 20mm; }`)
- Atur paper size lebih besar (Legal instead of A4)

---

## Tips Printer Thermal Continuous Form

1. **Kertas**: Gunakan kertas continuous form berkualitas baik, tidak tipis
2. **Ribon**: Untuk dot matrix, pastikan ribon masih bagus (hitam pekat)
3. **Head**: Bersihkan head printer secara berkala
4. **Kecepatan**: Turunkan print speed untuk hasil lebih baik
5. **Font**: Printer thermal bekerja best dengan font monospace

---

## Testing

Setelah update, jalankan:
```bash
npm run build:renderer
npm run dev
```

Lalu test print dengan:
1. KasirPage → Buat transaksi
2. Print Preview → Lihat hasil
3. Print ke printer thermal

Jika ada masalah, cek DevTools (F12) untuk error message.

---

Dibuat: 31 Maret 2026
Versi: 1.0 - Thermal Print Optimization
