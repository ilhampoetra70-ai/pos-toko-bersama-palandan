# Fitur Print Offset & Spacing Adjustment

## Overview
Fitur ini memungkinkan user untuk mengatur margin, jarak antar baris, dan spasi antar item di struk langsung dari aplikasi.

## Masalah yang Diselesaikan

### 1. Header/Footer Terpotong
- **Solusi**: Sesuaikan Margin Atas/Bawah
- **Setting**: `Margin Atas` dan `Margin Bawah` (dalam mm)

### 2. Struk Terlalu Panjang (Banyak Halaman)
- **Solusi**: Kurangi Line Height dan pilih Spasi Compact
- **Setting**: 
  - `Jarak Baris`: 1.0 - 1.2 (Rapat)
  - `Spasi antar Item`: Compact

### 3. Tulisan Terlalu Padat/Rapat
- **Solusi**: Naikkan Line Height dan pilih Spasi Relaxed
- **Setting**:
  - `Jarak Baris`: 1.6 - 2.0 (Renggang)
  - `Spasi antar Item`: Relaxed

### 4. Tulisan Terlalu Mepet Tepi
- **Solusi**: Sesuaikan Margin Kiri/Kanan
- **Setting**: `Margin Kiri` dan `Margin Kanan` (dalam mm)

---

## Cara Menggunakan

### 1. Buka Pengaturan Printer
```
Settings → Tab "Informasi Printer"
```

### 2. Sesuaikan Margin (Posisi)
Di bagian **"Koreksi Posisi Print (mm)"**:

| Setting | Default | Gunakan |
|---------|---------|---------|
| **Margin Atas** | 10mm | Naikkan jika header terpotong |
| **Margin Bawah** | 10mm | Naikkan jika footer terpotong |
| **Margin Kiri** | 5mm | Sesuaikan jika mepet kiri |
| **Margin Kanan** | 5mm | Sesuaikan jika mepet kanan |

### 3. Sesuaikan Jarak & Spasi
Di bagian **"Jarak antar Baris & Item"**:

#### Jarak Baris (Line Height)
| Opsi | Keterangan | Kapan Digunakan |
|------|------------|-----------------|
| **1.0 - Sangat Rapat** | Baris sangat dekat | Struk terlalu panjang, hemat kertas |
| **1.1 - Rapat** | Baris rapat | Banyak item, hemat kertas |
| **1.2 - Semi Rapat** | Sedikit rapat | Kompromi hemat & terbaca |
| **1.4 - Normal** | Standar | Default, seimbang |
| **1.6 - Renggang** | Baris longgar | Mudah dibaca |
| **1.8 - Sangat Renggang** | Baris jarang | Sulit baca, perlu jelas |
| **2.0 - Extra Renggang** | Baris sangat jarang | Aksesibilitas tinggi |

#### Spasi antar Item
| Opsi | Padding | Kapan Digunakan |
|------|---------|-----------------|
| **Compact** | 2px | Item banyak, hemat kertas |
| **Normal** | 6px | Default, seimbang |
| **Relaxed** | 12px | Item sedikit, mudah dibaca |

### 4. Test Print
Klik tombol **"Test Print"** untuk melihat hasilnya.

### 5. Simpan Perubahan
Klik tombol **"Simpan Perubahan"** di pojok kanan atas.

---

## Rekomendasi Setting Berdasarkan Kebutuhan

### Untuk Struk Panjang (Banyak Item):
```
Line Height: 1.0 - 1.1 (Rapat)
Spasi Item: Compact
Margin: 8mm atas, 5mm bawah
```

### Untuk Struk Standar:
```
Line Height: 1.4 (Normal)
Spasi Item: Normal
Margin: 10mm semua sisi
```

### Untuk Struk yang Mudah Dibaca (Lansia/Mata Minus):
```
Line Height: 1.6 - 1.8 (Renggang)
Spasi Item: Relaxed
Margin: 12mm semua sisi
Font Size: Large (di Template Editor)
```

### Untuk Continuous Form (Dot Matrix):
```
Line Height: 1.2 - 1.4
Spasi Item: Normal
Margin Atas: 15-20mm (antisipasi tractor feed)
Margin Bawah: 15mm
```

---

## Setting yang Tersimpan

Semua setting disimpan di database SQLite:

### Margin (mm):
- `print_margin_top` - default: 10
- `print_margin_bottom` - default: 10
- `print_margin_left` - default: 5
- `print_margin_right` - default: 5

### Spacing:
- `print_line_height` - default: 1.4 (range: 1.0 - 2.0)
- `print_item_spacing` - default: 'normal' (compact/normal/relaxed)

### Scale:
- `print_scale` - default: 100 (%)

---

## Troubleshooting

### Perubahan Tidak Berlaku?
1. Pastikan klik **"Simpan Perubahan"**
2. Restart aplikasi
3. Cek apakah printer yang dipilih benar

### Line Height Tidak Berubah?
- Beberapa template mungkin tidak support semua line height
- Gunakan template "CF Thermal Simple" untuk kompatibilitas terbaik

### Struk Masih Terlalu Panjang Setelah Rapat?
1. Gunakan template dengan font lebih kecil
2. Kurangi jumlah item yang ditampilkan (jika memungkinkan)
3. Pertimbangkan untuk menggunakan kertas continuous form (tidak terbatas panjangnya)

### Spasi antar Item Tidak Konsisten?
- Pastikan menggunakan template yang dioptimalkan (cf-thermal-*)
- Template lama mungkin tidak support item spacing

---

## Catatan Teknis

### Berlaku untuk Semua Ukuran Kertas:
- **58mm**: Line height dan item spacing berlaku
- **80mm**: Line height dan item spacing berlaku
- **CF (Continuous Form)**: Semua setting berlaku penuh

### CSS yang Diterapkan:
```css
/* Line Height */
body { line-height: [user-setting] !important; }

/* Item Spacing */
table.items tbody td { 
  padding-top: [2px|6px|12px] !important; 
  padding-bottom: [2px|6px|12px] !important; 
}
```

### Keterbatasan:
- Minimum line height: 1.0 (tidak bisa kurang)
- Maximum line height: 2.0 (tidak bisa lebih)
- Item spacing hanya berlaku untuk baris item, bukan header/footer
