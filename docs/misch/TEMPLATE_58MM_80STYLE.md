# Template 58mm dengan Layout 4 Kolom (Item | Qty | Harga | Total)

## Update Terbaru
**SEMUA template 58mm sekarang menggunakan layout 4 kolom!**

## Perubahan
- Semua template 58mm (1-12) sekarang memiliki struktur tabel yang sama dengan 80mm
- Format: **Item | Qty | Harga | Total**
- Simbol "Rp" dihilangkan dari setiap baris (hanya angka), menghemat space
- Angka menggunakan format: ".toLocaleString('id-ID')"

## Contoh Perbandingan

### Sebelum (Layout Lama):
\\\
Nama Produk
2 x Rp 25.000      Rp 50.000
\\\

### Sesudah (Layout Baru - 4 Kolom):
\\\
Item         Qty  Harga   Total
Produk A      2   25.000  50.000
Produk B      1   30.000  30.000
\\\

## Template yang Tersedia (58mm)

| Template | Nama | Karakteristik |
|----------|------|---------------|
| 58mm-1 | Simple (Default) | Standar 4 kolom, font normal |
| 58mm-2 | Compact | Font kecil, padding minimal |
| 58mm-3 | Modern | Border tebal, style modern |
| 58mm-4 | Big Header | Header besar, 4 kolom |
| 58mm-5 | Extra Compact | Super ringkas |
| 58mm-6 | Boxed Total | Total dalam box |
| 58mm-7 | Eco (Small) | Font 10px, hemat |
| 58mm-8 | Outlined (Formal) | Border formal |

## Struktur Tabel

### Header (Th):
- Item: 40-42% (left)
- Qty: 12-14% (center)
- Harga: 22-25% (right)
- Total: 22-25% (right)

### Data (Td):
Format angka tanpa "Rp":
\\\javascript
Number(item.price).toLocaleString('id-ID')
// Output: 25.000 (bukan Rp 25.000)
\\\

## Tips Penggunaan

### Jika Nama Produk Panjang:
- Gunakan template **Compact** (58mm-2)
- Atur Font Size ke **Small**

### Jika Angka Tidak Muat:
- Gunakan template dengan font lebih kecil
- Atur Font Size ke **Small** atau **Extra Small**

### Untuk Tampilan Premium:
- Gunakan template **Modern** (58mm-3)
- Atur Line Height ke **Normal** atau **Renggang**

## Format Angka

Semua angka menggunakan format Indonesia tanpa "Rp":
- Harga: 25.000 (bukan Rp 25.000)
- Total: 50.000 (bukan Rp 50.000)
- Subtotal: 100.000 (bukan Rp 100.000)

Di bagian summary (total akhir), tetap ada indikasi mata uang dari konteks.

## Perbandingan Ukuran

| Aspek | 58mm | 80mm |
|-------|------|------|
| Lebar | 58mm (~220px) | 80mm (~302px) |
| Kolom | 4 (sama) | 4 (sama) |
| Font | Sedikit kecil | Normal |
| Format | Tanpa Rp | Tanpa Rp |

## Troubleshooting

### Nama Produk Terpotong?
1. Gunakan template **Compact** atau **Extra Compact**
2. Turunkan Font Size
3. Singkat nama produk di database

### Terlalu Rapat?
1. Naikkan Line Height ke 1.6 atau 1.8
2. Gunakan template **Modern**
3. Atur Item Spacing ke **Relaxed**

### Tidak Terbaca?
1. Naikkan Font Size ke **Large**
2. Gunakan template **Simple** (default)
3. Atur Line Height ke **Renggang**

## File Terkait
- electron/receipt_templates.js - Semua template 58mm dengan 4 kolom
