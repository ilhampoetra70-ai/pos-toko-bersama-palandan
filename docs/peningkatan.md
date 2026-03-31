# Rencana Peningkatan pos-app
> Dokumen ini merangkum hasil analisis arsitektur, pendapat tandingan, bug yang ditemukan, dan prompt eksekusi per fase untuk coding agent.

---

## Bagian 1 — Ringkasan Analisis & Pendapat Tandingan

### Kekuatan yang Sudah Ada (Tidak Perlu Diubah)

| Area | Detail |
|---|---|
| Database | WAL mode, `synchronous=NORMAL`, 64MB cache, `mmap_size=256MB`, `temp_store=MEMORY` |
| Prepared Statements | `stmtCache` Map di `database.js` — overhead parsing SQL minimal |
| React Query | `staleTime` global 30s, kategori/settings 5 menit, `refetchOnWindowFocus: false` |
| Lazy Loading | Semua halaman menggunakan `React.lazy()` + `Suspense` di `App.tsx` |
| Virtual List | `VirtualizedTable.tsx` sudah implementasi `@tanstack/react-virtual` |
| Vite Chunks | Manual split: `vendor`, `charts`, `xlsx`, `barcode` |
| V8 Cache | `v8CacheOptions: 'bypassHeatCheck'` — bytecode di-cache setelah parse pertama |
| Electron Flags | `--max-old-space-size=256`, `disable-gpu-compositing`, `disk-cache-size=10MB` |

### Rekomendasi yang DITOLAK dari Code Agent Sebelumnya

**Worker Thread untuk Express API — TIDAK DISARANKAN**
- `better-sqlite3` synchronous by design. Marshal data via `postMessage` antar thread justru menambah overhead lebih besar dari masalah yang dipecahkan.
- Price checker PWA hanya dipakai di LAN lokal — bukan high-concurrency workload.
- SQLite WAL sudah handle concurrent reads. Bottleneck ada di query latency, bukan thread blocking.
- Refactor ini menambah kompleksitas signifikan (DB connection sharing, lifecycle Worker) dengan gain tidak terukur.
- **Alternatif yang cukup:** naikkan `CACHE_TTL` di `api-server.js` untuk endpoint berat.

**"Pastikan Virtual List digunakan" — SUDAH ADA**
- `VirtualizedTable.tsx` sudah diimplementasikan dan sudah menggunakan `@tanstack/react-virtual`.
- Rekomendasi ini menunjukkan analisis yang tidak membaca kode secara langsung.

**"React Query staleTime belum dikonfigurasi" — SUDAH DIKONFIGURASI**
- `queryClient.ts`: `staleTime: 30_000` global.
- `useCategories`: `staleTime: 300000`, `useSettings`: `staleTime: 300000`.
- Konfigurasi sudah lebih baik dari yang direkomendasikan.

---

## Bagian 2 — Bug & Isu yang Ditemukan

### BUG 1 (Kritis): Cache Key Collision di `useStockTrail`
**File:** `src/lib/queries.ts` baris ~193
```ts
// SALAH — queryKey konstan, tidak bergantung pada filters
export const useStockTrail = (filters: any) => {
    return useQuery({
        queryKey: reportKeys.all,  // ← ['reports'] — sama untuk semua filter!
        queryFn: () => (window as any).api.getStockTrailAll(filters),
    });
};
```
**Dampak:** Semua panggilan dengan filter tanggal berbeda saling overwrite di cache React Query. Data yang ditampilkan bisa stale atau salah filter.
**Fix:** Ganti `reportKeys.all` menjadi `stockTrailKeys.allList(filters)` yang sudah didefinisikan di file yang sama.

### BUG 2 (Sedang): VirtualizedTable — Anti-pattern Positioning
**File:** `src/components/VirtualizedTable.tsx` baris ~76
```tsx
// Masalah: TableRow absolute + flex di dalam <table> merusak semantik HTML
className="absolute w-full flex items-center border-b ..."
```
**Dampak:**
- `<tr>` dengan `position: absolute` tidak berperilaku sebagai row tabel — lebar kolom tidak sinkron dengan header.
- Kolom bisa tidak align dengan `<TableHeader>` karena flex dan tabel memiliki model layout berbeda.
- Screen reader dan aksesibilitas terganggu.
**Fix:** Gunakan `<div>` sebagai container virtualisasi, bukan `<Table>` semantik, atau gunakan pendekatan CSS Grid yang konsisten.

### ISU 3 (Perhatian): Memory Budget Conflict di Low-Spec Device
**Files:** `electron/main.js` + `electron/database.js`
- V8 heap limit: `--max-old-space-size=256` → max 256MB
- SQLite mmap: `mmap_size = 268435456` → 256MB
- Electron baseline: ~150–200MB
- **Total estimasi:** >650MB di kondisi berat

**Dampak:** Di perangkat dengan RAM 2GB (kasir tipe lama), bisa terjadi OOM atau swap pressure yang memperlambat seluruh sistem.
**Pertimbangan:** `mmap_size` bisa diturunkan ke 128MB, atau dibuat kondisional berdasarkan total RAM sistem.

### ISU 4 (Maintainability): `(window as any).api` Tanpa Type Safety
**File:** `src/lib/queries.ts` — semua baris API call
```ts
(window as any).api.getProducts(filters)  // TypeScript tidak bisa validasi method ini
```
**Dampak:** Typo pada nama method tidak terdeteksi saat compile time. Refactor IPC channel menjadi sulit.
**Fix:** Buat `interface WindowApi` di `src/lib/types.ts` dan extend `Window` dengan interface tersebut.

---

## Bagian 3 — Rencana Implementasi Per Fase

---

### FASE 1 — Bug Fix Kritis
**Estimasi scope:** 2 file, perubahan minimal, zero regression risk

#### Prompt untuk Coding Agent (Fase 1):

```
Kamu adalah coding agent untuk proyek pos-app (Electron + React + TypeScript).
Kerjakan HANYA perubahan berikut, tidak lebih.

## Konteks Proyek
- Framework: React 18 + TypeScript + @tanstack/react-query v5
- File target: src/lib/queries.ts, src/components/VirtualizedTable.tsx
- Jangan ubah logika bisnis apapun, hanya perbaiki bug yang disebutkan

## Tugas 1: Fix Cache Key Collision di useStockTrail

**File:** src/lib/queries.ts

Temukan fungsi `useStockTrail` (sekitar baris 193-198):
```ts
export const useStockTrail = (filters: any) => {
    return useQuery({
        queryKey: reportKeys.all,
        queryFn: () => (window as any).api.getStockTrailAll(filters),
    });
};
```

Ganti `queryKey: reportKeys.all` menjadi `queryKey: stockTrailKeys.allList(filters)`.

`stockTrailKeys.allList` sudah didefinisikan di file yang sama:
```ts
export const stockTrailKeys = {
    all: ['stockTrail'] as const,
    byProduct: (id: number, limit: number) => [...stockTrailKeys.all, 'product', id, limit] as const,
    allList: (filters: any) => [...stockTrailKeys.all, 'list', filters] as const,
};
```

Perubahan ini memastikan setiap kombinasi filter mendapatkan cache entry yang unik,
mencegah data stale atau salah filter yang ditampilkan ke pengguna.

## Tugas 2: Fix VirtualizedTable — Column Alignment

**File:** src/components/VirtualizedTable.tsx

Masalah saat ini: TableRow menggunakan `position: absolute` dan `display: flex`
di dalam `<Table>` semantik HTML. Ini menyebabkan kolom tidak sinkron dengan header.

Refactor komponen menggunakan pendekatan div-based virtualization:
- Hapus penggunaan `<Table>`, `<TableBody>`, `<TableRow>`, `<TableCell>` dari shadcn
- Gunakan div container untuk header dan rows
- Header tetap sticky dengan `position: sticky; top: 0`
- Setiap virtual row adalah `div` dengan `position: absolute` dan lebar 100%
- Definisikan lebar kolom secara eksplisit melalui prop `columns` (tambahkan field `width?: string`)
- Grid layout: gunakan CSS grid atau inline style flexbox yang konsisten antara header dan rows

Pertahankan semua props yang ada:
- `data`, `columns`, `rowHeight`, `maxHeight`, `onRowClick`, `className`, `tableClassName`

Tambahkan prop baru opsional: `emptyMessage?: string` untuk tampilkan pesan saat data kosong.

Pastikan dark mode tetap bekerja dengan class `dark:` yang sesuai.
```

---

### FASE 2 — Peningkatan Performa & Robustness
**Estimasi scope:** 3 file, perubahan sedang

#### Prompt untuk Coding Agent (Fase 2):

```
Kamu adalah coding agent untuk proyek pos-app (Electron + React + TypeScript).
Kerjakan perubahan berikut secara berurutan.

## Konteks Proyek
- Stack: Electron + better-sqlite3 (synchronous) + Express + React + TypeScript
- File target: electron/api-server.js, electron/database.js, electron/main.js
- Jangan ubah skema database, jangan ubah IPC channel names

## Tugas 1: Naikkan Cache TTL di api-server.js

**File:** electron/api-server.js

Masalah: `CACHE_TTL` saat ini hanya 5 detik untuk semua endpoint GET.
Ini terlalu agresif untuk data yang jarang berubah (produk, kategori, settings).

Ubah strategi caching menjadi tiered TTL:
```js
const CACHE_TTL_SHORT = 5_000;    // 5s — data real-time (harga saat ini)
const CACHE_TTL_MEDIUM = 30_000;  // 30s — data yang sering dibaca
const CACHE_TTL_LONG = 300_000;   // 5min — data statis (settings, kategori)
```

Terapkan TTL sesuai endpoint:
- `/api/products/search` dan `/api/products/:barcode` → `CACHE_TTL_SHORT`
- `/api/products` (list semua) → `CACHE_TTL_MEDIUM`
- `/api/settings`, `/api/categories` → `CACHE_TTL_LONG`

Ganti semua pemanggilan `setCache(key, data)` yang tidak memiliki TTL eksplisit
dengan TTL yang sesuai berdasarkan kategori di atas.

## Tugas 2: Conditional mmap_size Berdasarkan RAM

**File:** electron/database.js, electron/main.js

Di `database.js`, fungsi `applyPragmas()`, ubah `mmap_size` menjadi dinamis:

```js
function applyPragmas() {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000');
    db.pragma('temp_store = MEMORY');

    // Sesuaikan mmap dengan RAM tersedia
    const totalRamMB = Math.floor(require('os').totalmem() / 1024 / 1024);
    const mmapSize = totalRamMB >= 4096
        ? 268435456   // 256MB — RAM >= 4GB
        : 134217728;  // 128MB — RAM < 4GB (low-spec)
    db.pragma(`mmap_size = ${mmapSize}`);

    console.log(`[Database] RAM: ${totalRamMB}MB, mmap_size: ${mmapSize / 1024 / 1024}MB`);
}
```

Di `main.js`, ubah `--max-old-space-size` secara serupa:
```js
const totalRamMB = Math.floor(require('os').totalmem() / 1024 / 1024);
const v8HeapMB = totalRamMB >= 4096 ? 512 : 256;
app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${v8HeapMB}`);
```

## Tugas 3: Tambahkan Database Index yang Hilang

**File:** electron/database.js, fungsi `runMigrations()`

Cek apakah index berikut sudah ada. Jika belum, tambahkan sebagai migrasi baru:

```sql
-- Index untuk laporan profit per produk
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id
    ON transaction_items(product_id);

-- Index untuk filter payment_status (laporan hutang)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status
    ON transactions(payment_status);

-- Index untuk filter status + created_at (query laporan umum)
CREATE INDEX IF NOT EXISTS idx_transactions_status_created
    ON transactions(status, created_at);

-- Index untuk stock_trail per produk + waktu
CREATE INDEX IF NOT EXISTS idx_stock_trail_product_created
    ON stock_trail(product_id, created_at);
```

Tambahkan setiap index sebagai blok `if (!migrationApplied('add_performance_indexes'))`
mengikuti pola migrasi yang sudah ada di file.
Catat versi migrasi ini di tabel `migrations` jika ada, atau gunakan `get('SELECT ...')`
untuk cek keberadaan index sebelum membuatnya.
```

---

### FASE 3 — Type Safety & Maintainability
**Estimasi scope:** 3–4 file, perubahan besar tapi non-breaking

#### Prompt untuk Coding Agent (Fase 3):

```
Kamu adalah coding agent untuk proyek pos-app (Electron + React + TypeScript).
Kerjakan perubahan berikut untuk meningkatkan type safety.

## Konteks Proyek
- Stack: React + TypeScript + Electron contextBridge
- File target: src/lib/types.ts, src/lib/queries.ts
- Semua API call di queries.ts saat ini menggunakan `(window as any).api.method()`
- Tujuan: hilangkan semua cast `(window as any)` dengan interface yang proper

## Tugas: Buat WindowApi Interface

**File:** src/lib/types.ts

Tambahkan interface `WindowApi` yang mencakup semua method yang digunakan di `queries.ts`.
Contoh struktur:

```ts
export interface WindowApi {
    // Auth
    login(username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }>;
    verifyToken(token: string): Promise<{ success: boolean; data?: any }>;

    // Products
    getProducts(filters?: ProductFilters): Promise<{ success: boolean; data: Product[] }>;
    getProductById(id: number): Promise<{ success: boolean; data: Product }>;
    getProductByBarcode(barcode: string): Promise<{ success: boolean; data: Product | null }>;
    createProduct(data: Partial<Product>): Promise<{ success: boolean; data: Product }>;
    updateProduct(id: number, data: Partial<Product>): Promise<{ success: boolean }>;
    updateProductWithAudit(id: number, data: Partial<Product>, auditInfo: AuditInfo): Promise<{ success: boolean }>;
    deleteProduct(id: number): Promise<{ success: boolean }>;
    bulkDeleteProducts(ids: number[]): Promise<{ success: boolean }>;
    getLowStockProducts(threshold: number): Promise<{ success: boolean; data: Product[] }>;

    // Categories
    getCategories(): Promise<{ success: boolean; data: Category[] }>;
    createCategory(name: string): Promise<{ success: boolean; data: Category }>;
    deleteCategory(id: number): Promise<{ success: boolean }>;

    // Transactions
    getTransactions(filters: TransactionFilters): Promise<{ success: boolean; data: Transaction[]; total: number }>;
    getTransactionById(id: number): Promise<{ success: boolean; data: Transaction }>;
    createTransaction(data: TransactionInput): Promise<{ success: boolean; data: Transaction }>;
    voidTransaction(id: number): Promise<{ success: boolean }>;
    addPayment(txId: number, amount: number, method: string, userId: number, notes?: string): Promise<{ success: boolean }>;

    // Settings
    getSettings(): Promise<Record<string, string>>;
    updateSettings(data: Record<string, string>): Promise<{ success: boolean }>;

    // Reports
    getSalesReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getProfitReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getPeriodComparison(df1: string, dt1: string, df2: string, dt2: string): Promise<{ success: boolean; data: any }>;
    getComprehensiveReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getStockAuditSummary(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getStockTrailAll(filters: any): Promise<{ success: boolean; data: any[] }>;
    getStockTrail(filters: any): Promise<{ success: boolean; data: any[] }>;

    // Dashboard
    getEnhancedDashboardStats(): Promise<{ success: boolean; data: any }>;
    getSlowMovingProducts(days: number, limit: number): Promise<{ success: boolean; data: any[] }>;

    // Debts
    getOutstandingDebts(filters: any): Promise<{ success: boolean; data: any[] }>;
    getDebtSummary(): Promise<{ success: boolean; data: any }>;

    // Database management
    getDbStats(): Promise<any>;
    dbGetBackupHistory(): Promise<any>;
    dbGetArchivableCount(months: number): Promise<any>;
    dbVacuum(): Promise<{ success: boolean }>;
    dbClearVoided(): Promise<{ success: boolean }>;
    dbArchiveTransactions(months: number): Promise<{ success: boolean }>;
    dbResetSettings(): Promise<{ success: boolean }>;
    dbCreateBackup(): Promise<{ success: boolean }>;
    dbDeleteBackup(path: string): Promise<{ success: boolean }>;

    // Print & Export
    exportReportPdf(html: string): Promise<{ success: boolean; path?: string; error?: string }>;
    printPlainText(text: string, options: { action: 'save' | 'print'; printer?: string }): Promise<{ success: boolean; path?: string; error?: string }>;
}

// Extend Window interface
declare global {
    interface Window {
        api: WindowApi;
    }
}
```

Setelah menambahkan interface ini, update `queries.ts`:
- Ganti semua `(window as any).api.method()` menjadi `window.api.method()`
- TypeScript sekarang akan validasi nama method dan tipe argumen

Pastikan tidak ada breaking change — semua hook yang sudah ada tetap bekerja sama.
```

---

### FASE 4 — Refactoring Maintainability (Opsional, Prioritas Rendah)
**Estimasi scope:** File besar, dampak zero pada performa runtime

#### Prompt untuk Coding Agent (Fase 4):

```
Kamu adalah coding agent untuk proyek pos-app (Electron + React + TypeScript).
Tugas ini adalah refactoring maintainability — tidak ada perubahan logika bisnis.

## Konteks
- ReportsPage.tsx: ~1600 baris, 60KB — satu file untuk 4 tab laporan berbeda
- Tujuan: pecah menjadi sub-komponen tanpa mengubah fungsionalitas apapun

## Aturan Wajib
1. Semua UI text tetap Bahasa Indonesia
2. Semua props dan state yang ada tetap berfungsi sama
3. Semua dark mode classes tetap ada
4. Jangan ubah nama hook atau API call
5. Jangan tambahkan fitur baru
6. Jangan tambahkan komentar atau docstring ke kode yang tidak diubah

## Struktur Target

Buat folder: `src/components/reports/`

Pindahkan setiap tab ke komponen terpisah:
- `src/components/reports/SalesReportTab.tsx` — konten tab "Ringkasan Penjualan"
- `src/components/reports/ProfitReportTab.tsx` — konten tab "Laporan Laba"
- `src/components/reports/ComparisonReportTab.tsx` — konten tab "Perbandingan Periode"
- `src/components/reports/ComprehensiveReportTab.tsx` — konten tab "Laporan Lengkap"

`ReportsPage.tsx` setelah refactor hanya berisi:
- State management (dateFrom, dateTo, activeTab, dll)
- Semua useQuery hooks (tetap di sini, tidak dipindah)
- Tab container dan filter bar
- Pass data ke sub-komponen sebagai props

Interface props setiap sub-komponen harus eksplisit (no `any` untuk data laporan utama).

Setelah refactor, `ReportsPage.tsx` seharusnya < 200 baris.
```

---

## Bagian 4 — Checklist Verifikasi Per Fase

### Fase 1 — Verifikasi Bug Fix
- [ ] `useStockTrail` menggunakan `stockTrailKeys.allList(filters)` sebagai queryKey
- [ ] `VirtualizedTable` header dan data row align secara visual untuk semua jumlah kolom
- [ ] `VirtualizedTable` bekerja dengan dark mode
- [ ] Tidak ada TypeScript error baru

### Fase 2 — Verifikasi Performa
- [ ] Log startup menampilkan RAM dan mmap_size yang digunakan
- [ ] Endpoint `/api/settings` mengembalikan response dari cache dalam 5 menit window
- [ ] Index database dapat diverifikasi via: `PRAGMA index_list(transactions);`
- [ ] Tidak ada perubahan pada IPC channel names atau return format

### Fase 3 — Verifikasi Type Safety
- [ ] `npx tsc --noEmit` tidak menghasilkan error baru terkait `window.api`
- [ ] Tidak ada lagi `(window as any).api` di `queries.ts`
- [ ] Autocomplete TypeScript bekerja untuk `window.api.` di editor

### Fase 4 — Verifikasi Refactoring
- [ ] Semua tab laporan berfungsi sama seperti sebelumnya
- [ ] `ReportsPage.tsx` < 200 baris
- [ ] Tidak ada duplikasi state atau logic antar komponen
- [ ] Export PDF, print, dan save text masih bekerja

---

## Bagian 5 — Yang TIDAK Boleh Diubah

Daftar ini untuk mencegah over-engineering:

- **Jangan** pindahkan Express ke Worker Thread
- **Jangan** ubah `better-sqlite3` ke versi async
- **Jangan** ubah schema database tanpa migrasi
- **Jangan** ubah IPC channel names (breaking change di preload.js)
- **Jangan** hapus `apiCache` di `api-server.js` — masih dibutuhkan
- **Jangan** ubah Vite chunk configuration — sudah optimal
- **Jangan** tambahkan React.memo ke komponen yang tidak diukur perlu
- **Jangan** ganti `@tanstack/react-query` dengan solusi state lain

---

## Bagian 6 — Estimasi Resource & Waktu

Berikut adalah estimasi kebutuhan sumber daya dan waktu pengerjaan berdasarkan 4 fase di atas.

### Sumber Daya (Resources)
- **1 Senior/Mid Fullstack Developer** (Electron, React, TypeScript, SQL)
  - Harus memahami *state management* (React Query) dan CSS (Tailwind) dengan baik.
  - Memahami *lifecycle* Electron Main vs Renderer process.
- **1 QA / User Tester**
  - Penting untuk verifikasi visual pada **Fase 1** (Tabel) dan **Fase 4** (Laporan).

### Estimasi Waktu (Timeline)

Total estimasi waktu pengerjaan: **~3-4 Hari Kerja** (24-32 Jam Efektif).

| Fase | Task Utama | Kompleksitas | Estimasi | Keterangan |
|------|------------|--------------|----------|------------|
| **Fase 1** | **Bug Fix Kritis** | Medium | **4-6 Jam** | Refactor `VirtualizedTable` ke `div` memakan waktu paling lama karena *pixel-perfect styling*. Fix cache key cepat (<30m). |
| **Fase 2** | **Performa** | Low | **3-4 Jam** | Tuning TTL dan RAM check cukup straight-forward. Tambah index DB perlu tes migrasi. |
| **Fase 3** | **Type Safety** | Medium | **4-6 Jam** | Menulis interface `WindowApi` dan mengganti semua call-site (~50 occurrences) perlu ketelitian tinggi. |
| **Fase 4** | **Refactoring** | Medium | **6-8 Jam** | Memecah `ReportsPage` besar. Risiko regresi logika UI cukup tinggi, perlu testing manual menyeluruh. |

### Urutan Pengerjaan Disarankan
1. **Fase 1 (Wajib)**: Fix bug yang langsung berdampak ke user (data salah filter, tabel berantakan).
2. **Fase 2 (Quick Win)**: Peningkatan performa dengan effort minim.
3. **Fase 3 (Investment)**: Mencegah bug di masa depan, sangat berguna sebelum masuk ke Fase 4.
4. **Fase 4 (Opsional)**: Kerjakan hanya jika waktu memungkinkan atau kode `ReportsPage` perlu diubah lagi kedepannya.
