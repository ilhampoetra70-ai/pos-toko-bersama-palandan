# Stock Pages Fix Roadmap

Hasil audit mendalam halaman Riwayat Stok (StockTrailPage) dan Stok Rendah (LowStockPage).
Terdapat **5 issues** (2 HIGH, 3 MEDIUM).
Eksekusi secara berurutan: Fase 1 → Fase 2 → Fase 3 → Fase 4 (opsional).

---

## Fase 1 — [HIGH] Perbaiki Bug Filter Event & Error State di StockTrailPage

**Target file:**
- `src/pages/StockTrailPage.tsx`

**Issues yang diselesaikan:** H1, H2

---

### Prompt untuk Coding Agent:

```
Perbaiki dua bug di src/pages/StockTrailPage.tsx.

=== Bug H1: Filter "Semua Event" selalu mengembalikan 0 hasil ===

MASALAH:
SelectItem untuk "Semua Produk", "Semua Event", dan "Semua User"
menggunakan value=" " (satu spasi). Di fungsi loadTrails():

```tsx
if (filters.event_type) activeFilters.event_type = filters.event_type;
```

Ketika user pilih "Semua Event", `filters.event_type = " "` (truthy), sehingga
string spasi diteruskan ke backend → SQL: `AND st.event_type = ' '` → 0 hasil.

(product_id dan user_id tidak terdampak karena keduanya di-parseInt sehingga
menghasilkan NaN yang falsy, tapi event_type TIDAK di-parseInt.)

PERBAIKAN LANGKAH DEMI LANGKAH:

1. Di bagian state awal (sekitar baris 45-52), cek initial value untuk ketiga filter sudah `''`.
   Jika sudah `''`, lanjut ke langkah 2.

2. Ubah ketiga SelectItem "Semua X" dari `value=" "` menjadi `value="all"`:
```tsx
<SelectItem value="all">Semua Produk</SelectItem>
// ...
<SelectItem value="all">Semua Event</SelectItem>
// ...
<SelectItem value="all">Semua User</SelectItem>
```

3. Ubah fungsi `loadTrails` (sekitar baris 89-116). Ganti bagian pembangunan
   `activeFilters` menjadi:
```tsx
if (filters.product_id && filters.product_id !== 'all') {
    activeFilters.product_id = parseInt(filters.product_id);
}
if (filters.event_type && filters.event_type !== 'all') {
    activeFilters.event_type = filters.event_type;
}
if (filters.user_id && filters.user_id !== 'all') {
    activeFilters.user_id = parseInt(filters.user_id);
}
```

4. Ubah fungsi `clearFilters` (sekitar baris 119-129): pastikan reset ke `''`
   (empty string) bukan ke `'all'`, agar saat reset, Select kembali menampilkan
   placeholder (bukan option "Semua"):
```tsx
const clearFilters = () => {
    setFilters({
        product_id: '',
        event_type: '',
        user_id: '',
        date_from: getTodayDate(),
        date_to: getTodayDate(),
        search: ''
    });
    setSearchTerm('');
};
```

=== Bug H2: Tidak ada error state di loadTrails ===

MASALAH:
Di fungsi `loadTrails` (sekitar baris 89-116), blok catch hanya melakukan
`console.error(...)`. Akibatnya jika IPC gagal:
- `loading` menjadi `false`
- `trails` tetap `[]`
- UI menampilkan "Tidak ada riwayat ditemukan" seolah data kosong
- Pengguna tidak tahu ada error dan tidak ada cara retry

PERBAIKAN:

1. Tambah state `error` setelah deklarasi state `loading` (sekitar baris 41):
```tsx
const [error, setError] = useState<string | null>(null);
```

2. Di dalam `loadTrails`, tambah `setError(null)` saat mulai load, dan
   set error di catch block:
```tsx
const loadTrails = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    setPage(pageNum);
    try {
        // ... (kode yang sudah ada)
        setTrails(data || []);
        setTotalCount(count || 0);
    } catch (err) {
        console.error('Failed to load trails:', err);
        setError('Gagal memuat riwayat stok. Coba refresh halaman.');
        setTrails([]);
        setTotalCount(0);
    } finally {
        setLoading(false);
    }
};
```

3. Di JSX, cari blok `{loading ? (...) : trails.length === 0 ? (...) : trails.map(...)}`
   dan tambahkan kondisi error SEBELUM kondisi empty:
```tsx
{loading ? (
    <TableRow>
        <TableCell colSpan={7} className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-muted-foreground">Menganalisis riwayat stok...</p>
        </TableCell>
    </TableRow>
) : error ? (
    <TableRow>
        <TableCell colSpan={7} className="text-center py-20">
            <RetroHistory className="w-16 h-16 mx-auto mb-4 opacity-20 text-red-500" />
            <p className="font-bold text-lg text-red-600 dark:text-red-400 mb-2">Gagal Memuat Data</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadTrails(page)} variant="outline" size="sm" className="gap-2">
                <RetroRefresh className="w-4 h-4" /> Coba Lagi
            </Button>
        </TableCell>
    </TableRow>
) : trails.length === 0 ? (
    <TableRow>
        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
            <RetroHistory className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold text-lg">Tidak ada riwayat ditemukan</p>
        </TableCell>
    </TableRow>
) : trails.map((trail) => {
    // ... (kode render row yang sudah ada)
})}
```

Pastikan import `Button` sudah ada (sudah ada di file).
```

---

## Fase 2 — [MEDIUM] Perbaiki Error State di LowStockPage

**Target file:**
- `src/pages/LowStockPage.tsx`

**Issues yang diselesaikan:** M3

---

### Prompt untuk Coding Agent:

```
Perbaiki satu masalah di src/pages/LowStockPage.tsx.

=== Perbaikan M3: Tambah error state untuk useLowStockProducts ===

MASALAH:
Baris 52:
```tsx
const { data: rawProducts = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useLowStockProducts(threshold);
```

`isError` tidak di-destructure. Jika query gagal:
- `rawProducts = []` (dari default value)
- Halaman menampilkan "Semua Stok Aman! Tidak ada produk di bawah ambang batas"
- Padahal yang terjadi adalah error, bukan stok aman

PERBAIKAN:

1. Tambah `isError: isErrorProducts` ke destructuring:
```tsx
const { data: rawProducts = [], isLoading: isLoadingProducts, isError: isErrorProducts, refetch: refetchProducts } = useLowStockProducts(threshold);
```

2. Cari blok kondisi yang menangani tampilan tabel (sekitar baris 289):
```tsx
{isLoadingProducts ? (
    // loading...
) : products.length === 0 ? (
    // "Semua Stok Aman!"
) : (
    // tabel produk
)}
```

Ubah menjadi:
```tsx
{isLoadingProducts ? (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RetroRefresh className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-muted-foreground font-bold">Memindai stok gudang...</p>
    </div>
) : isErrorProducts ? (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <RetroAlert className="w-16 h-16 text-red-400 opacity-60" />
        <div>
            <p className="text-xl font-black text-foreground">Gagal Memuat Data</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Terjadi kesalahan saat mengambil data stok rendah.</p>
        </div>
        <Button onClick={() => refetchProducts()} variant="outline" className="gap-2 font-bold">
            <RetroRefresh className="w-4 h-4" /> Coba Lagi
        </Button>
    </div>
) : products.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30">
        <Check className="w-20 h-20 text-green-500" />
        <div>
            <p className="text-2xl font-black text-foreground dark:text-foreground">Semua Stok Aman!</p>
            <p className="text-sm font-medium">Tidak ada produk di bawah ambang batas ≤ {threshold}</p>
        </div>
    </div>
) : (
    // ... (kode tabel yang sudah ada, tidak perlu diubah)
)}
```

Pastikan `RetroAlert` dan `Button` sudah ada di import (keduanya sudah ada di file).
```

---

## Fase 3 — [MEDIUM] Perbaiki Timezone Default Tanggal di StockTrailPage

**Target file:**
- `src/pages/StockTrailPage.tsx`

**Issues yang diselesaikan:** M1

---

### Prompt untuk Coding Agent:

```
Perbaiki satu bug timezone di src/pages/StockTrailPage.tsx.

=== Perbaikan M1: getTodayDate() menggunakan UTC bukan local timezone ===

MASALAH:
Baris 37:
```tsx
const getTodayDate = () => new Date().toISOString().split('T')[0];
```

`.toISOString()` selalu menghasilkan tanggal UTC. Di timezone UTC+7 (WIB):
- Jam 00:00–06:59 WIB = masih hari sebelumnya di UTC
- `getTodayDate()` mengembalikan tanggal "kemarin"
- Filter date_from dan date_to diisi dengan "kemarin", bukan hari ini

Backend `getLocalDayRangeUTC` sudah benar menggunakan POS-configured timezone,
tapi UI mengirim tanggal yang salah sebagai filter default.

PERBAIKAN:
Ganti fungsi `getTodayDate` dengan versi yang menggunakan device timezone:

```tsx
const getTodayDate = () => {
    const now = new Date();
    // Gunakan device timezone (lebih konsisten dengan yang user lihat di clock)
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
};
```

Ini menggunakan `getTimezoneOffset()` (device/OS timezone) untuk menghitung
tanggal lokal yang benar. Hasilnya konsisten dengan tanggal yang ditampilkan
di clock device user.

Tidak perlu perubahan lain — hanya fungsi `getTodayDate` di baris 37.
```

---

## Fase 4 — [MEDIUM] Migrasi loadInitialData ke React Query (Opsional)

**Target file:**
- `src/pages/StockTrailPage.tsx`
- `src/lib/queries.ts`

**Issue yang diselesaikan:** M2

> **Catatan:** Fase ini bersifat opsional. Prioritaskan jika halaman terasa
> sering reload produk/user (tidak ter-cache) atau jika ada error di dropdown
> yang tidak tertangani.

---

### Prompt untuk Coding Agent:

```
Migrasi loadInitialData di src/pages/StockTrailPage.tsx agar menggunakan React Query.

=== Kondisi saat ini ===

```tsx
const loadInitialData = async () => {
    try {
        const [prods, usrs] = await Promise.all([
            window.api.getProducts(),
            window.api.getUsers()
        ]);
        setProducts((prods as any)?.data || (Array.isArray(prods) ? prods : []));
        setUsers((usrs as any)?.data || (Array.isArray(usrs) ? usrs : []));
    } catch (err) {
        console.error('Failed to load initial data:', err);
    }
};

useEffect(() => {
    loadInitialData();
}, []);
```

MASALAH:
1. Tidak konsisten dengan pola React Query di halaman lain
2. Tidak ada cache — dropdown products dan users selalu di-fetch ulang saat navigasi
3. Tidak ada error handling untuk dropdown (jika gagal, dropdown kosong)

PERBAIKAN:

1. Di `src/lib/queries.ts`, tambahkan hook `useUsers` di bagian "Custom Hooks":
```ts
// Users
export const useUsers = () =>
    useQuery({
        queryKey: ['users', 'list'],
        queryFn: async () => {
            const res = await window.api.getUsers();
            if (Array.isArray(res)) return res;
            return res?.data || [];
        },
        staleTime: 300000, // 5 menit
    });
```

2. Di `src/pages/StockTrailPage.tsx`:

   a. Tambahkan import:
   ```tsx
   import { useProducts, useUsers } from '@/lib/queries';
   ```

   b. Hapus state `products`, `users`, dan fungsi `loadInitialData`:
   ```tsx
   // Hapus:
   const [products, setProducts] = useState<any[]>([]);
   const [users, setUsers] = useState<any[]>([]);
   // Hapus fungsi loadInitialData
   // Hapus useEffect(() => { loadInitialData(); }, []);
   ```

   c. Tambahkan hooks React Query:
   ```tsx
   const { data: productsData } = useProducts();
   const products = productsData?.data || [];

   const { data: users = [] } = useUsers();
   ```

   d. Import `useProducts` dan `useUsers` dari `@/lib/queries`.
   Pastikan tidak ada import yang duplikat.

Verifikasi setelah selesai: dropdown produk dan user masih berfungsi, dan
data tidak hilang saat navigate ke halaman lain dan kembali (karena ter-cache).
```

---

## Ringkasan Eksekusi

| Fase | Issues | File yang Diubah | Prioritas |
|------|--------|-----------------|-----------|
| Fase 1 | H1, H2 | `StockTrailPage.tsx` | **Wajib** |
| Fase 2 | M3 | `LowStockPage.tsx` | **Wajib** |
| Fase 3 | M1 | `StockTrailPage.tsx` | Disarankan |
| Fase 4 | M2 | `StockTrailPage.tsx`, `queries.ts` | Opsional |
