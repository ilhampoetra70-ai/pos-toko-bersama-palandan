# PROPOSAL Desain Ulang Halaman Laporan (Visual-Only)

## Overview
Proposal ini merumuskan pendekatan desain ulang untuk halaman Laporan (`ReportsPage.tsx`) pada aplikasi POS. Tujuannya adalah menciptakan antarmuka yang lebih modern, *compact* (padat informasi tanpa sesak), dan sepenuhnya responsif/adaptif terhadap tema (Dark/Light Mode) menggunakan konvensi Tailwind CSS dan CSS custom properties (variables) yang konsisten. Desain ulang ini hanya bersifat visual tanpa menyentuh logika bisnis atau query data yang sudah ada.

## Current Layout Analysis
Berdasarkan analisis terhadap `src/pages/ReportsPage.tsx` dan komponen terkait (`SalesReportTab`, `ProfitReportTab`), struktur saat ini adalah:
1. **Header Area**: Judul halaman dan aksi global (`Cetak/Export`, `Refresh Data`).
2. **Navigation Tabs**: Tab untuk berpindah tipe laporan (Penjualan, Laba, Perbandingan, Lengkap).
3. **Filter Area**: Input rentang tanggal dan tombol `Proses Laporan`.
4. **Data Container (Tabs Content)**:
   - **Summary Metrics (`StatCard`)**: Grid statistik utama.
   - **Visualizations (Charts)**: Kartu terpisah untuk grafik.
   - **Data Tables (`TransactionLogSection`, dll)**: Daftar tabel log di bagian bawah.
5. **Print Modal**: Tersembunyi hingga dipicu.

**Kekurangan saat ini:**
- **Spasial (Density)**: Penggunaan *card* dengan padding besar (`p-6`, spasi luas antar komponen) memakan banyak ruang layar secara vertikal, mengharuskan *scroll* berlebih di desktop.
- **Konsistensi Hierarki**: Input tanggal (filter) terkesan lepas dan memakan ruang satu baris besar.
- **Dark Mode Theming**: Pemanggilan kelas spesifik dark mode seperti `dark:bg-gray-800` ditulis statis pada tiap elemen (terverifikasi: 12 instance di `ReportsPage.tsx`, 57 instance di komponen child di `src/components/reports/`), rentan terhadap inkonsistensi.

## Proposed Layout (ASCII Diagram)
Pendekatan *card-based* akan dipertahankan namun dipadatkan. Filter akan disatukan atau disandingkan dengan tab navigasi untuk menghemat ruang vertikal.

```ascii
+------------------------------------------------------------------------+
| [Header] Laporan                                    [Btn: Re-sync]     |
| Analisis performa bisnis...                         [Btn: Print]       |
+------------------------------------------------------------------------+
| [Tab: Penjualan] [Laba] [Perbandingan] [Lengkap]                       |
| [Filter: Tgl Dari] [Filter: Tgl Sampai] [Btn: Proses]                  |
|  └─ Tab Perbandingan: tambah baris [Periode B: Dari] [Sampai] di bawah |
+------------------------------------------------------------------------+
| +-----------------+ +-----------------+ +-----------------+ +-------+  |
| | Pendapatan      | | Total Trx       | | Rata-rata       | | Laba  |  |
| | Rp 1.500.000    | | 120             | | Rp 12.500       | | ...   |  |
| +-----------------+ +-----------------+ +-----------------+ +-------+  |
+------------------------------------------------------------------------+
| +-----------------------------------+ +------------------------------+ |
| | Tren Penjualan (Chart)            | | Distribusi Pembayaran        | |
| |       /\     /\                   | |            (pie)             | |
| |  _/\/   \  /   \                  | |                              | |
| +-----------------------------------+ +------------------------------+ |
+------------------------------------------------------------------------+
| [Tabular Data Section - Compact Table]                                 |
| Log Transaksi                                                          |
| ID      Waktu          Metode        Total           Kasir             |
| 123     10:00          Tunai         Rp 50k          Budi              |
| 124     10:15          QRIS          Rp 25k          Andi              |
+------------------------------------------------------------------------+
```

### Perubahan Layout Utama:
- **Header & Filter Compact**: Area input kalender dikurangi ketinggiannya (menjadi *sm* size) dan diletakkan berdekatan dengan Tabs, membentuk satu konsol navigasi utuh.
- **Filter Tab Perbandingan**: Tab ini membutuhkan 4 input tanggal (Periode A: dari–sampai, Periode B: dari–sampai). Implementasi harus mempertahankan logika conditional `{activeTab === 'comparison' && ...}` yang sudah ada di `ReportsPage.tsx` — jangan dihapus saat refactor layout.
- **Compact Metric Cards**: Hapus padding berlebih pada StatCards.
- **Table Density**: Ukuran font pada tabel (_tabular data_) diturunkan (misal text-sm atau text-xs dengan tabular-nums), padding sel ditekan, mendukung tampilan baris bergaris (zebra-striping) transparan.

## Color Token Strategy
Untuk memastikan Dark Mode mudah dipelihara dan diubah (misalnya jika ada _theme switcher_ warna-warni), kita akan memakai pendekatan **CSS Custom Properties (Variables)** berbasis HSL yang dipadukan ke `tailwind.config.js`.

> **PENTING**: Variabel CSS seperti `--background`, `--card`, `--border`, `--muted`, `--foreground` **sudah ada** di `src/index.css` dengan nilai yang sesuai design system proyek (warm off-white light mode, dark gray dark mode, primary Emerald). **Jangan tambahkan ulang atau timpa nilai-nilai tersebut.** Yang perlu dilakukan hanya mem-bridge variabel yang sudah ada ke Tailwind (lihat Implementation Notes Step 1).

**Penggunaan di Tailwind (Utility Classes)**:
Setelah di-bridge, cukup gunakan `bg-background text-foreground bg-card border-border` di kelas HTML. Tailwind secara dinamis akan membaca nilai HSL dari mode Light/Dark tanpa perlu menulis `dark:` suffix di setiap elemen.

## Component Breakdown
1. **Console Filter (Tabs + Kalender)**
   - Gabungkan ke dalam satu grup *Surface* (`bg-card border border-border rounded-xl`).
   - Gunakan `flex` adaptif (`flex-col` rata di mobile, `flex-row` ruang antar elemen pada desktop).
   - Filter tanggal Periode B untuk tab Perbandingan dirender secara conditional di baris kedua dalam card yang sama.
2. **StatCard (Metric Cards)**
   - Desain borderless dengan bayangan lembut pada *light mode*, flat pada *dark mode* (`border-border`).
   - Teks nominal diformat dengan font monospace (`font-mono` atau `tabular-nums`) agar pergantian data rapi.
3. **Data Tables (TransactionLogSection, dll.)**
   - Head tabel lengket (*sticky header*) dengan warna `bg-muted text-muted-foreground text-xs uppercase`.
   - Baris (*Row*) menggunakan transisi hover `hover:bg-muted/50 transition-colors`.
   - Gunakan badge status (berwarna) memanggil token warna berbasis theme (misal *badge-success* menggunakan HSL).

## Sample Code Reference

Sebagai bentuk demonstrasi, berikut adalah blok kode konseptual untuk menyatukan area filter yang saat ini boros ruang menjadi desain UI yang kompak (_Compact Filter Section_).

```tsx
<Card className="bg-card text-card-foreground border-border shadow-sm rounded-xl mb-6">
  <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
    {/* Tab Navigation */}
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
      <TabsList className="bg-muted text-muted-foreground h-9 p-1 rounded-lg w-full justify-start">
        {TABS.map(tab => (
           <TabsTrigger
             key={tab.id}
             value={tab.id}
             className="text-xs px-3 h-7 rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
           >
             <tab.icon className="w-3.5 h-3.5 mr-1" />
             <span className="hidden sm:inline">{tab.label}</span>
           </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    {/* Filter Pickers — Periode A (semua tab) */}
    <div className="flex w-full lg:w-auto items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 shadow-sm focus-within:ring-1 ring-primary/50">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border-0 shadow-none h-8 text-xs px-1 w-[130px] bg-transparent text-foreground"
        />
        <span className="text-muted-foreground text-xs">-</span>
        <Input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border-0 shadow-none h-8 text-xs px-1 w-[130px] bg-transparent text-foreground"
        />
      </div>

      {/* Filter Periode B — hanya tampil di tab Perbandingan, JANGAN dihapus */}
      {activeTab === 'comparison' && (
        <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 shadow-sm focus-within:ring-1 ring-primary/50">
          <span className="text-muted-foreground text-xs font-semibold">B</span>
          <Input
            type="date"
            value={dateFrom2}
            onChange={e => setDateFrom2(e.target.value)}
            className="border-0 shadow-none h-8 text-xs px-1 w-[130px] bg-transparent text-foreground"
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="date"
            value={dateTo2}
            onChange={e => setDateTo2(e.target.value)}
            className="border-0 shadow-none h-8 text-xs px-1 w-[130px] bg-transparent text-foreground"
          />
        </div>
      )}

      <Button size="sm" onClick={handleFilter} className="h-9 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm">
        Proses
      </Button>
    </div>
  </CardContent>
</Card>
```

**Penjelasan Keputusan Desain (*Design Decisions*):**
- Komponen menggunakan penamaan semantik variabel Tailwind (`bg-card`, `border-border`, `text-muted-foreground`) sehingga kita tidak perlu repot menambahkan suffix `dark:` di setiap HTML prop.
- Tinggi filter ditekan menjadi `h-8` dan `h-9` daripada `h-11` (pada desain lama) yang meningkatkan ruang sisa halaman untuk layar grafik.
- Ikon dan input disatukan dalam satu grup (*focus-within:ring*) memberi ilusi kapsul tanggal solid khas dasbor modern.
- Filter Periode B tetap dipertahankan sebagai conditional block — tidak digabung atau disederhanakan agar logika validasi yang sudah ada tidak rusak.

## Implementation Notes
Jika proposal desain ini ingin diterapkan di masa depan, urutannya sebaiknya:
1. **Tailwind Config Bridge** *(wajib pertama)*: Variabel CSS `--background`, `--card`, `--muted`, `--border`, dll. sudah ada di `src/index.css` — **jangan ditambah ulang**. Yang perlu dilakukan hanya memetakan variabel tersebut ke Tailwind utility classes di `tailwind.config.js`:
   ```js
   // tailwind.config.js — tambahkan di dalam extend.colors
   background: 'hsl(var(--background) / <alpha-value>)',
   foreground: 'hsl(var(--foreground) / <alpha-value>)',
   card: {
     DEFAULT: 'hsl(var(--card) / <alpha-value>)',
     foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
   },
   muted: {
     DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
     foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
   },
   border: 'hsl(var(--border) / <alpha-value>)',
   ```
   Tanpa langkah ini, semua utility class seperti `bg-card` atau `border-border` di sample code tidak akan menghasilkan CSS apapun.
2. **Refactor Wrapper `ReportsPage.tsx`**: Ubah elemen wrapper layout dasar (`Tabs`, `Filter`, `Header`) dengan pendekatan utility semantic (*Compact Component Sample*). Pastikan conditional filter Periode B untuk tab Perbandingan dipertahankan.
3. **Refactor Child Components**: Iterasi ke dalam `StatCard`, Chart Wrappers, dan terakhir Tabel (`TransactionLogSection`) untuk menghilangkan kelas `dark:xxx` absolut dari file mereka satu-persatu menjadi struktur berbasis tema semantic. **Estimasi scope**: ~57 instance di `src/components/reports/` + ~12 instance di `ReportsPage.tsx` sendiri. Lakukan per-file, bukan sekaligus, untuk memudahkan rollback jika ada regresi visual.
4. **Verifikasi Hierarki**: Uji layout dalam 3 form-factor (Mobile, Tablet, Desktop) untuk mendeteksi *scrollbar* ganda atau teks _overflow_.
