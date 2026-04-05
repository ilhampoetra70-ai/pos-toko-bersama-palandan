# Roadmap Perbaikan: Halaman Kasir (pos-app)
> Dibuat: 2026-03-02 | Scope: Critical + High Priority Issues

---

## Ringkasan Issue

| # | Fase | Kategori | File | Baris |
|---|------|----------|------|-------|
| 1 | Fase 1 | 🔴 Critical Bug | `src/pages/CashierPage.tsx` | 539, 557 |
| 2 | Fase 1 | 🔴 Critical Bug | `src/components/PaymentModal.tsx` | 107–111, 400 |
| 3 | Fase 2 | 🔴 Critical Bug | `electron/database.js` | 1147 |
| 4 | Fase 3 | 🟠 High | `electron/printer.js` | 145–189 |
| 5 | Fase 3 | 🟠 High | `src/pages/CashierPage.tsx` | 59–64, 371 |
| 6 | Fase 4 | 🟠 High | `src/pages/CashierPage.tsx` | 269–336, 555–568 |
| 7 | Fase 4 | 🟠 High | `src/components/PaymentModal.tsx` | 400–408 |

---

## Fase 1 — Double Submit Guard + Negative Discount Fix

### Masalah A — Double Submit (Race Condition)

**File**: `src/pages/CashierPage.tsx:557` dan `src/components/PaymentModal.tsx:107–111, 400`

Tombol "BAYAR SEKARANG" di CashierPage hanya guard `cart.length === 0 || total <= 0`.
Tombol submit di PaymentModal hanya guard `!canSubmit()`.
Tidak ada satu pun yang memblokir saat `createTxMutation.isPending === true`.

Kode saat ini (CashierPage.tsx:557):
```tsx
disabled={cart.length === 0 || total <= 0}
```

Kode saat ini (PaymentModal.tsx:400):
```tsx
<Button type="submit" form="payment-form" disabled={!canSubmit()}>
```

`canSubmit()` di PaymentModal.tsx:107–111:
```tsx
const canSubmit = () => {
    if (customerInfoMissing) return false;
    if (dueDateMissing) return false;
    if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return false;
    return true;  // ← tidak ada isPending check
};
```

Jika kasir klik "Bayar" dua kali dalam 300ms → `createTxMutation.mutate(txData)` terpanggil
dua kali → dua transaksi identik → stok didekremen dua kali → inventory corruption.

---

### Masalah B — Negative Discount Inflates Total

**File**: `src/pages/CashierPage.tsx:539`

```tsx
onChange={e => setDiscount(parseInt(e.target.value) || 0)}
```

Bug JavaScript: `parseInt("-50000") || 0` = **-50000** bukan 0.
Karena -50000 truthy, operator `||` tidak fallback ke 0.
Hasil: `total = subtotal + taxAmount - (-50000)` = total membengkak Rp50.000.
Customer overpay. HTML `min="0"` tidak mencegah ketik langsung atau paste.

---

### Prompt untuk Coding Agent

```
Task: Perbaiki dua bug di halaman kasir — double submit guard dan negative discount.
Menyentuh DUA file: CashierPage.tsx dan PaymentModal.tsx.
Baca kedua file terlebih dahulu sebelum mengedit.

---

## FILE 1: src/pages/CashierPage.tsx

### Fix A — Tombol "BAYAR SEKARANG" harus disabled saat isPending

Cari baris ini (sekitar baris 555–568):
    <button
      onClick={() => setShowPayment(true)}
      disabled={cart.length === 0 || total <= 0}
      className={cn(
        ...
        cart.length === 0 || total <= 0
          ? "bg-muted dark:bg-card ..."
          : "bg-primary-600 ..."
      )}
    >

`createTxMutation` sudah ada di komponen (baris 67). Ubah KETIGA kondisi yang merujuk
`cart.length === 0 || total <= 0` menjadi:
    cart.length === 0 || total <= 0 || createTxMutation.isPending

Perlu diubah di:
1. Atribut `disabled={...}` (1 tempat)
2. Kondisi className pertama, di cn() (1 tempat)

Juga, kode keyboard shortcut Space (sekitar baris 195–198):
    if (e.key === ' ' && document.activeElement === document.body) {
        e.preventDefault();
        if (cart.length > 0 && total > 0) setShowPayment(true);
    }
Tambahkan guard isPending:
    if (cart.length > 0 && total > 0 && !createTxMutation.isPending) setShowPayment(true);

### Fix B — Negative discount

Cari baris ini (sekitar baris 539):
    onChange={e => setDiscount(parseInt(e.target.value) || 0)}

Ubah menjadi:
    onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}

Penjelasan: parseInt("-50000") || 0 = -50000 karena -50000 truthy di JS.
Math.max(0, ...) memastikan nilai minimum adalah 0.

---

## FILE 2: src/components/PaymentModal.tsx

### Fix C — Tombol submit PaymentModal harus disabled saat isPending

PaymentModal menerima prop `onConfirm` dari CashierPage. Masalahnya PaymentModal
tidak tahu apakah mutasi sedang berjalan.

Tambahkan prop `isSubmitting` ke interface PaymentModalProps (sekitar baris 26–32):
    interface PaymentModalProps {
        total: number;
        onConfirm: (data: any) => void;
        onClose: () => void;
        customerName?: string;
        customerAddress?: string;
        isSubmitting?: boolean;  // ← tambah ini
    }

Ubah function signature (baris 34):
    export default function PaymentModal({ total, onConfirm, onClose, customerName, customerAddress, isSubmitting = false }: PaymentModalProps)

Update fungsi canSubmit() (baris 107–112):
    const canSubmit = () => {
        if (isSubmitting) return false;  // ← tambah baris ini sebagai cek pertama
        if (customerInfoMissing) return false;
        if (dueDateMissing) return false;
        if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return false;
        return true;
    };

Kemudian di CashierPage.tsx, cari penggunaan PaymentModal (sekitar baris 585–593):
    <PaymentModal
      total={total}
      onConfirm={handlePayment}
      onClose={() => setShowPayment(false)}
      customerName={customerName}
      customerAddress={customerAddress}
    />

Tambahkan prop isSubmitting:
    <PaymentModal
      total={total}
      onConfirm={handlePayment}
      onClose={() => setShowPayment(false)}
      customerName={customerName}
      customerAddress={customerAddress}
      isSubmitting={createTxMutation.isPending}
    />

---

## Verifikasi
1. Buka halaman kasir, tambah produk ke cart
2. Klik "Bayar Sekarang" → PaymentModal terbuka
3. Isi jumlah bayar → klik "Bayar Sekarang" di modal
4. Saat proses simpan: tombol harus disabled (tidak bisa diklik lagi)
5. Test ketik "-50000" di kolom Diskon Global → nilai harus clamp ke 0 (tidak bisa negatif)

Tidak perlu rebuild portable untuk test dev. Cukup npm run dev.
```

---

## Fase 2 — Stock Floor Check: Cegah Stok Negatif

### Masalah

**File**: `electron/database.js:1147`

```js
function decrementProductStock(productId, quantity, userId, userName, invoiceNumber, txId) {
    // Atomic decrement — prevents race condition if two sales hit simultaneously
    run("UPDATE products SET stock = stock - ?, ... WHERE id = ?", [quantity, productId]);
    // ← Tidak ada WHERE stock >= quantity
```

Jika dua terminal kasir checkout item yang sama secara bersamaan saat stok = 1:
- Terminal A membaca stok = 1, tambah ke cart ✓
- Terminal B membaca stok = 1, tambah ke cart ✓
- Terminal A bayar → stok jadi 0
- Terminal B bayar → stok jadi **-1**

Tidak ada validasi, tidak ada error, tidak ada rollback. Stok negatif tersimpan di DB.

`createTransaction` sudah pakai `db.transaction()` (SQLite transaction), tapi itu hanya
menjamin atomicity INSERT — tidak mencegah stok minus karena UPDATE tidak ada WHERE guard.

### Prompt untuk Coding Agent

```
Task: Tambah stock floor validation di fungsi decrementProductStock
di file electron/database.js

Baca file ini terlebih dahulu sebelum mengedit. Ubah HANYA fungsi decrementProductStock.

---

## Lokasi

File: D:\Ilham\Documents\Proyek\pos-app\electron\database.js
Fungsi: decrementProductStock (sekitar baris 1145)

## Kode saat ini (baris 1145–1178):

    function decrementProductStock(productId, quantity, userId, userName, invoiceNumber, txId) {
        // Atomic decrement — prevents race condition if two sales hit simultaneously
        run("UPDATE products SET stock = stock - ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [quantity, productId]);
        // Re-read after update to get accurate new stock for trail logging
        const currentProduct = get("SELECT stock, name FROM products WHERE id = ?", [productId]);
        ...
    }

## Yang harus diubah

Ganti baris UPDATE dengan versi yang punya WHERE guard:

    run("UPDATE products SET stock = stock - ?, updated_at = datetime('now', 'localtime') WHERE id = ? AND stock >= ?", [quantity, productId, quantity]);

Kemudian, TEPAT SETELAH baris run() itu, tambahkan pengecekan apakah UPDATE berhasil
menggunakan `db.prepare().run()` — atau lebih mudah: cek stok setelah update.

Cara yang paling clean di SQLite better-sqlite3: gunakan `changes` dari hasil run().

Ubah menjadi:

    const updateResult = run(
        "UPDATE products SET stock = stock - ?, updated_at = datetime('now', 'localtime') WHERE id = ? AND stock >= ?",
        [quantity, productId, quantity]
    );
    if (updateResult.changes === 0) {
        // Stock tidak cukup — ambil stok aktual untuk pesan error yang informatif
        const current = get("SELECT stock, name FROM products WHERE id = ?", [productId]);
        const stockNow = current ? current.stock : 0;
        const productName = current ? current.name : `ID ${productId}`;
        throw new Error(`Stok tidak mencukupi untuk produk "${productName}". Stok saat ini: ${stockNow}, dibutuhkan: ${quantity}`);
    }

Fungsi run() di database.js sudah return { lastInsertRowid, changes } (lihat bagian atas file).
Jadi `updateResult.changes` valid.

## Penting
- Jangan ubah apapun selain baris run() dan tambahan cek di bawahnya
- Jangan ubah kode trail/audit di bawah yang sudah ada
- Error yang di-throw akan di-catch oleh `db.transaction()` wrapper di createTransaction
  dan akan otomatis rollback seluruh transaksi (SQLite behavior) — ini yang kita inginkan
- Tidak perlu try-catch tambahan di fungsi ini

## Verifikasi logika
Setelah fix, flow menjadi:
1. UPDATE dengan WHERE stock >= quantity
2. Jika changes = 0 → stok tidak cukup → throw Error
3. Error di-catch oleh db.transaction() di createTransaction → rollback otomatis
4. IPC handler di main.js catch error → return error ke frontend
5. Frontend onError handler menampilkan errorDialog ke kasir

Tidak perlu rebuild, hanya edit database.js.
```

---

## Fase 3 — Printer Timeout + Search Debounce

### Masalah A — Printer Timeout

**File**: `electron/printer.js:145–189`

```js
async function printReceipt(transaction, settings) {
  return new Promise((resolve, reject) => {
    // ...
    printWindow.webContents.print(options, (success, failureReason) => {
      // ← Callback ini bisa tidak pernah dipanggil jika printer hang
      printWindow.destroy();
      ...
    });
  });
}
```

Jika printer offline atau driver crash, callback `print()` tidak pernah dipanggil.
Promise tidak pernah resolve/reject. `doPrint()` di CashierPage.tsx menunggu selamanya.
`setPrinting(false)` tidak terpanggil → spinner kasir putar selamanya → UI frozen.

### Masalah B — Search Tanpa Debounce

**File**: `src/pages/CashierPage.tsx:59–64`

```tsx
const { data: productsData = [] } = useProducts({
  search: search || undefined,   // reactive, tidak di-debounce
  ...
});

onChange={e => setSearch(e.target.value)}  // trigger per karakter
```

Ketik "Mie Instan" = 10 IPC call ke SQLite berurutan, 10 cache entry React Query berbeda,
10 re-render komponen. Pada device low-spec atau query lambat (1000+ produk), lag terasa.

### Prompt untuk Coding Agent

```
Task: Tambah printer timeout di printer.js dan search debounce di CashierPage.tsx.
Menyentuh DUA file. Baca keduanya terlebih dahulu.

---

## FILE 1: electron/printer.js

### Fix — Tambah 15 detik timeout pada printReceipt

Baca fungsi printReceipt (sekitar baris 145–190).
Fungsinya return new Promise(...) yang bisa hang selamanya jika printer tidak respond.

Tambahkan timeout Promise.race di dalam fungsi printReceipt.
Ganti return statement-nya:

SEBELUM (baris 145–189):
    async function printReceipt(transaction, settings) {
        return new Promise((resolve, reject) => {
            const html = generateReceiptHTML(transaction, settings);
            const printWindow = new BrowserWindow({...});

            printWindow.webContents.on('did-fail-load', (...) => {
                printWindow.destroy();
                reject(new Error(...));
            });

            printWindow.loadURL(...);

            printWindow.webContents.on('did-finish-load', () => {
                ...
                printWindow.webContents.print(options, (success, failureReason) => {
                    printWindow.destroy();
                    if (success) { resolve({ success: true }); }
                    else { reject(new Error(failureReason || 'Print failed')); }
                });
            });
        });
    }

SESUDAH — bungkus Promise dengan Promise.race timeout 15 detik:

    const PRINT_TIMEOUT_MS = 15000;

    async function printReceipt(transaction, settings) {
        const printPromise = new Promise((resolve, reject) => {
            const html = generateReceiptHTML(transaction, settings);
            const printWindow = new BrowserWindow({
                show: false,
                width: 300,
                height: 600,
                webPreferences: { nodeIntegration: false }
            });

            printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                printWindow.destroy();
                reject(new Error(`Failed to load receipt for printing: ${errorDescription} (${errorCode})`));
            });

            printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

            printWindow.webContents.on('did-finish-load', () => {
                const printerName = settings.printer_name || '';
                const options = {
                    silent: true,
                    printBackground: true,
                    margins: { marginType: 'none' }
                };

                if (printerName) {
                    options.deviceName = printerName;
                }

                printWindow.webContents.print(options, (success, failureReason) => {
                    printWindow.destroy();
                    if (success) {
                        resolve({ success: true });
                    } else {
                        reject(new Error(failureReason || 'Print failed'));
                    }
                });
            });
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Print timeout: printer tidak merespons setelah 15 detik')), PRINT_TIMEOUT_MS)
        );

        return Promise.race([printPromise, timeoutPromise]);
    }

Catatan: Konstanta PRINT_TIMEOUT_MS dideklarasikan di luar fungsi, sebelum fungsi printReceipt.
Jika sudah ada konstanta lain di file, letakkan bersama konstanta yang ada di bagian atas file.

---

## FILE 2: src/pages/CashierPage.tsx

### Fix — Debounce search 400ms menggunakan useRef

File ini sudah import { useState, useEffect, useRef, useCallback, useMemo } dari 'react' (baris 1).
useRef sudah tersedia — tidak perlu import tambahan.

Langkah 1: Tambahkan state `debouncedSearch` dan ref timer.
Cari state declarations di awal komponen (sekitar baris 54–57):
    const [search, setSearch] = useState('');

Tambahkan TEPAT SETELAH baris itu:
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

Langkah 2: Update useProducts untuk pakai debouncedSearch bukan search (baris 59–64):
    const { data: productsData = [], isLoading: isLoadingProducts } = useProducts({
        search: debouncedSearch || undefined,   // ← ganti search → debouncedSearch
        category_id: filterCat || undefined,
        active: 1,
        limit: 80
    });

Langkah 3: Cari input search (sekitar baris 371, atau cari onChange={e => setSearch}):
    onChange={e => setSearch(e.target.value)}

Ubah menjadi:
    onChange={e => {
        const val = e.target.value;
        setSearch(val);  // update tampilan input langsung (tidak delay)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setDebouncedSearch(val);  // trigger query setelah 400ms
        }, 400);
    }}

Catatan penting:
- `search` state tetap dipakai untuk value input (tampilan langsung)
- `debouncedSearch` yang dikirim ke useProducts (trigger query)
- Pastikan `value={search}` di input element tetap menggunakan `search`, bukan `debouncedSearch`

---

## Verifikasi
1. Printer timeout: Matikan printer, coba print → harus muncul error "Print timeout" setelah 15 detik,
   bukan spinner selamanya
2. Search debounce: Buka kasir, ketik cepat di kolom cari → request ke DB terjadi hanya
   setelah ketikan berhenti 400ms, bukan setiap karakter

Tidak perlu rebuild, cukup npm run dev untuk test.
```

---

## Fase 4 — Loading Overlay + Deleted Product Validation

### Masalah A — Tidak Ada Loading State Saat Transaksi Disimpan

**File**: `src/pages/CashierPage.tsx:298`, `src/components/PaymentModal.tsx:400`

Selama `createTxMutation.mutate()` berjalan (biasanya 100–500ms), tidak ada visual lock
di PaymentModal. User yang tidak sabar bisa klik tombol "Batal" untuk tutup modal, atau
terus mencoba interaksi lain. Kombinasi dengan fix Fase 1 (isPending guard), idealnya
ada juga spinner visual di tombol submit.

### Masalah B — Produk Dihapus Saat Masih Di Cart

**File**: `src/pages/CashierPage.tsx:269–278`

```tsx
const handlePayment = async (paymentData: any) => {
    const items = cart.map(item => ({
        product_id: item.product_id,   // ← mungkin sudah soft-deleted
        product_name: item.product_name,  // ← data stale dari cart state
        ...
    }));
```

Skenario: Kasir tambah Produk ID=5 ke cart. Admin soft-delete produk itu (`active=0`).
Kasir checkout → `transaction_items` disimpan dengan `product_id=5` yang sudah nonaktif.
Tidak ada validasi. Produk "terhapus" tercatat di laporan penjualan — inconsistent.

### Prompt untuk Coding Agent

```
Task: Tambah spinner loading di PaymentModal saat submit, dan validasi produk
sebelum transaksi disimpan. Menyentuh DUA file. Baca keduanya terlebih dahulu.

---

## FILE 1: src/components/PaymentModal.tsx

### Fix — Tampilkan spinner di tombol submit saat isSubmitting

PaymentModal sudah menerima prop `isSubmitting` yang ditambahkan di Fase 1.
Sekarang gunakan prop itu untuk menampilkan spinner visual.

Cari import di baris 1–16. Tambahkan `Loader2` ke import dari lucide-react:
    import { CheckCircle2, Clock, QrCode, Calendar, AlertCircle, Banknote, Info, Loader2 } from 'lucide-react';
(Jika Loader2 sudah ada, skip)

Cari tombol submit (sekitar baris 396–408):
    <Button type="submit" form="payment-form" disabled={!canSubmit()}
        className={cn(
            "flex-[2] h-11 text-base font-black shadow-lg",
            paymentStatus === 'lunas'
                ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
        )}>
        {paymentStatus === 'lunas' ? 'Bayar Sekarang' : 'Simpan Transaksi'}
    </Button>

Ubah isi Button menjadi conditional:
    <Button type="submit" form="payment-form" disabled={!canSubmit()}
        className={cn(
            "flex-[2] h-11 text-base font-black shadow-lg",
            paymentStatus === 'lunas'
                ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
        )}>
        {isSubmitting ? (
            <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
            </span>
        ) : (
            paymentStatus === 'lunas' ? 'Bayar Sekarang' : 'Simpan Transaksi'
        )}
    </Button>

---

## FILE 2: src/pages/CashierPage.tsx

### Fix — Validasi produk exists sebelum createTransaction

Cari fungsi handlePayment (sekitar baris 269). Sebelum baris createTxMutation.mutate(),
tambahkan validasi bahwa semua product_id di cart masih valid (active = 1 atau minimal ada).

Tambahkan cek SETELAH `const txData = { ... };` dan SEBELUM `createTxMutation.mutate(txData, {`:

    // Validasi produk aktif sebelum checkout
    const productIds = items.filter(i => i.product_id != null).map(i => i.product_id);
    if (productIds.length > 0) {
        const validation = await window.api.getProductsByIds?.(productIds);
        // Jika API getProductsByIds belum ada, gunakan pendekatan alternatif:
        // cek satu per satu hanya untuk produk yang ada di cart
        const invalidItems: string[] = [];
        for (const item of items) {
            if (!item.product_id) continue;
            const product = await window.api.getProductById(item.product_id);
            if (!product || !product.active) {
                invalidItems.push(item.product_name);
            }
        }
        if (invalidItems.length > 0) {
            setErrorDialog({
                show: true,
                title: 'Produk Tidak Tersedia',
                message: `Produk berikut sudah tidak aktif dan tidak bisa dijual: ${invalidItems.join(', ')}. Hapus dari cart terlebih dahulu.`
            });
            return;  // jangan lanjut ke mutate
        }
    }

    createTxMutation.mutate(txData, {
        ...

Catatan: `window.api.getProductById` sudah ada di preload.js (method: getProductById).
Cek field `active` dari response — produk yang soft-deleted punya `active = 0`.

Jika cart memiliki banyak item, loop ini bisa sedikit lambat. Tapi untuk cart kasir
yang biasanya < 20 item, ini acceptable. Untuk cart > 20 item, optimasi bisa dilakukan
di fase berikutnya jika diperlukan.

---

## Verifikasi
1. Loading spinner: Buka kasir → tambah produk → bayar → saat klik "Bayar Sekarang"
   di modal, tombol harus tampilkan spinner "Menyimpan..." dan tidak bisa diklik lagi
2. Deleted product validation:
   a. Tambah produk ke cart
   b. Di halaman produk (tab/window lain), soft-delete produk itu
   c. Kembali ke kasir, coba checkout
   d. Harus muncul dialog error "Produk Tidak Tersedia" — transaksi tidak jadi

Tidak perlu rebuild, cukup npm run dev untuk test.
```

---

## Catatan Urutan Eksekusi

```
Fase 1 → CashierPage.tsx + PaymentModal.tsx | tidak ada dependency backend
Fase 2 → database.js saja | tidak ada dependency frontend
Fase 3 → printer.js + CashierPage.tsx | dua file, tidak saling bergantung
Fase 4 → PaymentModal.tsx + CashierPage.tsx | Fase 1 harus sudah selesai (prop isSubmitting)
```

Fase 1 dan 2 bisa dikerjakan paralel oleh dua agent berbeda.
Fase 3 bisa dikerjakan paralel dengan Fase 1 dan 2.
Fase 4 harus dikerjakan SETELAH Fase 1 selesai (karena pakai prop isSubmitting yang ditambah di Fase 1).

```
Timeline optimal:
  [Agent A] Fase 1  ─────────┐
  [Agent B] Fase 2  ────────┤ paralel
  [Agent C] Fase 3  ────────┤ paralel
                             └→ [Agent D] Fase 4 (setelah Fase 1 selesai)
```

---

## Final Rebuild

Setelah semua fase selesai, jalankan:
```
cd D:\Ilham\Documents\Proyek\pos-app
npm run build:portable
```

Kemudian sync ke portable jika diperlukan.
