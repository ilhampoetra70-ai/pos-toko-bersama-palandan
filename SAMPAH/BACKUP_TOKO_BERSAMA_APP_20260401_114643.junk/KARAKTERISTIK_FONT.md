# Karakteristik Font pada Struk POS

## Font Family

### Font Utama: `Courier New`, `Courier`, `monospace`

```css
font-family: 'Courier New', 'Courier', 'Consolas', monospace;
```

**Alasan pemilihan:**
1. **Monospace** - Setiap karakter memiliki lebar yang sama, memudahkan perataan kolom (tabular data)
2. **Thermal Printer Compatible** - Font ini mirip dengan Font A/B pada printer ESC/POS
3. **Readability** - Jelas terbaca pada kertas thermal/dot matrix
4. **Cross-platform** - Tersedia di Windows, Linux, dan Mac

### Fallback Fonts:
- `'Courier New'` - Windows (font sistem)
- `'Courier'` - Linux/Unix
- `'Consolas'` - Modern Windows/Office
- `monospace` - Generic fallback

---

## Font Size (Ukuran Font)

### Base Font Size (Body)

| Setting | Pixel | Keterangan |
|---------|-------|------------|
| **Small** | 12px | Font B equivalent (9x17 dots) |
| **Medium** | 14px | Font A normal (12x24 dots) - **Default** |
| **Large** | 16px | Font A large |

### Relative Font Sizes (em)

| Elemen | Ukuran | Keterangan |
|--------|--------|------------|
| Store Name | 1.1em - 1.2em | Nama toko lebih besar |
| Header (th) | 0.8em - 0.9em | Header tabel lebih kecil |
| Data (td) | 0.85em - 0.95em | Data standar |
| Total | 1.05em - 1.1em | Total lebih besar |
| Footer | 0.85em - 0.9em | Footer lebih kecil |

---

## Font Weight (Ketebalan)

| Class/Element | Weight | Penggunaan |
|---------------|--------|------------|
| `.bold` | `bold` (700) | Total, header penting |
| `th` | `bold` | Header kolom tabel |
| `td` | `normal` (400) | Data biasa |
| Store Name | `bold` | Nama toko |

---

## Line Height (Tinggi Baris)

### Setting yang Tersedia:

| Setting | Line Height | Keterangan |
|---------|-------------|------------|
| **1.0** | 1.0 | Sangat rapat, hemat kertas |
| **1.1** | 1.1 | Rapat |
| **1.2** | 1.2 | Semi rapat |
| **1.4** | 1.4 | **Normal (default)** |
| **1.6** | 1.6 | Renggang |
| **1.8** | 1.8 | Sangat renggang |
| **2.0** | 2.0 | Extra renggang |

### CSS Property:
```css
line-height: 1.4;
```

---

## Font Characteristics by Printer Type

### 1. Printer Thermal 58mm

```css
body {
  font-family: 'Courier New', 'Courier', monospace;
  font-size: 12px - 14px;  /* Small to Medium */
  line-height: 1.2 - 1.4;
}
```

**Karakteristik:**
- Font lebih kecil karena lebar kertas terbatas
- Line height rapat untuk hemat kertas
- Monospace penting untuk perataan kolom

### 2. Printer Thermal 80mm

```css
body {
  font-family: 'Courier New', 'Courier', monospace;
  font-size: 14px - 16px;  /* Medium to Large */
  line-height: 1.4;
}
```

**Karakteristik:**
- Font lebih besar karena lebar kertas lebih luas
- Lebih nyaman dibaca
- Spasi lebih lega

### 3. Continuous Form (Dot Matrix)

```css
body {
  font-family: 'Courier New', 'Courier', monospace;
  font-size: 13pt - 16pt;  /* Point size */
  line-height: 1.3 - 1.5;
}
```

**Karakteristik:**
- Menggunakan unit `pt` (point) untuk konsistensi
- Font lebih besar untuk keterbacaan dot matrix
- Line height cukup renggang agar tidak bertumpuk

---

## Font Metrics

### Character Width (Monospace)

Pada font monospace, setiap karakter memiliki lebar yang sama:

| Font | Char Width | Use Case |
|------|------------|----------|
| Courier New | ~0.6em | Struk, laporan |
| Consolas | ~0.55em | Modern UI |

### Perhitungan Lebar Teks

Dengan font 14px pada 58mm (220px):
```
Approx chars per line = 220px / (14px * 0.6) ≈ 26 karakter
```

---

## Color & Contrast

### Font Color
```css
color: #000000 !important;  /* Pure black */
```

**Alasan:**
- Kontras maksimal untuk keterbacaan
- Menghemat tinta/ribbon printer
- Tidak ada efek abu-abu pada printer monochrome

### Background
```css
background: #ffffff !important;  /* Pure white */
```

---

## Font Smoothing & Rendering

### Print-Optimized CSS
```css
-webkit-print-color-adjust: exact;
print-color-adjust: exact;
```

**Fungsi:**
- Memastikan warna font tetap hitam pekat saat print
- Mencegah browser mengubah warna untuk "save ink"

---

## Kustomisasi Font

### Mengubah Font Family (Tidak Disarankan)

Jika ingin mengganti font (misal ke Arial):

```css
body {
  font-family: Arial, Helvetica, sans-serif;  /* Sans-serif */
}
```

⚠️ **Peringatan:** Mengganti ke font non-monospace akan merusak perataan kolom tabel!

### Mengubah Font Size via Settings

User dapat mengubah ukuran font di aplikasi:
```
Settings → Printer Settings → Font Size
```

Pilihan: Small (12px) | Medium (14px) | Large (16px)

### Custom Font Size via CSS

Untuk template tertentu:
```css
body { font-size: 10px; }  /* Extra small */
body { font-size: 18px; }  /* Extra large */
```

---

## Best Practices

### 1. Untuk Banyak Item (Hemat Kertas)
```css
font-size: 12px;
line-height: 1.1;
```

### 2. Untuk Lansia (Mudah Dibaca)
```css
font-size: 16px;
line-height: 1.6;
```

### 3. Untuk Dot Matrix (Keterbacaan)
```css
font-family: 'Courier New', monospace;
font-size: 14pt;
font-weight: bold;  /* Untuk karakter tebal */
```

---

## Troubleshooting Font

### Font Tidak Terbaca/Buram
**Solusi:**
1. Naikkan font size ke Large (16px)
2. Gunakan font-weight: bold
3. Pastikan printer head bersih

### Kolom Tidak Sejajar
**Solusi:**
1. Pastikan menggunakan font monospace
2. Jangan ganti ke Arial/sans-serif
3. Cek width percentage di tabel

### Font Terlalu Besar (Terpotong)
**Solusi:**
1. Turunkan font size ke Small (12px)
2. Kurangi panjang nama produk
3. Gunakan template Compact

### Karakter Tidak Muncul (□)
**Solusi:**
1. Gunakan font Courier New (support Unicode terbaik)
2. Hindari karakter spesial
3. Pastikan encoding UTF-8

---

## Perbandingan Font untuk Struk

| Font Family | Monospace | Thermal | Dot Matrix | Rekomendasi |
|-------------|-----------|---------|------------|-------------|
| **Courier New** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Consolas | ✅ | ✅ | ⚠️ | ⭐⭐⭐⭐ |
| Arial | ❌ | ⚠️ | ❌ | ⭐⭐ |
| Times New Roman | ❌ | ❌ | ⚠️ | ⭐ |
| System UI | ❌ | ❌ | ❌ | ⭐ |

**Kesimpulan:** `Courier New` adalah pilihan terbaik untuk struk POS.
