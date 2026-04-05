# Roadmap Perbaikan: Sistem Printer & Pengaturan

Hasil analisis mendalam pada sistem printer, template struk, dan halaman pengaturan.
Dikerjakan bertahap — setiap fase adalah prompt mandiri untuk coding agent.

---

## Status Fase

| Fase | Nama | Severity | Status |
|------|------|----------|--------|
| 1 | selectedTemplateId NaN Bug | 🔴 Kritis | ⬜ Pending |
| 2 | printWindow Memory Leak | 🔴 Kritis | ⬜ Pending |
| 3 | SettingsPage CF + Width Mismatch | 🟠 Moderate | ⬜ Pending |
| 4 | handleSave Error Handling | 🟠 Moderate | ⬜ Pending |
| 5 | Dead Code & Sample Data Cleanup | 🟡 Minor | ⬜ Pending |

---

## Fase 1 — Fix: `selectedTemplateId` NaN Bug

**File:** `src/components/ReceiptTemplateEditor.tsx`

### Konteks Bug

Template ID di sistem ini adalah **string** seperti `'58mm-1'`, `'80mm-3'`, `'cf-2'` — bukan angka.
State `selectedTemplateId` saat ini dideklarasikan sebagai `number | null`, lalu saat load
dari settings dilakukan `Number(sRes.receipt_template_id)` — `Number('58mm-1')` menghasilkan
`NaN`. Akibatnya `selectedTemplateId === t.id` selalu false, sehingga template yang sudah
dipilih dan disimpan tidak pernah terlihat terhighlight saat editor dibuka kembali.

### Yang Harus Diubah

1. **Ubah tipe state** dari `number | null` menjadi `string | null`:
   ```ts
   // SEBELUM (baris ~68):
   const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

   // SESUDAH:
   const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
   ```

2. **Ubah cara load dari settings** — hapus konversi `Number()`:
   ```ts
   // SEBELUM (baris ~89):
   setSelectedTemplateId(sRes.receipt_template_id ? Number(sRes.receipt_template_id) : null);

   // SESUDAH:
   setSelectedTemplateId(sRes.receipt_template_id || null);
   ```

3. **Ubah cara save ke settings** — `selectedTemplateId` sudah string, tidak perlu `String()`:
   ```ts
   // SEBELUM (baris ~168):
   receipt_template_id: selectedTemplateId ? String(selectedTemplateId) : ''

   // SESUDAH:
   receipt_template_id: selectedTemplateId ?? ''
   ```

### Verifikasi

Setelah fix, buka ReceiptTemplateEditor, pilih template '58mm-3', klik Terapkan Perubahan,
buka lagi editor → template '58mm-3' harus tampak terhighlight/selected.

---

## Fase 2 — Fix: `printWindow` Memory Leak Saat Timeout

**File:** `electron/printer.js`

### Konteks Bug

Fungsi `printReceipt` menggunakan `Promise.race([printPromise, timeoutPromise])`.
Jika `timeoutPromise` menang (printer tidak respons dalam 15 detik), `printPromise`
tetap pending dan `printWindow` (BrowserWindow) **tidak pernah di-destroy**.
Setiap kali timeout terjadi, satu BrowserWindow zombie terakumulasi di memori
sampai aplikasi di-restart.

### Yang Harus Diubah

Tambahkan variabel `printWindow` yang bisa diakses dari luar `printPromise`, lalu
panggil `destroy()` di cleanup function `Promise.race` — atau gunakan pattern
`finally`-style dengan ref:

```js
// SEBELUM — struktur saat ini:
async function printReceipt(transaction, settings) {
  const printPromise = new Promise((resolve, reject) => {
    // ...
    const printWindow = new BrowserWindow({ ... }); // ← lokal, tidak bisa diakses luar
    // ...
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print(options, (success, failureReason) => {
        printWindow.destroy();
        // ...
      });
    });
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Print timeout...')), PRINT_TIMEOUT_MS)
  );

  return Promise.race([printPromise, timeoutPromise]);
  // ↑ jika timeout menang, printWindow tidak pernah destroyed
}

// SESUDAH — angkat printWindow ke scope luar agar bisa di-cleanup:
async function printReceipt(transaction, settings) {
  let printWindow = null; // ← angkat ke scope luar

  try {
    const printPromise = new Promise((resolve, reject) => {
      const html = generateReceiptHTML(transaction, settings);
      printWindow = new BrowserWindow({
        show: false,
        width: 300,
        height: 600,
        webPreferences: { nodeIntegration: false }
      });

      printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        printWindow.destroy();
        printWindow = null;
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
        if (printerName) options.deviceName = printerName;

        printWindow.webContents.print(options, (success, failureReason) => {
          printWindow.destroy();
          printWindow = null;
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

    return await Promise.race([printPromise, timeoutPromise]);
  } finally {
    // Cleanup: jika timeout menang, printWindow masih hidup → destroy di sini
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
  }
}
```

### Verifikasi

Setelah fix, set printer ke nama printer yang tidak ada/salah, lakukan test print,
tunggu 15 detik → harus muncul error timeout. Jalankan beberapa kali dan pastikan
tidak ada BrowserWindow yang terakumulasi (cek Task Manager jika perlu).

---

## Fase 3 — Fix: SettingsPage Missing 'cf' + Template/Width Mismatch

**Files:**
- `src/pages/SettingsPage.tsx`
- `electron/printer.js`

### Bug A: Dropdown `Lebar Kertas` di SettingsPage Tidak Ada Opsi 'cf'

Di `SettingsPage.tsx`, bagian tab Printer, dropdown `receipt_width` hanya punya
opsi `58` dan `80`. Nilai `'cf'` (Continuous Form) yang bisa di-set via
ReceiptTemplateEditor tidak muncul di sini — dropdown tampak blank.

**Yang harus diubah** — tambahkan opsi 'cf' di SelectContent dropdown lebar kertas:

```tsx
// Cari bagian ini di SettingsPage.tsx (sekitar baris 325):
<SelectContent>
  <SelectItem value="58">58mm (Kecil)</SelectItem>
  <SelectItem value="80">80mm (Standar)</SelectItem>
  {/* TAMBAHKAN: */}
  <SelectItem value="cf">9.5×11" (Continuous Form)</SelectItem>
</SelectContent>
```

### Bug B: Template ID Tidak Divalidasi Terhadap Width di `printer.js`

Jika `receipt_template_id` = `'58mm-1'` tapi `receipt_width` = `'80'` (user ubah
width di SettingsPage tanpa buka template editor), struk tercetak dengan layout
58mm di atas kertas 80mm — posisi/ukuran tidak sesuai.

**Yang harus diubah** — tambahkan validasi prefix di `printer.js` fungsi `generateReceiptHTML`:

```js
// SEBELUM (baris ~60-66):
let templateId = settings.receipt_template_id;

if (!templateId) {
  if (width === '80') templateId = '80mm-1';
  else if (width === 'cf') templateId = 'cf-1';
  else templateId = '58mm-1';
}

// SESUDAH — tambahkan validasi prefix setelah blok if:
let templateId = settings.receipt_template_id;

if (!templateId) {
  if (width === '80') templateId = '80mm-1';
  else if (width === 'cf') templateId = 'cf-1';
  else templateId = '58mm-1';
}

// Validasi: pastikan prefix template sesuai dengan width yang dipilih
// Mencegah penggunaan template 58mm untuk paper 80mm (dan sebaliknya)
const expectedPrefix = width === 'cf' ? 'cf-' : `${width}mm-`;
if (templateId && !templateId.startsWith(expectedPrefix)) {
  // Template tidak cocok dengan lebar kertas → reset ke default untuk width ini
  if (width === '80') templateId = '80mm-1';
  else if (width === 'cf') templateId = 'cf-1';
  else templateId = '58mm-1';
}
```

### Verifikasi

1. Buka SettingsPage → tab Printer → dropdown Lebar Kertas harus menampilkan 3 opsi termasuk CF.
2. Set lebar ke 80mm, simpan. Buka TemplateEditor, pilih template 58mm. Tutup tanpa save.
   Lakukan test print → struk harus menggunakan default 80mm template, bukan 58mm.

---

## Fase 4 — Fix: `handleSave` Error Handling di ReceiptTemplateEditor

**File:** `src/components/ReceiptTemplateEditor.tsx`

### Konteks Bug

`handleSave` tidak memiliki try/catch. Jika `window.api.updateSettings` gagal
(IPC error, database error), `saving` langsung false dan `onClose()` dipanggil —
modal tutup tanpa error message. User mengira pengaturan tersimpan padahal tidak.

### Yang Harus Diubah

1. **Tambah state error** di dekat deklarasi state lainnya:
   ```ts
   const [saveError, setSaveError] = useState('');
   ```

2. **Wrap `handleSave` dengan try/catch** dan tampilkan error:
   ```ts
   // SEBELUM:
   const handleSave = async () => {
       setSaving(true);
       await window.api.updateSettings({
           receipt_template: JSON.stringify(template),
           receipt_logo: logo,
           receipt_header: headerText,
           receipt_footer: footerText,
           receipt_width: receiptWidth,
           receipt_template_id: selectedTemplateId ?? ''
       });
       setSaving(false);
       onClose();
   };

   // SESUDAH:
   const handleSave = async () => {
       setSaving(true);
       setSaveError('');
       try {
           await window.api.updateSettings({
               receipt_template: JSON.stringify(template),
               receipt_logo: logo,
               receipt_header: headerText,
               receipt_footer: footerText,
               receipt_width: receiptWidth,
               receipt_template_id: selectedTemplateId ?? ''
           });
           onClose();
       } catch (err: any) {
           setSaveError('Gagal menyimpan pengaturan: ' + (err?.message || 'Unknown error'));
       } finally {
           setSaving(false);
       }
   };
   ```

3. **Tampilkan error di footer modal** — tepat di atas/di antara tombol Batal dan Terapkan:
   ```tsx
   {/* Di dalam footer section, sebelum tombol: */}
   {saveError && (
       <p className="text-xs font-bold text-red-500 text-right pr-2">{saveError}</p>
   )}
   ```

### Verifikasi

Untuk test: mock sementara `window.api.updateSettings` agar throw error,
klik "Terapkan Perubahan" → modal tidak boleh tutup, harus tampil pesan error merah.

---

## Fase 5 — Cleanup: Dead Code & Sample Data

**File:** `src/components/ReceiptTemplateEditor.tsx`

### Cleanup A: Hapus Dead Code (2 fungsi tidak terpakai)

Di bagian bawah file `ReceiptTemplateEditor.tsx` (setelah closing `}` dari komponen utama,
sekitar baris 396 ke bawah), terdapat dua fungsi yang tidak pernah dipanggil dari mana pun:

```ts
// HAPUS SELURUH BLOK INI (baris ~396–437):
const getSampleTransaction = (): Transaction => {
    return { ... };
};

function generatePreviewHTML(previewSettings: any): string {
    const is80mm = ...;
    return `...`;
}
```

Kedua fungsi ini adalah sisa implementasi lama yang sudah digantikan oleh:
- `SAMPLE_TRANSACTION` const (baris ~44)
- `window.api.getReceiptHTMLWithSettings()` IPC call

### Cleanup B: Lengkapi `SAMPLE_TRANSACTION` dengan Field yang Hilang

`SAMPLE_TRANSACTION` tidak memiliki field `cashier_name`, `customer_name`, `payment_status`,
dan `payment_notes`. Template-template baru (CF dan 58mm-9 dst) menampilkan field ini
secara prominent di preview, tapi selalu menampilkan `'-'` atau kosong.

```ts
// SEBELUM (baris ~44):
const SAMPLE_TRANSACTION: Partial<Transaction> = {
    invoice_number: 'INV-20260204-0001',
    items: [ ... ],
    subtotal: 85000,
    tax_amount: 9350,
    discount_amount: 5000,
    total: 89350,
    amount_paid: 100000,
    change_amount: 10650,
    payment_method: 'cash',
    created_at: new Date().toISOString(),
};

// SESUDAH — tambahkan field yang hilang:
const SAMPLE_TRANSACTION: Partial<Transaction> = {
    invoice_number: 'INV-20260204-0001',
    cashier_name: 'Budi Santoso',       // ← tambah
    customer_name: 'AHMAD YANI',         // ← tambah (uppercase sesuai fitur baru)
    customer_address: 'JL. MERDEKA NO.1', // ← tambah
    payment_status: 'lunas' as any,      // ← tambah
    payment_notes: '',                   // ← tambah (kosong = tidak ditampilkan)
    items: [
        { product_name: 'Nasi Goreng Spesial', quantity: 2, price: 25000, discount: 2500, subtotal: 45000 } as any,
        { product_name: 'Es Teh Manis', quantity: 3, price: 8000, discount: 0, subtotal: 24000 } as any,
        { product_name: 'Kerupuk', quantity: 4, price: 4000, discount: 0, subtotal: 16000 } as any,
    ],
    subtotal: 85000,
    tax_amount: 9350,
    discount_amount: 5000,
    total: 89350,
    amount_paid: 100000,
    change_amount: 10650,
    payment_method: 'cash',
    created_at: new Date().toISOString(),
};
```

### Verifikasi

1. File tidak ada TypeScript error.
2. `getSampleTransaction` dan `generatePreviewHTML` tidak ada lagi di file.
3. Preview template di editor menampilkan nama kasir "Budi Santoso" dan nama pembeli "AHMAD YANI".

---

## Catatan Penting untuk Agent

- Selalu baca file target sebelum edit (`Read` tool) untuk memastikan line number akurat.
- Gunakan `Edit` tool (bukan `Write`) untuk perubahan parsial — lebih aman.
- Urutan fase boleh dieksekusi paralel untuk fase 1 & 2, dan fase 3 & 4.
- Fase 5 bisa dieksekusi kapan saja karena tidak ada dependency dengan fase lain.
- Setelah semua fase selesai, jalankan `npm run dev` dan verifikasi manual tiap fix.
