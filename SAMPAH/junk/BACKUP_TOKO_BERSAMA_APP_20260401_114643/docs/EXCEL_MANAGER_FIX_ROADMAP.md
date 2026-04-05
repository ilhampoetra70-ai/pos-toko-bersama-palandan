# Excel Manager Fix Roadmap

Hasil audit mendalam fitur Export/Import Excel di halaman Produk.
Terdapat **8 issues** (2 HIGH, 4 MEDIUM, 2 LOW).
Eksekusi secara berurutan: Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 (opsional).

---

## Fase 1 — [HIGH] Perbaiki Duplicate Detection di previewImport

**Target file:**
- `electron/database.js`

**Issues yang diselesaikan:** H2

---

### Prompt untuk Coding Agent:

```
Perbaiki satu bug di electron/database.js.

=== Bug H2: getProductByName case-sensitive — duplicate detection gagal ===

File: electron/database.js
Cari fungsi `getProductByName` (sekitar baris 647):

```js
function getProductByName(name) {
    return get('SELECT * FROM products WHERE name = ? AND active = 1', [name]);
}
```

MASALAH:
Semua produk di DB disimpan sebagai UPPERCASE (karena `createProduct` selalu
memanggil `name.toUpperCase()` sebelum INSERT). Tapi `getProductByName(name)`
menggunakan exact match, sehingga:
- Excel memiliki "Produk A" (mixed case)
- DB memiliki "PRODUK A"
- `getProductByName("Produk A")` → tidak menemukan → dianggap produk baru
- `createProduct` dipanggil → nama di-uppercase → "PRODUK A" masuk DB lagi
- Duplikat terbuat!

PERBAIKAN: Ubah query agar case-insensitive:
```js
function getProductByName(name) {
    return get('SELECT * FROM products WHERE UPPER(name) = UPPER(?) AND active = 1', [name]);
}
```

Tidak perlu perubahan lain — hanya satu baris SQL ini.
```

---

## Fase 2 — [HIGH] Invalidate Cache Setelah Import Berhasil

**Target file:**
- `src/components/ExcelManager.tsx`
- `src/pages/ProductsPage.tsx`

**Issues yang diselesaikan:** H1

---

### Prompt untuk Coding Agent:

```
Perbaiki satu bug di src/components/ExcelManager.tsx dan src/pages/ProductsPage.tsx.

=== Bug H1: Cache useProducts tidak diinvalidate setelah import ===

MASALAH:
Setelah import berhasil, modal ditutup via `onClose()` yang hanya memanggil
`setShowExcel(false)`. Tidak ada cache invalidation, sehingga tabel produk
tidak menampilkan produk baru sampai user navigasi keluar-masuk halaman.

PERBAIKAN:

=== Langkah 1: Tambah prop onSuccess ke ExcelManager ===

File: src/components/ExcelManager.tsx

1. Ubah interface props (sekitar baris 9-11):
```tsx
interface ExcelManagerProps {
    onClose: () => void;
    onSuccess?: () => void;
}
```

2. Tambah `onSuccess` ke parameter fungsi:
```tsx
export default function ExcelManager({ onClose, onSuccess }: ExcelManagerProps) {
```

3. Di dalam `handleConfirmImport`, setelah `setResult({ type: 'success', ... })`:
```tsx
if (res.success) {
    const msg = [];
    if (res.withBarcode > 0) msg.push(`${res.withBarcode} dengan barcode`);
    if (res.autoBarcode > 0) msg.push(`${res.autoBarcode} barcode baru`);
    setResult({
        type: 'success',
        message: `Berhasil import ${res.created} produk (${msg.join(', ')})`
    });
    setPreview(null);
    onSuccess?.(); // ← Tambahkan baris ini
}
```

=== Langkah 2: Invalidate cache di ProductsPage ===

File: src/pages/ProductsPage.tsx

1. Tambah import `useQueryClient` dari `@tanstack/react-query`:
```tsx
import { useQueryClient } from '@tanstack/react-query';
```
   (Periksa apakah sudah ada, jika belum tambahkan)

2. Tambah import `productKeys` dari `@/lib/queries`:
```tsx
import { ..., productKeys } from '@/lib/queries';
```
   (Tambahkan `productKeys` ke import yang sudah ada dari `@/lib/queries`)

3. Di dalam komponen `ProductsPage` (dekat deklarasi hooks lainnya, sekitar baris 109):
```tsx
const queryClient = useQueryClient();
```

4. Cari baris tempat ExcelManager di-render (sekitar baris 885):
```tsx
{showExcel && <ExcelManager onClose={() => setShowExcel(false)} />}
```

Ubah menjadi:
```tsx
{showExcel && (
    <ExcelManager
        onClose={() => setShowExcel(false)}
        onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        }}
    />
)}
```

Setelah perubahan ini, saat import selesai, tabel produk akan otomatis
diperbarui tanpa perlu navigasi ulang.
```

---

## Fase 3 — [MEDIUM] Perbaiki Pelaporan Error & Stock Trail di confirmImport

**Target file:**
- `electron/main.js`

**Issues yang diselesaikan:** M3, M4

---

### Prompt untuk Coding Agent:

```
Perbaiki dua masalah di ipcMain.handle('excel:confirmImport') di electron/main.js
(sekitar baris 983–1058).

=== Perbaikan M3: Produk yang gagal diimport tidak dilaporkan ke user ===

MASALAH:
Kode saat ini:
```js
let created = 0;
allProducts.forEach(product => {
    try {
        database.createProduct(product);
        created++;
    } catch (err) {
        console.error('[excel:confirmImport] Failed to create product:', product.name, err.message);
    }
});

return {
    success: true,
    created,
    withBarcode: newProducts.length,
    autoBarcode: needBarcode.length
};
```

Error hanya di-log ke console. Response tidak menyertakan informasi tentang
produk yang gagal, sehingga user tidak tahu ada yang tidak berhasil diimport.

PERBAIKAN: Ubah blok forEach dan return menjadi:
```js
let created = 0;
const failedProducts = [];

allProducts.forEach(product => {
    try {
        database.createProduct(product);
        created++;
    } catch (err) {
        console.error('[excel:confirmImport] Failed to create product:', product.name, err.message);
        failedProducts.push({ name: product.name, reason: err.message });
    }
});

return {
    success: true,
    created,
    failed: failedProducts.length,
    failedProducts,
    withBarcode: newProducts.length,
    autoBarcode: needBarcode.length
};
```

=== Perbaikan M4: Stock trail import tidak memiliki user attribution ===

MASALAH:
`database.createProduct(product)` dipanggil tanpa `userId`/`userName`,
sehingga stock trail untuk produk yang diimport memiliki `user_name = null`
(tampil sebagai "?" di halaman Riwayat Stok).

Padahal `bulkUpsertProducts` (path legacy) sudah benar set `user_name: 'Import Excel'`.

PERBAIKAN:
Tambahkan `userId: null, userName: 'Import Excel'` ke setiap objek produk
SEBELUM loop forEach. Temukan dua bagian di `allProducts.push(...)`:

Bagian pertama (newProducts — produk dengan barcode), ubah dari:
```js
allProducts.push({
    barcode: p.barcode,
    name: p.name,
    category_id: catId,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit
});
```
menjadi:
```js
allProducts.push({
    barcode: p.barcode,
    name: p.name,
    category_id: catId,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit,
    userId: null,
    userName: 'Import Excel'
});
```

Bagian kedua (needBarcode — produk dengan auto barcode), ubah dari:
```js
allProducts.push({
    barcode: barcodes[i],
    name: p.name,
    category_id: catId,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit
});
```
menjadi:
```js
allProducts.push({
    barcode: barcodes[i],
    name: p.name,
    category_id: catId,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit,
    userId: null,
    userName: 'Import Excel'
});
```

Catatan: `database.createProduct` sudah mendukung field `userId` dan `userName`
(baris sekitar 713-714: `user_id: product.userId || product.user_id || null`).
```

---

## Fase 4 — [MEDIUM + LOW] Perbaiki Teks UI yang Salah & Menyesatkan

**Target file:**
- `src/components/ExcelManager.tsx`
- `electron/main.js`

**Issues yang diselesaikan:** M1, M2, L1

---

### Prompt untuk Coding Agent:

```
Perbaiki tiga masalah teks/informasi yang salah di dua file.

=== Perbaikan L1: Typo judul modal "Eksper" → "Ekspor" ===

File: src/components/ExcelManager.tsx
Cari baris ini (sekitar baris 102):
```tsx
<h3 className="font-black text-xl text-foreground dark:text-foreground uppercase tracking-tight">Eksper / Impor Excel</h3>
```

Ubah menjadi:
```tsx
<h3 className="font-black text-xl text-foreground dark:text-foreground uppercase tracking-tight">Ekspor / Impor Excel</h3>
```

=== Perbaikan M2: Info "Barcode wajib diisi" → penjelasan yang akurat ===

File: src/components/ExcelManager.tsx
Cari bagian info box (sekitar baris 234–247). Temukan baris:
```tsx
<span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Kolom "Barcode" wajib diisi</span>
```

Ubah menjadi:
```tsx
<span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Kosongkan "Barcode" untuk generate otomatis</span>
```

Dan temukan baris tentang barcode ganda (sekitar baris 241):
```tsx
<span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Baris dengan barcode ganda akan dilewati</span>
```

Ubah menjadi:
```tsx
<span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Produk yang sudah ada (barcode/nama sama) akan dilewati, tidak diupdate</span>
```

=== Perbaikan M1: Instruksi template salah — "akan di-update" → "akan dilewati" ===

File: electron/main.js
Cari array `instrData` di dalam handler `excel:exportTemplate` (sekitar baris 1143).
Temukan baris ini:
```js
{ Petunjuk: '- Produk dengan Barcode yang sudah ada akan otomatis di-update.' },
```

Ubah menjadi:
```js
{ Petunjuk: '- Produk dengan Barcode/Nama yang sudah ada akan dilewati (tidak ditimpa).' },
```

Tidak ada perubahan lain yang diperlukan di tiga perbaikan ini.

=== Update pesan sukses di ExcelManager untuk tampilkan jika ada yang gagal ===

Setelah Fase 3 dieksekusi, response `confirmImport` sudah mengandung `failed`
dan `failedProducts`. Sekarang tampilkan info tersebut di UI.

File: src/components/ExcelManager.tsx
Cari fungsi `handleConfirmImport` (sekitar baris 59). Temukan blok berikut:
```tsx
if (res.success) {
    const msg = [];
    if (res.withBarcode > 0) msg.push(`${res.withBarcode} dengan barcode`);
    if (res.autoBarcode > 0) msg.push(`${res.autoBarcode} barcode baru`);
    setResult({
        type: 'success',
        message: `Berhasil import ${res.created} produk (${msg.join(', ')})`
    });
    setPreview(null);
    onSuccess?.();
}
```

Ubah menjadi:
```tsx
if (res.success) {
    const msg = [];
    if (res.withBarcode > 0) msg.push(`${res.withBarcode} dengan barcode`);
    if (res.autoBarcode > 0) msg.push(`${res.autoBarcode} barcode baru`);
    const failedNote = res.failed > 0 ? `. ${res.failed} produk gagal (cek console)` : '';
    setResult({
        type: res.failed > 0 ? 'error' : 'success',
        message: `Berhasil import ${res.created} produk (${msg.join(', ')})${failedNote}`
    });
    setPreview(null);
    onSuccess?.();
}
```
```

---

## Fase 5 — [LOW] Sertakan margin_mode di Export (Opsional)

**Target file:**
- `electron/main.js`

**Issue yang diselesaikan:** L2

> **Catatan:** Fase ini opsional. Prioritaskan jika ada kebutuhan roundtrip
> export→import tanpa kehilangan data `margin_mode`.

---

### Prompt untuk Coding Agent:

```
Perbaiki satu hal di ipcMain.handle('excel:exportProducts') di electron/main.js
(sekitar baris 801).

=== Perbaikan L2: Tambahkan kolom margin_mode ke export ===

MASALAH:
Export saat ini tidak menyertakan kolom `margin_mode`. Jika file hasil export
di-reimport, semua produk default ke `margin_mode: 'manual'` meski aslinya
bisa `'auto'`.

PERBAIKAN:
Cari blok `data = products.map(p => ({...}))` (sekitar baris 809):
```js
const data = products.map(p => ({
    Barcode: p.barcode || '',
    Nama: p.name,
    Kategori: catMap[p.category_id] || '',
    Harga: p.price,
    'Harga Modal': p.cost,
    Stok: p.stock,
    Satuan: p.unit
}));
```

Ubah menjadi:
```js
const data = products.map(p => ({
    Barcode: p.barcode || '',
    Nama: p.name,
    Kategori: catMap[p.category_id] || '',
    Harga: p.price,
    'Harga Modal': p.cost,
    Stok: p.stock,
    Satuan: p.unit,
    'Margin Mode': p.margin_mode || 'manual'
}));
```

Sesuaikan juga lebar kolom `ws['!cols']` di bawahnya:
```js
ws['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }
];
```
(Tambahkan satu entry `{ wch: 12 }` di akhir untuk kolom Margin Mode.)

Perlu juga update `exportTemplate` agar contoh data menyertakan kolom ini,
dan `previewImport` agar membaca kolom ini. Namun untuk scope minimal,
cukup tambahkan ke export saja — import bisa dibiarkan default.
```

---

## Ringkasan Eksekusi

| Fase | Issues | File yang Diubah | Prioritas |
|------|--------|-----------------|-----------|
| Fase 1 | H2 | `database.js` | **Wajib** |
| Fase 2 | H1 | `ExcelManager.tsx`, `ProductsPage.tsx` | **Wajib** |
| Fase 3 | M3, M4 | `main.js` | **Wajib** |
| Fase 4 | M1, M2, L1 | `ExcelManager.tsx`, `main.js` | Disarankan |
| Fase 5 | L2 | `main.js` | Opsional |
