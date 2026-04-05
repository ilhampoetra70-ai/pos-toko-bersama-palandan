# Reports Page Fix Roadmap

Hasil audit mendalam halaman Laporan (ReportsPage.tsx, 920 baris). Terdapat **8 issues** (2 HIGH, 4 MEDIUM, 2 LOW).
Eksekusi secara berurutan: Fase 1 → Fase 2 → Fase 3.

---

## Fase 1 — [HIGH] Perbaiki PDF Export yang Menampilkan "Rp NaN"

**Target file:**
- `src/pages/ReportsPage.tsx`

**Issues yang diselesaikan:** H1, H2

---

### Prompt untuk Coding Agent:

```
Perbaiki dua bug di src/pages/ReportsPage.tsx yang menyebabkan PDF export untuk tab
"Laporan Laba" dan "Laporan Lengkap" menampilkan "Rp NaN" di seluruh kartu ringkasan.

=== Root cause ===

`getProfitReport()` mengembalikan struktur:
  { products: [...], totals: { revenue, cost, profit, margin }, transactionLog: [...] }

Tetapi buildProfitHTML dan buildComprehensiveHTML mengakses field yang tidak ada:
  profitData.total_profit  → seharusnya profitData.totals.profit
  profitData.total_revenue → seharusnya profitData.totals.revenue
  profitData.total_cost    → seharusnya profitData.totals.cost

Bandingkan dengan ProfitReportTab.tsx baris 15-18 yang SUDAH BENAR:
  data.totals.revenue / data.totals.cost / data.totals.profit / data.totals.margin

=== Bug H1: buildProfitHTML (sekitar baris 437–517) ===

Cari fungsi `buildProfitHTML`. Temukan bagian `<div class="summary-cards">`:
```tsx
<div class="summary-card">...(profitData.total_profit)...</div>
<div class="summary-card">...(profitData.total_revenue)...</div>
<div class="summary-card">...(profitData.total_cost)...</div>
<div class="summary-card">...((profitData.total_profit / profitData.total_revenue) * 100)...</div>
```

PERBAIKAN — ganti semua akses field dengan path yang benar:
- `profitData.total_profit`  → `profitData.totals.profit`
- `profitData.total_revenue` → `profitData.totals.revenue`
- `profitData.total_cost`    → `profitData.totals.cost`

Sehingga bagian summary-cards menjadi:
```tsx
const body = `
    <div class="summary-cards">
        <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL LABA</div><div style="font-size:18px;font-weight:900;color:green">${formatCurrency(profitData.totals.profit)}</div></div>
        <div class="summary-card"><div style="font-weight:bold;color:#666">PENDAPATAN</div><div style="font-size:18px;font-weight:900">${formatCurrency(profitData.totals.revenue)}</div></div>
        <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL MODAL</div><div style="font-size:18px;font-weight:900">${formatCurrency(profitData.totals.cost)}</div></div>
        <div class="summary-card"><div style="font-weight:bold;color:#666">MARGIN</div><div style="font-size:18px;font-weight:900">${profitData.totals.revenue > 0 ? ((profitData.totals.profit / profitData.totals.revenue) * 100).toFixed(1) : '0.0'}%</div></div>
    </div>
```

Catatan: tambahkan guard `profitData.totals.revenue > 0 ? ... : '0.0'` untuk mencegah
NaN bila revenue = 0.

=== Bug H2: buildComprehensiveHTML (sekitar baris 600–752) ===

Cari fungsi `buildComprehensiveHTML`. Di awal fungsi ada destructuring:
```tsx
const { sales, profit, hourly, transactionLog } = comprehensiveData;
```

`profit` di sini adalah return value dari `getProfitReport()`, yaitu
`{ products, totals: { revenue, cost, profit, margin }, transactionLog }`.

Temukan bagian `<div class="summary-cards">` yang berisi:
```tsx
${formatCurrency(profit.total_profit)}
${((profit.total_profit / profit.total_revenue) * 100).toFixed(1)}%
${formatCurrency(profit.total_cost)}
```

PERBAIKAN — ganti semua akses field profit:
- `profit.total_profit`  → `profit.totals.profit`
- `profit.total_revenue` → `profit.totals.revenue`
- `profit.total_cost`    → `profit.totals.cost`

Sehingga bagian tersebut menjadi:
```tsx
<div class="summary-card"><div>LABA KOTOR</div><div style="font-weight:900;color:green">${formatCurrency(profit.totals.profit)}</div></div>
<div class="summary-card"><div>MARGIN</div><div style="font-weight:900;color:blue">${profit.totals.revenue > 0 ? ((profit.totals.profit / profit.totals.revenue) * 100).toFixed(1) : '0.0'}%</div></div>
<div class="summary-card"><div>TOTAL MODAL</div><div style="font-weight:900">${formatCurrency(profit.totals.cost)}</div></div>
```

Sama seperti H1, tambahkan guard `revenue > 0` untuk mencegah NaN saat data kosong.
```

---

## Fase 2 — [MEDIUM] Error Handling & Guard untuk Comparison Tab

**Target file:**
- `src/pages/ReportsPage.tsx`

**Issues yang diselesaikan:** M3, M4

---

### Prompt untuk Coding Agent:

```
Perbaiki dua masalah di src/pages/ReportsPage.tsx:
1. Tambahkan error handling untuk sales, profit, dan comparison report
2. Tambahkan guard agar useComparisonReport tidak fire dengan tanggal kosong

=== Perbaikan M3: Tambah isError handling untuk sales, profit, comparison ===

Cari destructuring dari useSalesReport, useProfitReport, dan useComparisonReport
(sekitar baris 65–84). Saat ini:
```ts
const {
    data: salesData,
    isLoading: isLoadingSales,
    refetch: refetchSales
} = useSalesReport({ date_from: dateFrom, date_to: dateTo });

const {
    data: profitData,
    isLoading: isLoadingProfit,
    refetch: refetchProfit
} = useProfitReport({ date_from: dateFrom, date_to: dateTo });

const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    refetch: refetchComparison
} = useComparisonReport({ ... });
```

PERBAIKAN — tambahkan `isError` di setiap destructuring:
```ts
const {
    data: salesData,
    isLoading: isLoadingSales,
    isError: isErrorSales,
    refetch: refetchSales
} = useSalesReport({ date_from: dateFrom, date_to: dateTo });

const {
    data: profitData,
    isLoading: isLoadingProfit,
    isError: isErrorProfit,
    refetch: refetchProfit
} = useProfitReport({ date_from: dateFrom, date_to: dateTo });

const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    isError: isErrorComparison,
    refetch: refetchComparison
} = useComparisonReport({ ... });
```

Kemudian tambahkan state error gabungan di bawah `loading` (sekitar baris 101):
```ts
const loading = isLoadingSales || isLoadingProfit || isLoadingComparison || isLoadingComprehensive;
const hasError = isErrorSales || isErrorProfit || isErrorComparison || isErrorComprehensive;
```

Cari bagian JSX tempat loading spinner ditampilkan (sekitar baris 848–903):
```tsx
{loading ? (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        ...spinner...
    </div>
) : (
    <>
        {activeTab === 'sales' && salesData && ( ... )}
        ...
    </>
)}
```

PERBAIKAN — tambahkan error state di antara loading dan content:
```tsx
{loading ? (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-bold">Menyusun data laporan...</p>
    </div>
) : hasError ? (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
            <RetroChart className="w-10 h-10 text-red-400" />
        </div>
        <div className="space-y-1">
            <p className="font-bold text-foreground">Gagal memuat laporan</p>
            <p className="text-sm text-muted-foreground">Terjadi kesalahan saat mengambil data. Coba ubah periode dan klik Proses lagi.</p>
        </div>
    </div>
) : (
    <>
        {activeTab === 'sales' && salesData && ( ... )}
        ...
    </>
)}
```

Pastikan `RetroChart` sudah ada di import (sudah ada di baris 16).

=== Perbaikan M4: Tambah enabled guard untuk useComparisonReport ===

Masalah: useComparisonReport fire pada saat mount dengan dateFrom2='' dan dateTo2='',
menghasilkan IPC call sia-sia ke backend.

File: src/lib/queries.ts
Cari `useComparisonReport` (sekitar baris 295):
```ts
export const useComparisonReport = (filters: any) => {
    return useQuery({
        queryKey: reportKeys.comparison(filters),
        queryFn: () => window.api.getPeriodComparison(
            filters.date_from, filters.date_to,
            filters.date_from_2, filters.date_to_2
        ),
    });
};
```

PERBAIKAN — tambahkan `enabled` yang mensyaratkan semua 4 tanggal harus berisi:
```ts
export const useComparisonReport = (filters: any) => {
    return useQuery({
        queryKey: reportKeys.comparison(filters),
        queryFn: () => window.api.getPeriodComparison(
            filters.date_from, filters.date_to,
            filters.date_from_2, filters.date_to_2
        ),
        enabled: !!(filters.date_from && filters.date_to && filters.date_from_2 && filters.date_to_2),
    });
};
```
```

---

## Fase 3 — [MEDIUM + LOW] Perbaiki Loading State & Query Efficiency

**Target file:**
- `src/pages/ReportsPage.tsx`
- `src/lib/queries.ts`

**Issues yang diselesaikan:** M1, M2, L1, L2

---

### Prompt untuk Coding Agent:

```
Perbaiki masalah performa dan UX di halaman laporan:
1. Loading state yang OR semua 4 report
2. Query auto-fire saat mount dan tiap keystroke
3. getToday() menggunakan device timezone

=== Perbaikan M2: Loading state per-tab, bukan OR semua 4 ===

File: src/pages/ReportsPage.tsx
Cari `const loading = ...` (sekitar baris 101):
```ts
const loading = isLoadingSales || isLoadingProfit || isLoadingComparison || isLoadingComprehensive;
```

PERBAIKAN — ubah menjadi loading yang kontekstual berdasarkan activeTab:
```ts
const loading = (
    (activeTab === 'sales' && isLoadingSales) ||
    (activeTab === 'profit' && isLoadingProfit) ||
    (activeTab === 'comparison' && isLoadingComparison) ||
    (activeTab === 'comprehensive' && isLoadingComprehensive)
);
const hasError = (
    (activeTab === 'sales' && isErrorSales) ||
    (activeTab === 'profit' && isErrorProfit) ||
    (activeTab === 'comparison' && isErrorComparison) ||
    (activeTab === 'comprehensive' && isErrorComprehensive)
);
```

Catatan: pastikan Fase 2 (yang menambahkan isError*) sudah dieksekusi lebih dulu.

=== Perbaikan M1 + L2: Cegah auto-fire saat mount, jadikan manual trigger ===

Masalah: semua report hook langsung fire saat mount (tidak ada enabled:false), dan
handleFilter memanggil refetch() secara manual padahal React Query sudah auto-refetch
saat queryKey berubah.

Strategi fix: gunakan `enabled` state yang dikendalikan user.

File: src/pages/ReportsPage.tsx

1. Tambahkan state `hasFetched` (menandai apakah user sudah klik "Proses" pertama kali):
```ts
const [hasFetched, setHasFetched] = useState(false);
```

2. Ubah semua 4 report hooks dengan menambahkan `enabled: hasFetched`:
```ts
const {
    data: salesData,
    isLoading: isLoadingSales,
    isError: isErrorSales,
    refetch: refetchSales
} = useSalesReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);
// Catatan: ubah signature hooks di queries.ts untuk menerima enabled parameter
```

3. File: src/lib/queries.ts — ubah semua report hooks untuk menerima `enabled` param:
```ts
export const useSalesReport = (filters: any, enabled = true) =>
    useQuery({
        queryKey: reportKeys.sales(filters),
        queryFn: () => window.api.getSalesReport(filters.date_from, filters.date_to),
        enabled,
    });

export const useProfitReport = (filters: any, enabled = true) =>
    useQuery({
        queryKey: reportKeys.profit(filters),
        queryFn: () => window.api.getProfitReport(filters.date_from, filters.date_to),
        enabled,
    });

export const useComparisonReport = (filters: any, enabled = true) =>
    useQuery({
        queryKey: reportKeys.comparison(filters),
        queryFn: () => window.api.getPeriodComparison(
            filters.date_from, filters.date_to,
            filters.date_from_2, filters.date_to_2
        ),
        enabled: enabled && !!(filters.date_from && filters.date_to && filters.date_from_2 && filters.date_to_2),
    });

export const useComprehensiveReport = (filters: any, enabled = true) =>
    useQuery({
        queryKey: reportKeys.comprehensive(filters),
        queryFn: () => window.api.getComprehensiveReport(filters.date_from, filters.date_to),
        enabled,
    });
```

4. Update panggilan hooks di ReportsPage.tsx:
```ts
const { data: salesData, isLoading: isLoadingSales, isError: isErrorSales, refetch: refetchSales }
    = useSalesReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);

const { data: profitData, isLoading: isLoadingProfit, isError: isErrorProfit, refetch: refetchProfit }
    = useProfitReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);

const { data: comparisonData, isLoading: isLoadingComparison, isError: isErrorComparison, refetch: refetchComparison }
    = useComparisonReport({
        date_from: dateFrom, date_to: dateTo,
        date_from_2: dateFrom2, date_to_2: dateTo2
    }, hasFetched);

const { data: comprehensiveData, isLoading: isLoadingComprehensive, isError: isErrorComprehensive, error: errorComprehensive, refetch: refetchComprehensive }
    = useComprehensiveReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);
```

5. Update `handleFilter` untuk set `hasFetched` dan hanya trigger refetch bila
   hasFetched sudah true:
```ts
const handleFilter = () => {
    if (activeTab === 'comparison' && (!dateFrom2 || !dateTo2)) {
        showStatus('Silakan isi tanggal Periode B', 'error');
        return;
    }
    if (!hasFetched) {
        // First time — just set enabled=true, React Query will auto-fetch
        setHasFetched(true);
        return;
    }
    // Subsequent clicks — manually refetch the active tab
    if (activeTab === 'sales') refetchSales();
    else if (activeTab === 'profit') refetchProfit();
    else if (activeTab === 'comparison') refetchComparison();
    else if (activeTab === 'comprehensive') refetchComprehensive();
};
```

=== Perbaikan L1: Gunakan timezone offset dari settings ===

File: src/pages/ReportsPage.tsx
Cari fungsi `getToday()` (baris 36–40):
```ts
function getToday() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}
```

MASALAH: `getTimezoneOffset()` menggunakan timezone OS device, bukan timezone yang
dikonfigurasi di settings POS.

PERBAIKAN — tambahkan helper `getTodayWithSettings()` yang membaca settings:
```ts
function getTodayWithSettings(settings: any): string {
    const d = new Date();
    // Gunakan timezone_offset dari settings POS jika tersedia, fallback ke device
    const configuredOffset = settings?.timezone_offset;
    let offsetHours: number;
    if (configuredOffset && configuredOffset !== 'auto') {
        offsetHours = parseFloat(configuredOffset);
    } else {
        offsetHours = -(d.getTimezoneOffset() / 60);
    }
    const localMs = d.getTime() + (offsetHours * 3600000);
    return new Date(localMs).toISOString().slice(0, 10);
}
```

Kemudian ubah `useState` untuk `dateFrom` dan `dateTo` agar menggunakan settings.
Karena settings diload async via `useSettings()`, ubah initial state dan tambahkan
effect:

```ts
const [dateFrom, setDateFrom] = useState(getToday()); // temp default
const [dateTo, setDateTo] = useState(getToday());

// Sinkronkan dengan settings timezone saat settings tersedia
useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
        const today = getTodayWithSettings(settings);
        setDateFrom(today);
        setDateTo(today);
    }
}, [settings]);
```

Fungsi `getToday()` lama tetap dipertahankan untuk initial render sebelum settings loaded.
```

---

## Ringkasan Eksekusi

| Fase | Issues | File yang Diubah | Prioritas |
|------|--------|-----------------|-----------|
| Fase 1 | H1, H2 | `ReportsPage.tsx` | **Wajib** — PDF export rusak |
| Fase 2 | M3, M4 | `ReportsPage.tsx`, `queries.ts` | **Wajib** — error handling |
| Fase 3 | M1, M2, L1, L2 | `ReportsPage.tsx`, `queries.ts` | Disarankan — performa & UX |

**Dependensi:**
- Fase 2 harus selesai sebelum Fase 3 (Fase 3 bergantung pada `isError*` dari Fase 2)
- Fase 1 berdiri sendiri, bisa dieksekusi kapan saja
