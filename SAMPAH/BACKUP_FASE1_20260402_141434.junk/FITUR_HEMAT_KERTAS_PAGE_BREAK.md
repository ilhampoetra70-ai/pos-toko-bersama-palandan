# Fitur Hemat Kertas - Page Break Control

## Masalah
Jarak antar struk (page break) terlalu besar sehingga kertas continuous form cepat habis.

## Solusi
Tambahan setting untuk mengontrol jarak antar halaman struk:

### 1. Jarak antar Struk (Page Gap)

| Opsi | Jarak | Keterangan |
|------|-------|------------|
| **None - Rapat** | 0mm | Tidak ada jarak, struk menyambung langsung |
| **Compact - Minimal** | 5mm | Jarak minimal untuk memisahkan struk (Default) |
| **Normal - Standar** | 15mm | Jarak standar seperti sebelumnya |

### 2. Minimal Tinggi Struk (Min Height)

| Opsi | Tinggi | Kapan Digunakan |
|------|--------|-----------------|
| **Auto - Sesuai isi** | Fleksibel | Default, tinggi mengikuti jumlah item |
| **50mm - Minimal** | 50mm | Struk dengan 1-2 item tetap terlihat proporsional |
| **80mm - Sedang** | 80mm | Untuk tampilan standar |
| **100mm - Panjang** | 100mm | Jika ingin struk terlihat lebih formal |

---

## Cara Menggunakan

### 1. Buka Pengaturan Printer
```
Settings → Tab "Informasi Printer"
```

### 2. Atur Jarak antar Struk
Di bagian **"Hemat Kertas antar Struk"**:

**Untuk Menghemat Kertas (Continuous Form):**
```
Jarak antar Struk: None - Rapat (Ekonomis)
Minimal Tinggi Struk: Auto
```

**Untuk Memisahkan Struk dengan Jarak Minimal:**
```
Jarak antar Struk: Compact - Minimal (Default)
Minimal Tinggi Struk: Auto
```

**Untuk Tampilan Standar (Seperti Sebelumnya):**
```
Jarak antar Struk: Normal - Standar
Minimal Tinggi Struk: Auto
```

### 3. Test Print
Klik tombol **"Test Print"** untuk melihat hasilnya.

### 4. Simpan Perubahan
Klik tombol **"Simpan Perubahan"** di pojok kanan atas.

---

## Rekomendasi Berdasarkan Penggunaan

### Untuk Continuous Form (Kertas Panjang):
```
Jarak antar Struk: None atau Compact
Minimal Tinggi Struk: Auto atau 50mm
Margin Atas/Bawah: 10-15mm
```

### Untuk Kertas Potongan (A4/Letter):
```
Jarak antar Struk: Normal
Minimal Tinggi Struk: Auto
```

### Untuk Struk dengan Item Sedikit (1-2 barang):
```
Minimal Tinggi Struk: 80mm atau 100mm
Jarak antar Struk: Compact
```
Ini membuat struk tidak terlalu pendek dan terlihat lebih profesional.

### Untuk Batch Print (Banyak Struk Sekaligus):
```
Jarak antar Struk: None - Rapat
Minimal Tinggi Struk: Auto
Line Height: 1.0 - 1.2 (Rapat)
Item Spacing: Compact
```
Kombinasi ini paling hemat kertas.

---

## Setting yang Tersimpan

Semua setting disimpan di database SQLite:
- `print_page_gap` - Jarak antar struk: 'none', 'compact', 'normal'
- `print_min_height` - Minimal tinggi: 'auto', '50mm', '80mm', '100mm'

---

## Troubleshooting

### Struk Masih Terlalu Berjarak?
1. Pastikan setting "Jarak antar Struk" = "None - Rapat"
2. Cek setting printer Windows (Page Break)
3. Gunakan template "CF Thermal Simple"

### Struk Terlalu Rapat/Sulit Dipotong?
1. Naikkan ke "Compact - Minimal" atau "Normal"
2. Naikkan "Minimal Tinggi Struk" ke 80mm

### Minimal Height Tidak Berfungsi?
- Fitur ini hanya berlaku untuk template thermal (cf-thermal-*)
- Template lama mungkin tidak support

---

## Perhitungan Penghematan Kertas

**Asumsi:** Continuous Form 9.5" x 11", 1 rim = 2000 lembar

### Sebelum (Normal):
- Jarak antar struk: 15mm
- Rata-rata struk: 100mm
- Total per struk: 115mm
- 1 rim = ~174 struk

### Sesudah (None - Rapat):
- Jarak antar struk: 0mm
- Rata-rata struk: 100mm
- Total per struk: 100mm
- 1 rim = ~200 struk

**Penghematan:** ~15% kertas (26 struk lebih banyak per rim!)

---

## Catatan Penting

### Khusus Continuous Form:
- Setting "None - Rapat" ideal untuk kertas tractor feed
- Struk akan menyambung langsung tanpa potongan
- User perlu memotong manual dengan cutter/gunting

### Khusus Thermal Roll:
- Setting "Compact" lebih cocok
- Auto-cutter printer akan memotong dengan jarak minimal

### Khusus Dot Matrix:
- Setting "None" atau "Compact" bisa digunakan
- Perhatikan posisi tractor feed agar tidak menyebabkan paper jam
