# Roadmap Perbaikan: Halaman Produk (pos-app)
> Dibuat: 2026-03-02 | Scope: Critical + High Priority Issues

---

## Ringkasan Issue

| # | Fase | Kategori | File | Baris |
|---|------|----------|------|-------|
| 1 | Fase 1 | 🔴 Critical Bug | `electron/database.js` | 855 |
| 2 | Fase 1 | 🔴 Critical Bug | `electron/database.js` | 832-836, 849-851 |
| 3 | Fase 2 | 🟠 Data Integrity | `electron/database.js` | 783-798 |
| 4 | Fase 3 | 🟠 Missing Feature | `database.js` + `ProductsPage.tsx` + `api-server.js` + `main.js` | Multiple |
| 5 | Fase 4 | 🟠 UX High | `src/pages/ProductsPage.tsx` | 125-127, 345-365 |

---

## Fase 1 — Critical Database Bugs: Barcode Generation

### Masalah
**Bug A — `generateMultipleBarcodes` pakai `padStart(6)` bukan `padStart(7)`**

File: `electron/database.js` baris 855

```js
// KODE SALAH SAAT INI:
codes.push(`${prefix}${seq.toString().padStart(6, '0')}`);
//                                         ^ harusnya 7
```

Format barcode yang benar: `2[YY][MM][NNNNNNN]`
- Prefix `2` = 1 char
- `YY` = 2 char
- `MM` = 2 char
- Sequence = **7 char** → total 12 karakter

Dengan `padStart(6)`, barcode hanya 11 karakter. Semua produk yang barcodenya digenerate via batch printing/BatchBarcodeModal punya barcode salah format.

`generateProductBarcode` (single) di baris 838 sudah benar pakai `padStart(7)`. Hanya `generateMultipleBarcodes` yang salah.

**Bug B — Tidak ada guard saat sequence overflow**

Baris 833-836 dan 849-851: jika seq mencapai `9999999` lalu increment jadi `10000000`, `padStart(7)` tidak akan memotong angka 8 digit → barcode jadi 13 karakter, format rusak.

### Prompt untuk Coding Agent

```
Task: Perbaiki dua bug di fungsi barcode generation di file electron/database.js

## Bug 1 — Salah padStart di generateMultipleBarcodes (BARIS 855)

File: D:\Ilham\Documents\Proyek\pos-app\electron\database.js

Cari fungsi generateMultipleBarcodes (sekitar baris 841). Di dalamnya ada:
    codes.push(`${prefix}${seq.toString().padStart(6, '0')}`);

Ubah padStart(6, '0') menjadi padStart(7, '0'):
    codes.push(`${prefix}${seq.toString().padStart(7, '0')}`);

Alasan: format barcode 12 karakter = "2" + 2 digit tahun + 2 digit bulan + 7 digit sequence.
Fungsi generateProductBarcode (single) sudah benar dengan padStart(7). Hanya batch yang salah.

## Bug 2 — Tambah overflow guard di KEDUA fungsi barcode

Di generateProductBarcode (sekitar baris 832-836):
    if (!isNaN(lastSeq)) seq = lastSeq + 1;

Tambahkan guard SETELAH baris itu:
    if (seq > 9999999) {
        throw new Error('Sequence barcode untuk bulan ini sudah penuh (maks 9.999.999). Hubungi administrator.');
    }

Lakukan hal yang sama di generateMultipleBarcodes (sekitar baris 849-851), tepat setelah:
    if (!isNaN(lastSeq)) seq = lastSeq + 1;

Tambahkan:
    if (seq + count > 9999999) {
        throw new Error(`Sequence barcode tidak cukup. Tersedia ${9999999 - seq + 1} slot, dibutuhkan ${count}.`);
    }

## Verifikasi
Setelah edit, pastikan:
- generateProductBarcode return string 12 karakter
- generateMultipleBarcodes return array of string 12 karakter
- Jangan ubah fungsi lain, jangan refactor apapun di luar scope ini

Tidak perlu rebuild, hanya edit file database.js.
```

---

## Fase 2 — Audit Trail untuk Bulk Upsert

### Masalah
File: `electron/database.js` fungsi `bulkUpsertProducts` (baris 768-807)

Saat import Excel yang mengubah stok produk yang sudah ada, kode melakukan:
```js
UPDATE products SET stock = stock + ?, ...
```
Tapi tidak ada call ke `createStockTrail` setelahnya. Seluruh perubahan stok dari import hilang dari riwayat — kasir atau admin tidak bisa melacak dari mana stok naik.

`createProduct` di baris lain sudah punya initial stock trail. `updateProduct` sudah punya. Hanya `bulkUpsertProducts` yang tidak.

### Prompt untuk Coding Agent

```
Task: Tambahkan audit trail (stock_trail) untuk perubahan stok di fungsi bulkUpsertProducts
di file electron/database.js

## Lokasi
File: D:\Ilham\Documents\Proyek\pos-app\electron\database.js
Fungsi: bulkUpsertProducts (sekitar baris 768-807)

## Yang perlu diubah
Di dalam blok `if (existing)` (sekitar baris 784), SEBELUM melakukan UPDATE,
ambil dulu stok lama:
    const oldStock = get('SELECT stock FROM products WHERE id = ?', [existing.id])?.stock || 0;

Kemudian SETELAH run(...UPDATE...) berhasil, tambahkan stok trail jika stok berubah:
    const stockAdded = p.stock || 0;
    if (stockAdded !== 0) {
        createStockTrail({
            product_id: existing.id,
            product_name: upperName,
            event_type: 'restock',
            quantity_before: oldStock,
            quantity_change: stockAdded,
            quantity_after: oldStock + stockAdded,
            user_id: null,
            user_name: 'Import Excel',
            notes: 'Import/update massal via Excel'
        });
    }

Di dalam blok `else` (INSERT baru, sekitar baris 791-797), SETELAH INSERT berhasil,
tambahkan trail jika stock awal > 0:
    const newId = run(`INSERT INTO products...`).lastInsertRowid;
    if ((p.stock || 0) > 0) {
        createStockTrail({
            product_id: newId,
            product_name: upperName,
            event_type: 'initial',
            quantity_before: 0,
            quantity_change: p.stock || 0,
            quantity_after: p.stock || 0,
            user_id: null,
            user_name: 'Import Excel',
            notes: 'Stok awal via import Excel'
        });
    }

## Penting
- Pastikan `oldStock` diambil SEBELUM UPDATE dijalankan
- `createStockTrail` sudah ada di file yang sama, tidak perlu import
- Error di createStockTrail sudah di-handle internally (silent fail + console.error), jadi tidak
  perlu try-catch tambahan
- Jangan ubah transaction wrapper, jangan ubah error handling yang sudah ada
- Jangan ubah apapun di luar fungsi bulkUpsertProducts

Tidak perlu rebuild, hanya edit file database.js.
```

---

## Fase 3 — Tampilan & Pemulihan Produk Nonaktif

### Masalah
`deleteProduct` melakukan soft delete (`SET active = 0`) tapi tidak ada UI sama sekali untuk:
- Melihat produk yang sudah dinonaktifkan
- Mengaktifkan kembali produk yang salah dihapus
- Menghapus permanen jika memang tidak dibutuhkan

Perlu ditambah di 4 lapisan: database → IPC → API → UI

### Prompt untuk Coding Agent

```
Task: Tambah fitur lihat dan pulihkan produk nonaktif di halaman Produk

Ini menyentuh 4 file: database.js, main.js, api-server.js, dan ProductsPage.tsx.
Baca setiap file terlebih dahulu sebelum mengedit.

---

## LANGKAH 1 — database.js

File: D:\Ilham\Documents\Proyek\pos-app\electron\database.js

Tambahkan fungsi baru SETELAH fungsi deleteProduct:

    function restoreProduct(id) {
        const product = get('SELECT id, name FROM products WHERE id = ?', [id]);
        if (!product) throw new Error('Produk tidak ditemukan');
        run(`UPDATE products SET active = 1, updated_at = datetime('now', 'localtime') WHERE id = ?`, [id]);
        return getProductById(id);
    }

Tambahkan di bagian module.exports (cari object exports di akhir file):
    restoreProduct,

---

## LANGKAH 2 — main.js

File: D:\Ilham\Documents\Proyek\pos-app\electron\main.js

Cari blok IPC handlers untuk products (cari 'products:delete'). Tambahkan handler baru
di bawahnya:

    ipcMain.handle('products:restore', (_, id) => {
        return database.restoreProduct(id);
    });

---

## LANGKAH 3 — api-server.js

File: D:\Ilham\Documents\Proyek\pos-app\electron\api-server.js

Cari endpoint `DELETE /products/:id`. Tambahkan endpoint baru SEBELUMNYA:

    app.put('/products/:id/restore', requireAuth, (req, res) => {
        try {
            const product = db.restoreProduct(parseInt(req.params.id));
            invalidateCache(['products', 'dashboard']);
            res.json({ success: true, data: product });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });

---

## LANGKAH 4 — ProductsPage.tsx

File: D:\Ilham\Documents\Proyek\pos-app\src\pages\ProductsPage.tsx

### 4a. Tambah state untuk toggle tampil produk nonaktif
Di sekitar baris 100 (setelah state declarations yang ada), tambahkan:
    const [showInactive, setShowInactive] = useState(false);

### 4b. Update query useProducts
Di sekitar baris 107-115, parameter active harus menyesuaikan toggle:
    const { data: productsData, isLoading: loadingProducts } = useProducts({
        search,
        category_id: filterCategory === 'all' ? undefined : filterCategory,
        active: showInactive ? 0 : 1,   // ← ubah dari hardcoded `1` ke conditional
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
    });

### 4c. Tambah mutation restoreProduct
Di sekitar tempat mutations lain (cari useDeleteProduct, useBulkDeleteProducts), tambahkan:

    const restoreProductMutation = useMutation({
        mutationFn: (id: number) => window.api.products.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    // Import useMutation dan useQueryClient jika belum ada di imports

### 4d. Tambah tombol toggle di toolbar
Cari area toolbar/filter di atas tabel (dekat tombol tambah produk, search bar, dll).
Tambahkan toggle button:

    <Button
        variant={showInactive ? "destructive" : "outline"}
        size="sm"
        onClick={() => { setShowInactive(v => !v); setPage(1); setSelectedProducts([]); }}
        className="gap-2"
    >
        <RetroTrash className="w-4 h-4" />
        {showInactive ? 'Nonaktif' : 'Aktif'}
    </Button>

### 4e. Tambah aksi "Pulihkan" di dropdown row action
Di dalam DropdownMenuContent (sekitar baris 564-576), tambahkan item kondisional:

    {showInactive && (
        <DropdownMenuItem
            onClick={() => restoreProductMutation.mutate(p.id)}
            className="gap-2 text-emerald-700 focus:text-emerald-600 focus:bg-emerald-50"
        >
            <RetroRefresh className="w-4 h-4" /> Pulihkan
        </DropdownMenuItem>
    )}

### 4f. Update preload.js
File: D:\Ilham\Documents\Proyek\pos-app\electron\preload.js

Cari objek `products` di contextBridge. Tambahkan method:
    restore: (id) => ipcRenderer.invoke('products:restore', id),

---

## Verifikasi setelah semua langkah
1. Jalankan npm run dev
2. Buka halaman Produk
3. Toggle tombol "Nonaktif" → tabel harus menampilkan produk dengan active=0
4. Klik dropdown pada produk nonaktif → harus ada opsi "Pulihkan"
5. Klik Pulihkan → produk kembali muncul di view Aktif
6. Rebuild: npm run build:portable
```

---

## Fase 4 — Cross-Page Selection UX

### Masalah
File: `src/pages/ProductsPage.tsx`

Dua masalah yang berkaitan:

**A) Selection hilang saat ganti halaman** (baris 124-127):
```tsx
// Ini menghapus semua selection setiap kali data produk berubah,
// termasuk saat pindah halaman
useEffect(() => {
    setSelectedProducts([]);
}, [products]);
```

**B) "Select All" hanya pilih halaman aktif** (baris 345-349):
```tsx
const toggleSelectAll = useCallback(() => {
    setSelectedProducts(prev =>
        prev.length === products.length ? [] : products.map(p => p.id)
        // products di sini hanya 25/50/100 item halaman saat ini
    );
}, [products]);
```

User tidak bisa bulk delete lebih dari satu halaman sekaligus. Solusi: ikuti pola Gmail — saat user pilih semua di halaman, tampilkan banner "Pilih semua X produk dari hasil pencarian ini?"

### Prompt untuk Coding Agent

```
Task: Perbaiki UX cross-page selection di ProductsPage.tsx

File: D:\Ilham\Documents\Proyek\pos-app\src\pages\ProductsPage.tsx

Baca file ini terlebih dahulu. Semua perubahan hanya di file ini.

---

## MASALAH 1 — useEffect yang menghapus selection saat ganti halaman (baris 124-127)

Kode saat ini:
    useEffect(() => {
        setSelectedProducts([]);
    }, [products]);

Ubah dependency agar hanya clear selection saat search/filter berubah,
BUKAN saat ganti halaman:
    useEffect(() => {
        setSelectedProducts([]);
        setSelectAll(false);
    }, [search, filterCategory, pageSize]);

(state selectAll akan ditambahkan di langkah berikutnya)

---

## MASALAH 2 — Tambah state selectAll dan banner "Pilih Semua"

Tambahkan state baru di sekitar baris 100-104 (bersama state pagination lainnya):
    const [selectAll, setSelectAll] = useState(false);
    // selectAll = true berarti user memilih SEMUA produk di semua halaman,
    // bukan hanya halaman aktif

---

## MASALAH 3 — Update toggleSelectAll

Ganti fungsi toggleSelectAll (baris 345-349) dengan:

    const toggleSelectAll = useCallback(() => {
        if (selectedProducts.length === products.length && selectedProducts.length > 0) {
            // Deselect semua
            setSelectedProducts([]);
            setSelectAll(false);
        } else {
            // Pilih semua di halaman ini
            setSelectedProducts(products.map(p => p.id));
            setSelectAll(false); // reset cross-page selection
        }
    }, [products, selectedProducts]);

---

## MASALAH 4 — Banner cross-page selection

Tambahkan banner yang muncul saat semua item di halaman aktif terpilih
dan totalProducts > pageSize. Tempatkan TEPAT DI ATAS TableHeader,
di dalam ScrollArea atau Card body, sebelum <Table>:

    {selectedProducts.length === products.length && products.length > 0 && totalProducts > pageSize && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
            {selectAll ? (
                <>
                    <span className="font-medium text-primary-700 dark:text-primary-300">
                        Semua <strong>{totalProducts}</strong> produk dipilih.
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-700 dark:text-primary-300 h-7 px-2"
                        onClick={() => { setSelectAll(false); setSelectedProducts([]); }}
                    >
                        Batalkan pilihan
                    </Button>
                </>
            ) : (
                <>
                    <span className="text-muted-foreground">
                        {selectedProducts.length} produk di halaman ini dipilih.
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-700 dark:text-primary-300 h-7 px-2"
                        onClick={() => setSelectAll(true)}
                    >
                        Pilih semua {totalProducts} produk
                    </Button>
                </>
            )}
        </div>
    )}

---

## MASALAH 5 — Update confirmBulkDelete untuk pakai selectAll

Ganti fungsi confirmBulkDelete (baris 362-365) dengan:

    const confirmBulkDelete = () => {
        setShowBulkDeleteDialog(false);
        if (selectAll) {
            // Kirim sinyal ke backend untuk delete semua sesuai filter aktif
            // Sementara: ambil semua ID dari halaman ini + tandai selectAll
            // Backend menerima array ID, jadi kita perlu solusi pragmatis:
            // Tampilkan toast bahwa fitur ini membutuhkan konfirmasi lebih lanjut
            // karena delete massal semua halaman berisiko tinggi
            window.showToast?.(
                `Untuk keamanan, hapus massal lebih dari ${pageSize} produk dilakukan per halaman. Harap ulangi untuk setiap halaman.`,
                'warning'
            );
            setSelectAll(false);
            setSelectedProducts([]);
        } else {
            bulkDeleteMutation.mutate(selectedProducts, {
                onSuccess: () => {
                    setSelectedProducts([]);
                    setSelectAll(false);
                }
            });
        }
    };

Catatan: Desain ini sengaja TIDAK mengizinkan hapus massal semua halaman
sekaligus untuk mencegah accident delete ratusan produk. Banner memberi
visibility tapi action tetap dibatasi per halaman.

---

## MASALAH 6 — Update dialog text untuk reflect jumlah yang benar

Cari Dialog showBulkDeleteDialog. Update description-nya:

    <DialogDescription>
        {selectAll
            ? `Fitur hapus semua ${totalProducts} produk dilakukan per halaman untuk keamanan.`
            : `Yakin ingin menghapus ${selectedProducts.length} produk yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        }
    </DialogDescription>

---

## Verifikasi
1. Pilih semua produk di halaman 1 → banner muncul "Pilih semua X produk"
2. Klik banner → teks berubah "Semua X produk dipilih"
3. Pindah ke halaman 2 → selection di halaman 1 TIDAK hilang (karena useEffect sudah diubah)
4. Klik checkbox di halaman 2 → selection bertambah
5. Jalankan bulk delete → hanya hapus produk yang ada di selectedProducts array
6. Ganti search term → selection di-clear (useEffect baru)

Rebuild: npm run build:portable
```

---

## Catatan Urutan Eksekusi

```
Fase 1 → database.js saja, tidak ada dependency, aman dikerjakan pertama
Fase 2 → database.js saja, tidak ada dependency
Fase 3 → Harus dikerjakan berurutan: database.js → main.js → preload.js → api-server.js → ProductsPage.tsx
Fase 4 → ProductsPage.tsx saja, tidak ada dependency ke backend
```

Fase 1 dan 2 bisa dikerjakan paralel oleh dua agent berbeda karena menyentuh fungsi yang berbeda di database.js.
Fase 3 dan 4 bisa dikerjakan paralel karena menyentuh file yang berbeda.
