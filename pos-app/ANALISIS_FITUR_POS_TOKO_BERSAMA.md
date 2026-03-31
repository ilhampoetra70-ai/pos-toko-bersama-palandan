# 📋 Analisis Fitur Komprehensif POS Toko Bersama

> Dokumen ini berisi daftar lengkap fitur-fitur yang ada di aplikasi POS Toko Bersama untuk referensi migrasi ke VB.NET dan Delphi.

---

## 📑 Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Modul Autentikasi & Keamanan](#2-modul-autentikasi--keamanan)
3. [Manajemen Pengguna (Users)](#3-manajemen-pengguna-users)
4. [Manajemen Produk](#4-manajemen-produk)
5. [Manajemen Kategori](#5-manajemen-kategori)
6. [Manajemen Stok](#6-manajemen-stok)
7. [Kasir & Transaksi](#7-kasir--transaksi)
8. [Manajemen Piutang (Debt)](#8-manajemen-piutang-debt)
9. [Laporan & Analitik](#9-laporan--analitik)
10. [Cetak Struk (Printing)](#10-cetak-struk-printing)
11. [AI Insight (Kecerdasan Buatan)](#11-ai-insight-kecerdasan-buatan)
12. [Pengaturan Sistem](#12-pengaturan-sistem)
13. [Manajemen Database](#13-manajemen-database)
14. [Price Checker PWA](#14-price-checker-pwa)
15. [Mobile Admin PWA](#15-mobile-admin-pwa)
16. [Export/Import Data](#16-exportimport-data)
17. [Fitur Sistem & Utilitas](#17-fitur-sistem--utilitas)

---

## 1. Arsitektur Sistem

### 1.1 Tech Stack
| Komponen | Teknologi |
|----------|-----------|
| Frontend | React 18 + TypeScript |
| Backend | Electron Main Process (Node.js) |
| Database | SQLite (better-sqlite3) dengan WAL mode |
| API Server | Express.js (port 3001) |
| State Management | React Context + TanStack Query |
| Routing | React Router (HashRouter) |
| Styling | TailwindCSS + shadcn/ui |
| Build Tool | Vite |

### 1.2 Struktur Database

#### Tabel Utama:
```sql
users              - Data pengguna dan autentikasi
categories         - Kategori produk
products           - Data produk (barcode, nama, harga, stok, dll)
transactions       - Header transaksi penjualan
transaction_items  - Detail item per transaksi
payment_history    - Riwayat pembayaran/cicilan
stock_audit_log    - Log perubahan stok (legacy)
stock_trail        - Audit trail stok lengkap
settings           - Konfigurasi aplikasi (key-value)
device_sessions    - Sesi perangkat login
ai_insight_cache   - Cache hasil analisis AI
```

#### Performance Indexes:
- idx_products_barcode
- idx_transactions_created
- idx_transaction_items_tx_id
- idx_stock_trail_product_created
- idx_payment_history_tx_id

### 1.3 Mode Operasi
- **Development**: Vite dev server (port 5173) + Electron
- **Production**: Static files dari `dist-renderer/` + Electron
- **API Server**: Express server di port 3001 (untuk PWA)

---

## 2. Modul Autentikasi & Keamanan

### 2.1 Fitur Login
- ✅ Login dengan username dan password
- ✅ Password hashing menggunakan bcryptjs
- ✅ JWT (JSON Web Token) dengan expiry 12 jam
- ✅ Token invalidation saat logout
- ✅ Penyimpanan JWT secret di file terpisah (bukan database)
- ✅ Device session tracking (perangkat yang login)

### 2.2 Role-Based Access Control (RBAC)
| Role | Akses |
|------|-------|
| **admin** | Akses penuh (Users, Database, Settings, semua modul) |
| **supervisor** | Laporan, stok, transaksi (tidak bisa Settings/Users/DB) |
| **cashier** | Kasir, transaksi, lihat stok dasar saja |

### 2.3 Keamanan Tambahan
- ✅ Master Key untuk reset password admin
- ✅ Force password change untuk user baru
- ✅ Protection: Tidak bisa menghapus/menonaktifkan admin terakhir
- ✅ Session timeout dan invalidation
- ✅ Password minimal 6 karakter
- ✅ CSP (Content Security Policy) ketat
- ✅ File upload validation (image size, type, magic number)

---

## 3. Manajemen Pengguna (Users)

### 3.1 CRUD Operations
- ✅ Create user (dengan role assignment)
- ✅ Read: List semua user dengan filter
- ✅ Update: Edit username, name, role, active status, password
- ✅ Delete: Hapus user (dengan protection admin terakhir)

### 3.2 Field User
```
id, username, password_hash, name, role, active, 
last_login, created_at, logged_out_at, password_changed
```

### 3.3 Validasi Bisnis
- Tidak boleh ada username duplicate
- Tidak boleh menghapus admin terakhir yang aktif
- Tidak boleh menonaktifkan admin terakhir
- Password default harus diganti saat pertama login

---

## 4. Manajemen Produk

### 4.1 Data Produk
```
id, category_id, barcode, name, price, cost, stock, 
unit, active, low_stock_threshold, created_at, updated_at, margin_mode
```

### 4.2 Fitur Produk
- ✅ CRUD produk lengkap
- ✅ Auto-generate barcode (12 digit padded)
- ✅ Soft delete (restore product)
- ✅ Filter: by category, search by name/barcode, active/inactive
- ✅ Pagination dan sorting
- ✅ Low stock threshold per produk

### 4.3 Manajemen Harga
- ✅ Harga jual (price)
- ✅ Harga modal/cost (cost)
- ✅ Margin mode: manual atau auto-calculate
- ✅ Auto backup harga modal saat transaksi (original_cost)

### 4.4 Bulk Operations
- ✅ Bulk import dari Excel
- ✅ Bulk update field (misal: ubah harga banyak produk sekaligus)
- ✅ Bulk delete produk
- ✅ Bulk upsert (insert/update berdasarkan barcode)
- ✅ Progress bar untuk operasi besar (via Worker Thread)

### 4.5 Barcode Support
- ✅ Scan barcode via Quagga2
- ✅ Generate barcode otomatis untuk produk baru
- ✅ Padding barcode ke 12 digit
- ✅ Unique constraint pada barcode

---

## 5. Manajemen Kategori

### 5.1 Fitur
- ✅ CRUD kategori produk
- ✅ Validasi: tidak boleh ada nama kategori duplicate
- ✅ Soft delete dengan pengecekan produk terkait

---

## 6. Manajemen Stok

### 6.1 Stock Trail (Audit Trail)
Sistem audit lengkap untuk tracking perubahan stok:
```
id, product_id, product_name, event_type, quantity_before,
quantity_change, quantity_after, user_id, user_name, notes, reference_id, created_at
```

**Event Types:**
- `transaction` - Pengurangan stok karena penjualan
- `restock` - Penambahan stok
- `adjustment` - Penyesuaian manual
- `void` - Pembatalan transaksi (pengembalian stok)

### 6.2 Fitur Stock
- ✅ Real-time stock check
- ✅ Low stock alert (notifikasi produk stok menipis)
- ✅ Stock opname (audit fisik)
- ✅ History perubahan stok per produk
- ✅ Filter by date range, user, event type

### 6.3 Stock Audit Log (Legacy)
- Log sederhana untuk perubahan stok
- Migration ke stock_trail untuk data baru

---

## 7. Kasir & Transaksi

### 7.1 Fitur Kasir
- ✅ Interface kasir dengan cart
- ✅ Scan barcode atau pencarian produk
- ✅ Quantity adjustment
- ✅ Hapus item dari cart
- ✅ Diskon per transaksi (nominal atau persentase)
- ✅ Pajak (tax) configurable
- ✅ Subtotal, total, kembalian otomatis

### 7.2 Data Transaksi
```
Transactions:
id, invoice_number, user_id, subtotal, tax_amount, discount_amount,
total, payment_method, amount_paid, change_amount, created_at,
customer_name, customer_address, payment_status, due_date,
total_paid, remaining_balance, payment_notes, status

Transaction Items:
id, transaction_id, product_id, product_name, price, original_cost,
quantity, discount, subtotal
```

### 7.3 Metode Pembayaran
- ✅ **Cash** (Tunai) - dengan perhitungan kembalian
- ✅ **Transfer** (Bank Transfer)
- ✅ **QRIS** - Pembayaran QR code
- ✅ **Credit/Debt** (Bon/Piutang) - dengan jatuh tempo

### 7.4 Fitur Transaksi Lanjutan
- ✅ Void transaction (pembatalan)
- ✅ Reprint struk
- ✅ Invoice numbering (INV-YYYYMMDD-XXXX)
- ✅ Customer data (nama, alamat) untuk piutang
- ✅ Payment notes (catatan kasir)

### 7.5 Cicilan/Pembayaran Bertahap
- ✅ Add payment ke transaksi yang sudah ada
- ✅ Track payment history
- ✅ Auto update remaining balance
- ✅ Status: lunas / belum lunas

---

## 8. Manajemen Piutang (Debt)

### 8.1 Fitur
- ✅ Outstanding debts list (piutang belum lunas)
- ✅ Filter by customer, date range, amount
- ✅ Overdue tracking (jatuh tempo lewat)
- ✅ Payment history per piutang
- ✅ Summary total piutang aktif
- ✅ Top debtors list

### 8.2 Status Piutang
- Lunas
- Belum lunas
- Jatuh tempo (overdue)

---

## 9. Laporan & Analitik

### 9.1 Dashboard Stats
- ✅ Total penjualan hari ini
- ✅ Total transaksi hari ini
- ✅ Total item terjual
- ✅ Average transaction value
- ✅ Grafik penjualan (hourly)
- ✅ Produk terlaris hari ini

### 9.2 Laporan Penjualan
- ✅ Sales report (by date range)
- ✅ Profit report (jika cost data tersedia)
- ✅ Hourly sales distribution
- ✅ Day of week sales
- ✅ Product comparison (periode 1 vs periode 2)

### 9.3 Laporan Produk
- ✅ Top selling products
- ✅ Bottom/slow moving products
- ✅ Product stockout prediction
- ✅ Category performance
- ✅ Margin analysis per kategori

### 9.4 Laporan Lainnya
- ✅ Transaction log (semua transaksi)
- ✅ Stock audit trail
- ✅ Customer insights (repeat customers, top customers)
- ✅ Payment method distribution

### 9.5 Export Laporan
- ✅ Export ke PDF
- ✅ Export ke Excel (.xlsx)
- ✅ Print laporan langsung
- ✅ Plain text report untuk printer dot-matrix

---

## 10. Cetak Struk (Printing)

### 10.1 Template Struk
| Template | Ukuran | Keterangan |
|----------|--------|------------|
| Simple (Default) | 58mm | Format dasar, 2 baris per item |
| Compact | 58mm | Format ringkas, hemat kertas |
| Modern | 58mm | Dengan border dan styling modern |
| Formal Plus | 58mm | Lengkap dengan subtotal, diskon, pajak |
| Tabel 3 Kolom | 58mm | Format tabel ITEM-QTY-SUBTOTAL |
| Garis Ganda | 58mm | Border double untuk header/total |
| Nota Ringkas | 58mm | Format paling ringkas |
| Standar CF | CF 9.5x11" | Continuous form standar |
| Invoice Bisnis | CF 9.5x11" | Format invoice formal |
| Nota Tabel Penuh | CF 9.5x11" | Full border grid |

### 10.2 Pengaturan Struk
- ✅ Ukuran kertas: 58mm, 80mm, atau Continuous Form
- ✅ Font size: Small, Medium, Large
- ✅ Section toggle (bisa hide/show):
  - Logo toko
  - Nama toko
  - Alamat toko
  - Telepon toko
  - Info invoice (no, tanggal, kasir)
  - Info pajak
  - Info diskon
  - Metode pembayaran
  - Footer text

### 10.3 Fitur Print
- ✅ Print silent (tanpa dialog)
- ✅ Printer selection
- ✅ Print preview
- ✅ Print dengan custom settings (one-time)
- ✅ Open cash drawer (jika printer support)

### 10.4 Logo pada Struk
- ✅ Upload logo (PNG/JPG)
- ✅ Auto resize max 80% width, 60px height
- ✅ Base64 storage di database

---

## 11. AI Insight (Kecerdasan Buatan)

### 11.1 Mode AI
1. **Local Model** - Menggunakan node-llama-cpp (offline)
2. **API Mode** - Menggunakan API external (Groq, OpenRouter, OpenAI)

### 11.2 Fitur Analisis AI
Analisis otomatis data penjualan dengan output 5 paragraf:
1. **Kondisi bisnis & tren** - Perbandingan periode, arah tren
2. **Pola trafik** - Jam dan hari tersibuk/tersepi
3. **Analisis produk** - Top selling, slow moving, bundling opportunities
4. **Analisis pelanggan** - Top customers, repeat vs one-time, area pemetaan
5. **Rekomendasi operasional** - Prioritas stok, layout, peringatan anomali

### 11.3 Data yang Dianalisis
- Revenue summary (WoW comparison)
- Hourly sales distribution
- Day of week sales
- Top selling products dengan margin
- Slow moving products
- Low stock alerts
- Market basket analysis (pasangan produk)
- Category performance
- Payment method ratio
- Stock anomalies (potensi kehilangan)
- Customer insights (top customers, locations)
- Debt receivables (piutang)

### 11.4 Auto-Generate Schedule
- ✅ Mingguan (7 hari) - refresh setiap Senin
- ✅ Bulanan (30 hari) - refresh setiap awal bulan
- ✅ Triwulan (90 hari) - refresh setiap awal quarter

### 11.5 Performance Presets (Local Model)
- **Hemat**: 25% CPU cores, 512 tokens
- **Seimbang**: 50% CPU cores, 1024 tokens (default)
- **Cepat**: 75% CPU cores, 2048 tokens

### 11.6 Cache System
- Cache hasil analisis per range (7, 30, 90 hari)
- Cache invalidation otomatis
- Manual refresh (force regenerate)

---

## 12. Pengaturan Sistem

### 12.1 Pengaturan Toko
- ✅ Nama toko
- ✅ Alamat toko
- ✅ Nomor telepon
- ✅ Header text struk (custom message)
- ✅ Footer text struk
- ✅ Logo toko (upload image)

### 12.2 Pengaturan Printer
- ✅ Pilihan printer default
- ✅ Ukuran kertas (58mm/80mm/CF)
- ✅ Template struk default
- ✅ Font size default
- ✅ Section visibility toggle
- ✅ Logo pada struk (on/off)

### 12.3 Pengaturan Bisnis
- ✅ Pajak (tax) percentage
- ✅ Default margin percentage
- ✅ Auto-start aplikasi (Windows startup)
- ✅ Timezone offset

### 12.4 Pengaturan AI
- ✅ Mode (Local/API)
- ✅ API Provider (Groq, OpenRouter, OpenAI)
- ✅ API Key storage (encrypted)
- ✅ Model selection
- ✅ Performance preset (Local)
- ✅ Custom model file path

### 12.5 Branding Aplikasi
- ✅ App name (window title)
- ✅ App logo (icon window)

---

## 13. Manajemen Database

### 13.1 Database Operations
- ✅ Backup manual
- ✅ Auto backup (interval 4 hari)
- ✅ Restore dari backup
- ✅ Backup history management
- ✅ Set backup directory

### 13.2 Maintenance
- ✅ Database integrity check (PRAGMA integrity_check)
- ✅ Vacuum database (compress)
- ✅ Analyze (update statistics)
- ✅ Clear voided transactions
- ✅ Archive old transactions (> X bulan)
- ✅ Cleanup old audit logs (> 30 hari)

### 13.3 Data Export/Import
- ✅ Export transactions to Excel
- ✅ Export products to Excel
- ✅ Import products from Excel (bulk)
- ✅ Excel template download

### 13.4 Database Stats
- ✅ Database file size
- ✅ Total records per table
- ✅ Index usage stats

### 13.5 Hard Reset
- ✅ Factory reset (hapus semua data kecuali settings)
- ✅ Master key required untuk hard reset

---

## 14. Price Checker PWA

### 14.1 Fitur
- ✅ Progressive Web App untuk cek harga
- ✅ Scan barcode menggunakan kamera (Quagga2)
- ✅ Virtual keyboard (simple-keyboard)
- ✅ Real-time price lookup via API
- ✅ Display: nama produk, harga, stok
- ✅ Works offline (cached)

### 14.2 Deployment
- ✅ Static files di `price-checker/`
- ✅ Diserve oleh Express server (port 3001)
- ✅ Accessible via LAN (IP lokal)

---

## 15. Mobile Admin PWA

### 15.1 Fitur
- ✅ Progressive Web App untuk admin mobile
- ✅ Dashboard ringkas
- ✅ Lihat transaksi
- ✅ Manajemen stok dasar
- ✅ Laporan sederhana

### 15.2 Deployment
- ✅ Static files di `mobile-admin-dist/`
- ✅ Diserve oleh Express server (port 3001)

---

## 16. Export/Import Data

### 16.1 Export
| Format | Data | Keterangan |
|--------|------|------------|
| Excel | Products | Semua field produk |
| Excel | Transactions | Filter by date range |
| PDF | Reports | Laporan dengan formatting |
| CSV | - | Via Excel export |

### 16.2 Import
- ✅ Import produk dari Excel
- ✅ Field mapping (kolom fleksibel)
- ✅ Preview before import
- ✅ Validasi data (duplicate barcode, required fields)
- ✅ Progress bar untuk import besar
- ✅ Error reporting (row yang gagal)

### 16.3 Template
- ✅ Download template Excel untuk import produk
- ✅ Format yang sudah ditentukan

---

## 17. Fitur Sistem & Utilitas

### 17.1 Window Management
- ✅ Fullscreen mode
- ✅ Minimize/Maximize
- ✅ Custom window title dari settings
- ✅ Custom window icon dari settings

### 17.2 Low-Spec Optimizations
- ✅ Dynamic heap size (256MB untuk RAM < 4GB, 512MB untuk >= 4GB)
- ✅ Disable GPU compositing
- ✅ Disable background throttling
- ✅ Prepared statement cache (max 100)
- ✅ Worker thread untuk bulk operations
- ✅ Disk cache limit 10MB

### 17.3 Cloudflare Tunnel
- ✅ Integration dengan cloudflared.exe
- ✅ Remote access setup via CLI

### 17.4 Scheduled Tasks
- ✅ Auto backup (setiap 4 hari)
- ✅ Audit cleanup (daily)
- ✅ AI cache cleanup (hourly)
- ✅ Daily ANALYZE database

### 17.5 Security Features
- ✅ Input sanitization (escHtml)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ File upload validation
- ✅ Rate limiter untuk API

### 17.6 Error Handling
- ✅ Global error boundary
- ✅ Chunk loading error handler
- ✅ Graceful degradation
- ✅ Error logging ke console

### 17.7 IPC Communication
Total ~140 IPC handlers meliputi:
- auth:* (login, logout, verify, reset password)
- users:* (CRUD users)
- products:* (CRUD, bulk operations)
- transactions:* (create, get, void, payment)
- reports:* (various report types)
- print:* (printing operations)
- db:* (database maintenance)
- ai:* (AI operations)
- excel:* (import/export)
- settings:* (configuration)

---

## 📊 Ringkasan Statistik Fitur

| Kategori | Jumlah Fitur |
|----------|--------------|
| Autentikasi & Keamanan | 8 |
| Manajemen Pengguna | 6 |
| Manajemen Produk | 15 |
| Manajemen Stok | 10 |
| Kasir & Transaksi | 18 |
| Manajemen Piutang | 6 |
| Laporan & Analitik | 15 |
| Printing & Struk | 12 |
| AI Insight | 10 |
| Pengaturan | 12 |
| Database Management | 14 |
| PWA (Price Checker + Mobile Admin) | 8 |
| Export/Import | 8 |
| Sistem & Utilitas | 20 |
| **TOTAL** | **~162 fitur** |

---

## 🔄 Alur Kerja Utama (Workflows)

### Alur Penjualan (Sales Flow):
```
1. Login → Dashboard
2. KasirPage → Scan/Pilih Produk → Add to Cart
3. Set Quantity → Apply Discount (opsional) → Set Customer (opsional)
4. Pilih Metode Pembayaran → Input Amount (jika cash)
5. Submit Transaction → Print Receipt (opsional)
6. Stok berkurang otomatis → Stock Trail tercatat
```

### Alur Restock:
```
1. ProductsPage → Pilih Produk
2. Update Stock → Input Quantity Baru
3. Sistem catat: quantity_before, quantity_change, quantity_after
4. Stock Trail created dengan event_type = 'restock'
```

### Alur Piutang:
```
1. KasirPage → Pilih Produk
2. Payment Method = 'hutang' / 'bon'
3. Input Customer Name, Due Date
4. Transaction created dengan payment_status = 'belum lunas'
5. DebtManagementPage → Lihat Outstanding
6. Add Payment → Update remaining_balance
7. Jika remaining_balance = 0 → status = 'lunas'
```

---

## 📝 Catatan Penting untuk Migrasi

### 1. Database Schema
- **WAJIB** mempertahankan struktur tabel dan relasi yang sama
- Indexes sangat penting untuk performance
- Foreign key constraints harus diaktifkan
- WAL mode recommended untuk SQLite

### 2. Business Logic Critical
- Perhitungan stok (transaction mengurangi, void menambah)
- Invoice numbering format: `INV-YYYYMMDD-XXXX`
- Password hashing (bcrypt)
- JWT token generation dan validation
- Permission checking per role

### 3. Data Integrity
- Barcode uniqueness
- Stock tidak boleh negatif (constraint atau check)
- Transaction total = sum of items subtotal
- Payment balance calculation

### 4. UI/UX Considerations
- Responsive design untuk berbagai screen sizes
- Loading states untuk operasi async
- Error handling dengan user-friendly messages
- Confirmation dialogs untuk destructive actions

### 5. Performance
- Lazy loading untuk modul besar
- Pagination untuk list yang panjang
- Caching untuk data yang jarang berubah
- Worker thread untuk operasi berat

---

Dokumen ini akan di-update jika ada fitur baru yang ditambahkan.

**Versi:** 1.0  
**Tanggal:** 31 Maret 2026  
**Untuk:** Migrasi POS Toko Bersama ke VB.NET & Delphi
