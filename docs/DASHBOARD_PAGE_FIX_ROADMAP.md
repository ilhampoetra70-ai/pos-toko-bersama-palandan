# Dashboard Page Fix Roadmap

Hasil audit mendalam halaman Dashboard. Terdapat **7 issues** (2 HIGH, 3 MEDIUM, 2 LOW).
Eksekusi secara berurutan: Fase 1 → Fase 2 → Fase 3 → Fase 4 (opsional).

---

## Fase 1 — [HIGH] Perbaiki SlowMoving Section yang Tidak Berfungsi

**Target file:**
- `electron/database.js`
- `src/lib/queries.ts`

**Issues yang diselesaikan:** H1, H2

---

### Prompt untuk Coding Agent:

```
Perbaiki dua bug terkait fitur "Produk Lambat Jual" di dashboard yang menyebabkan
section tersebut selalu menampilkan data kosong.

=== Bug H1: Hook queries.ts salah menangani response ===

File: src/lib/queries.ts
Cari fungsi `useSlowMovingProducts` (sekitar baris 229–237):

```ts
export const useSlowMovingProducts = (days: number, limit: number) =>
    useQuery({
        queryKey: dashboardKeys.slowMoving(days, limit),
        queryFn: async () => {
            const res = await dashboardApi.getSlowMoving(days, limit);
            return res.success ? (res.data || []) : [];
        },
        staleTime: 60000
    });
```

MASALAH: IPC `reports:slowMoving` mengembalikan array langsung (bukan `{ success, data }`),
sehingga `res.success` selalu `undefined` → hook selalu return `[]`.

PERBAIKAN: Ubah queryFn menjadi:
```ts
queryFn: async () => {
    const res = await dashboardApi.getSlowMoving(days, limit);
    if (Array.isArray(res)) return res;
    return res.success ? (res.data || []) : [];
},
```

=== Bug H2: SQL query getSlowMovingProducts missing fields ===

File: electron/database.js
Cari fungsi `getSlowMovingProducts` (sekitar baris 1801–1814).

Query saat ini mengembalikan kolom `last_sale`, tapi UI mengakses `last_sale_date`,
`days_inactive`, dan `p.unit` — ketiganya tidak ada di query.

PERBAIKAN: Ganti seluruh isi fungsi `getSlowMovingProducts` dengan:
```js
function getSlowMovingProducts(inactiveDays = 120, limit = 10) {
    return all(
        `SELECT p.id, p.name, p.stock, p.price, p.cost, p.unit,
                c.name as category_name, p.created_at,
                MAX(t.created_at) as last_sale_date,
                CAST(
                    julianday('now') - COALESCE(
                        julianday(MAX(t.created_at)),
                        julianday(p.created_at)
                    )
                AS INTEGER) as days_inactive
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN transaction_items ti ON p.id = ti.product_id
         LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.status = 'completed'
         WHERE p.stock > 0 AND p.active = 1
         GROUP BY p.id
         HAVING (last_sale_date IS NULL AND julianday('now') - julianday(p.created_at) > ?)
             OR (last_sale_date IS NOT NULL AND julianday('now') - julianday(MAX(t.created_at)) > ?)
         ORDER BY last_sale_date ASC, p.stock DESC LIMIT ?`,
        [inactiveDays, inactiveDays, limit]
    );
}
```

Perubahan:
1. Tambah `p.unit` ke SELECT
2. Ganti `MAX(t.created_at) as last_sale` → `MAX(t.created_at) as last_sale_date`
3. Tambah kolom computed `days_inactive` via CAST(julianday('now') - ...)
4. Sesuaikan HAVING clause untuk pakai alias baru `last_sale_date`

Setelah selesai, verifikasi bahwa tidak ada referensi `last_sale` lain
(selain `last_sale_date`) yang tersisa di fungsi ini.
```

---

## Fase 2 — [MEDIUM + LOW] Error Handling & Kolom Items

**Target file:**
- `src/pages/DashboardPage.tsx`

**Issues yang diselesaikan:** M1, L1

---

### Prompt untuk Coding Agent:

```
Perbaiki dua masalah di src/pages/DashboardPage.tsx.

=== Perbaikan M1: Tambah error state untuk useDashboardStats ===

Cari kode ini di DashboardPage (fungsi utama, sekitar baris 22–24):
```tsx
const { data: stats, isLoading } = useDashboardStats();

if (isLoading || !stats) return <LoadingState />;
```

MASALAH: Bila `getEnhancedDashboardStats` IPC gagal, `isLoading=false` dan `stats=undefined`,
sehingga `!stats` tetap true → spinner loading muncul selamanya tanpa pesan error.

PERBAIKAN:
1. Tambahkan destructure `isError` dan `refetch` dari hook:
```tsx
const { data: stats, isLoading, isError, refetch } = useDashboardStats();
```

2. Ubah kondisi loading menjadi:
```tsx
if (isLoading) return <LoadingState />;

if (isError || !stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
            <RetroAlert className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-1">
            <p className="font-bold text-foreground">Gagal memuat dashboard</p>
            <p className="text-sm text-muted-foreground">Terjadi kesalahan saat mengambil data statistik.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <Loader2 className="w-4 h-4" />
            Coba Lagi
        </Button>
    </div>
);
```

Pastikan `RetroAlert` dan `Loader2` sudah ada di import (keduanya sudah ada di file).

=== Perbaikan L1: Kolom Items di RecentTransactionsSection selalu 0 ===

Cari komponen `RecentTransactionsSection` dan temukan baris ini (sekitar baris 1034):
```tsx
<span className="text-[10px] font-black bg-muted dark:bg-card px-1.5 py-0.5 rounded-full">{tx.items?.length || 0}</span>
```

MASALAH: `tx.items` tidak ada dalam data dari `getTransactions()`. Yang ada adalah
`tx.item_count` (dihitung via subquery di database.js baris 1323).

PERBAIKAN: Ganti `tx.items?.length || 0` menjadi `tx.item_count || 0`:
```tsx
<span className="text-[10px] font-black bg-muted dark:bg-card px-1.5 py-0.5 rounded-full">{tx.item_count || 0}</span>
```
```

---

## Fase 3 — [MEDIUM + LOW] Bug Timezone & Typo Role

**Target file:**
- `electron/database.js`
- `src/pages/DashboardPage.tsx`

**Issues yang diselesaikan:** M3, L2

---

### Prompt untuk Coding Agent:

```
Perbaiki dua masalah kecil — satu bug latent di backend, satu typo di frontend.

=== Perbaikan M3: Bug format timezone offset di getDailySalesBreakdown ===

File: electron/database.js
Cari fungsi `getDailySalesBreakdown` (sekitar baris 1518).
Temukan bagian query SQL berikut:
```js
const dailyRows = all(`
    SELECT date(created_at, '+' || ? || ' hours') as local_date,
           COALESCE(SUM(total - tax_amount), 0) as total
    FROM transactions
    WHERE status = 'completed' AND created_at >= ? AND created_at < ?
    GROUP BY date(created_at, '+' || ? || ' hours')
    ORDER BY local_date
`, [offsetHrs, rangeStart, todayRangeEnd, offsetHrs]);
```

MASALAH: String `'+' || ? || ' hours'` selalu menambah tanda `+`, sehingga untuk
timezone offset negatif (mis. UTC-5) menghasilkan `'+-5 hours'` yang tidak valid di SQLite.

PERBAIKAN: Buat variabel offset string yang sudah diformat sebelum query, lalu gunakan
sebagai literal string (bukan parameter `?`), sama seperti yang sudah benar di `getDashboardStats`:

Ubah bagian tersebut menjadi:
```js
const offsetSign = offsetHrs >= 0 ? '+' : '';
const offsetStr = `${offsetSign}${offsetHrs} hours`;

const dailyRows = all(`
    SELECT date(created_at, ?) as local_date,
           COALESCE(SUM(total - tax_amount), 0) as total
    FROM transactions
    WHERE status = 'completed' AND created_at >= ? AND created_at < ?
    GROUP BY date(created_at, ?)
    ORDER BY local_date
`, [offsetStr, rangeStart, todayRangeEnd, offsetStr]);
```

=== Perbaikan L2: Typo role 'kasir' di QuickActionsSection ===

File: src/pages/DashboardPage.tsx
Cari komponen `QuickActionsSection` (sekitar baris 624).
Temukan array `actions` dan baris ini:
```tsx
{ label: 'Buka Kasir', icon: RetroCart, path: '/cashier', color: 'bg-primary-600', roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
```

MASALAH: `'kasir'` bukan nama role yang valid di sistem (role yang valid: `admin`, `supervisor`,
`cashier`). Ini adalah typo.

PERBAIKAN: Hapus `'kasir'` dari array roles:
```tsx
{ label: 'Buka Kasir', icon: RetroCart, path: '/cashier', color: 'bg-primary-600', roles: ['admin', 'supervisor', 'cashier'] },
```
```

---

## Fase 4 — [MEDIUM] Refactor AiInsightWidget ke React Query (Opsional)

**Target file:**
- `src/pages/DashboardPage.tsx`

**Issue yang diselesaikan:** M2

> **Catatan:** Fase ini bersifat opsional. Prioritaskan jika widget AI insight terasa
> sering stale atau tidak terupdate setelah navigasi.

---

### Prompt untuk Coding Agent:

```
Refactor komponen AiInsightWidget di src/pages/DashboardPage.tsx agar menggunakan
React Query alih-alih raw useEffect + window.api langsung.

=== Kondisi saat ini (sekitar baris 811–839) ===

```tsx
function AiInsightWidget({ navigate }: any) {
    const [insight, setInsight] = useState<...>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.api.getAiInsightCache().then((r: any) => {
            setLoading(false);
            if (r.success && r.data) {
                // ... normalisasi format
                if (d.narrative) { setInsight({ ...d, created_at: r.created_at }); }
            }
        }).catch(() => setLoading(false));
    }, []);
    // ...
}
```

MASALAH:
1. Tidak ada refetch saat window focus → data stale setelah navigasi
2. Error di .catch() diabaikan sepenuhnya — tidak ada error state
3. Tidak konsisten dengan pola React Query yang dipakai di seluruh halaman

PERBAIKAN: Ubah AiInsightWidget menjadi:
```tsx
function AiInsightWidget({ navigate }: any) {
    const { data: insight, isLoading } = useQuery({
        queryKey: ['ai', 'insight-cache'],
        queryFn: async () => {
            const r = await window.api.getAiInsightCache();
            if (!r.success || !r.data) return null;
            const d = { ...r.data } as any;
            // Normalize paragraphs[] → narrative
            if (!d.narrative && d.paragraphs?.length) {
                d.narrative = d.paragraphs.join('\n\n');
            }
            // Normalize old summary format → narrative
            if (!d.narrative && d.summary) {
                const parts = [d.summary];
                if (d.stock_recommendations?.length) parts.push(d.stock_recommendations.join('. '));
                if (d.slow_moving_recommendations?.length) parts.push(d.slow_moving_recommendations.join('. '));
                if (d.operational_recommendations?.length) parts.push(d.operational_recommendations.join('. '));
                d.narrative = parts.join('\n\n');
                d.highlights = d.top_priorities || [];
            }
            if (!d.narrative) return null;
            return { ...d, created_at: r.created_at } as { narrative: string; highlights: string[]; created_at?: string };
        },
        staleTime: 300000,     // 5 menit — insight tidak sering berubah
        refetchOnWindowFocus: true,
    });

    if (isLoading) return (
        <Card className="border-none shadow-sm overflow-hidden p-6 animate-pulse">
            <div className="h-4 bg-muted dark:bg-card rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
                <div className="h-3 bg-muted dark:bg-card/50 rounded w-full"></div>
                <div className="h-3 bg-muted dark:bg-card/50 rounded w-3/4"></div>
            </div>
        </Card>
    );

    if (!insight) return null;

    // Truncate narrative for preview
    const narrativeText = insight.narrative || '';
    const previewText = narrativeText.length > 300
        ? narrativeText.substring(0, 300).replace(/\s+\S*$/, '') + '...'
        : narrativeText;

    return (
        // ... JSX sama seperti sebelumnya, tidak perlu diubah
    );
}
```

Hapus import `useState` dan `useEffect` yang tidak lagi digunakan di `AiInsightWidget`
(cek apakah komponen lain di file masih memakainya — `CashierDashboard` masih memakai
`useState` dan `useEffect`, jadi tidak perlu hapus dari import utama).

Tambahkan `useQuery` ke import dari `@tanstack/react-query` jika belum ada,
atau gunakan dari `@/lib/queries` (import { useQuery } from '@tanstack/react-query').
```

---

## Ringkasan Eksekusi

| Fase | Issues | File yang Diubah | Prioritas |
|------|--------|-----------------|-----------|
| Fase 1 | H1, H2 | `database.js`, `queries.ts` | **Wajib** |
| Fase 2 | M1, L1 | `DashboardPage.tsx` | **Wajib** |
| Fase 3 | M3, L2 | `database.js`, `DashboardPage.tsx` | Disarankan |
| Fase 4 | M2 | `DashboardPage.tsx` | Opsional |
