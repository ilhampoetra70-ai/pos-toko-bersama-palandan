# Project Documentation for AI Agents

> **Peringatan**: Dokumentasi ini ditulis dalam Bahasa Indonesia karena seluruh codebase, komentar, dan dokumentasi proyek menggunakan Bahasa Indonesia.

## Gambaran Proyek

Proyek ini adalah **POS (Point of Sale) Cashier Desktop Application** bernama "Toko Bersama" — aplikasi kasir desktop berbasis Electron untuk manajemen penjualan retail. Arsitektur hybrid memungkinkan akses via aplikasi desktop (Electron) maupun web browser dalam jaringan lokal.

### Struktur Direktori

```
D:\Ilham\Documents\Proyek/
├── pos-app/                 # Aplikasi POS utama (Electron + React)
│   ├── electron/            # Main process (Node.js)
│   ├── src/                 # Renderer process (React + TypeScript)
│   ├── docs/                # Dokumentasi teknis
│   ├── mobile-admin-dist/   # Build PWA untuk admin mobile
│   ├── price-checker/       # Static HTML untuk price checker
│   └── assets/              # Logo dan ikon aplikasi
├── bawaslu/                 # Direktori kosong (placeholder)
├── pos-app-recovery/        # Direktori kosong (placeholder)
└── pos-rust-service/        # Direktori kosong (placeholder)
```

## Technology Stack

### Frontend (Renderer Process)
- **Framework**: React 18.3.1 dengan TypeScript 5.9.3
- **Build Tool**: Vite 6.0.5
- **Router**: React Router DOM 6.28.0
- **Styling**: Tailwind CSS 3.4.17 + tailwindcss-animate
- **UI Components**: shadcn/ui + Radix UI primitives
- **Data Fetching**: TanStack React Query 5.90.21
- **Charts**: Recharts 3.7.0
- **Icons**: Lucide React

### Backend (Main Process)
- **Runtime**: Electron 33.4.11 (Node.js)
- **Database**: better-sqlite3 12.6.2 (SQLite dengan WAL mode)
- **API Server**: Express.js 5.2.1 + CORS
- **Authentication**: bcryptjs + jsonwebtoken
- **Excel**: exceljs 4.4.0 + xlsx 0.18.5
- **AI/LLM**: node-llama-cpp 3.16.2 (local inference)
- **Barcode**: @ericblade/quagga2 + jsbarcode

### Build & Deployment
- **Packager**: electron-builder 25.1.8
- **Output**: Windows executable (portable & directory)
- **Product Name**: "Toko Bersama"
- **App ID**: com.poscashier.app

## Arsitektur Aplikasi

### 1. Hybrid Desktop/Web Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)                        │
│  ├── Database (better-sqlite3)                          │
│  ├── REST API Server (Express) - Port 3001              │
│  ├── Printer Service                                    │
│  └── AI Service (node-llama-cpp)                        │
├─────────────────────────────────────────────────────────┤
│  Electron Renderer Process (React SPA)                  │
│  └── Vite Dev Server (Port 5173) / dist-renderer        │
├─────────────────────────────────────────────────────────┤
│  External Access (Local Network)                        │
│  ├── Price Checker PWA (Static HTML)                    │
│  └── Mobile Admin PWA                                   │
└─────────────────────────────────────────────────────────┘
```

### 2. Database Architecture
- **Engine**: SQLite 3 dengan WAL (Write-Ahead Logging) mode
- **Path**: `{userData}/pos-cashier.db`
- **Concurrency**: Electron dan API server mengakses database yang sama
- **Pragmas**:
  - `journal_mode = WAL`
  - `synchronous = NORMAL`
  - `cache_size = -64000` (64MB)
  - `foreign_keys = ON`
  - `mmap_size` dinamis (128MB/256MB berdasarkan RAM)

### 3. Security Model
- **Context Isolation**: Aktif (`contextIsolation: true`)
- **Node Integration**: Nonaktif (`nodeIntegration: false`)
- **IPC**: Semua komunikasi via `contextBridge` di `preload.js`
- **Global API**: `window.api` berisi semua method yang tersedia

### 4. Worker Threads
Untuk operasi berat yang tidak memblokir UI:
- **bulk-upsert-worker.js**: Import produk dari Excel dalam batch
- **report-worker.js**: Generate comprehensive report

## Konvensi Kode

### Struktur File
```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (button, card, dialog, dll)
│   └── charts/          # Chart components
├── pages/               # Route-level page components
├── contexts/            # React Context (Auth, Theme)
├── lib/                 # Utilities & types
│   ├── types.ts         # Shared TypeScript types
│   ├── utils.ts         # Helper functions (cn, format)
│   └── queries.ts       # React Query hooks
├── types/
│   └── api.d.ts         # Window API type definitions
└── index.css            # Global styles + Tailwind directives
```

### Penamaan
- **Components**: PascalCase (`ProductCard.tsx`, `PaymentModal.tsx`)
- **Hooks**: camelCase dengan prefix `use` (`useAuth()`, `useSettings()`)
- **Utilities**: camelCase (`cn()`, `formatCurrency()`)
- **Types/Interfaces**: PascalCase (`UserRole`, `Transaction`)
- **Database Tables**: lowercase with underscores (`stock_trail`, `payment_history`)

### Path Aliases
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
```
Aliased to: `./src/*`

### Styling Guidelines
- Gunakan Tailwind CSS utility classes
- Warna primary menggunakan CSS variables (theme rose/pink default)
- Support multiple themes: `blue`, `green`, `purple`, `orange`, `red`
- Dark mode support via `dark` class

### Bahasa
- **UI/UX**: Bahasa Indonesia
- **Kode**: Bahasa Inggris (variables, functions, types)
- **Komentar**: Bahasa Indonesia
- **Log/Console**: Bahasa Indonesia

## Command yang Tersedia

### Development
```bash
cd pos-app
npm run dev                    # Jalankan Vite + Electron secara bersamaan
```

### Build
```bash
npm run build                  # Build renderer + package dengan electron-builder
npm run build:renderer         # Build Vite saja (output: dist-renderer/)
npm run build:dir              # Build tanpa packaging (untuk testing)
npm run build:portable         # Build versi portable
npm run build:all              # Build lengkap dengan custom scripts
```

### Utilities
```bash
npm run fix:icon               # Fix icon executable Windows
npm run postinstall            # Rebuild native modules untuk Electron
```

## Testing

Tidak ada test suite yang terkonfigurasi saat ini. Testing dilakukan secara manual dengan scenario:
1. **Cashier Flow**: Transaksi lengkap dari scan barcode sampai print struk
2. **Stock Management**: Update stok, audit trail, low stock alert
3. **Report Generation**: Generate laporan harian/bulanan dengan berbagai filter
4. **Excel Import/Export**: Import produk bulk, export data transaksi
5. **AI Insight**: Generate insight dengan local model atau API

## Data & Database

### Skema Utama

**users**: Manajemen pengguna dengan role (admin, supervisor, cashier)
**products**: Katalog produk dengan barcode, harga, stok
**categories**: Kategori produk
**transactions**: Header transaksi penjualan
**transaction_items**: Detail item per transaksi
**payment_history**: Riwayat pembayaran cicilan/hutang
**stock_trail**: Audit trail perubahan stok (event-based)
**settings**: Konfigurasi aplikasi (key-value store)

### Tipe Data Penting

```typescript
type UserRole = 'admin' | 'supervisor' | 'cashier';
type PaymentStatus = 'lunas' | 'hutang' | 'cicilan' | 'pending';
type StockEventType = 'initial' | 'sale' | 'restock' | 'adjustment' | 'void' | 'return';
```

### Timezone Handling
- Database menyimpan datetime dalam UTC/ISO string
- Logic reporting menggunakan `timezone_offset` dari settings
- Fungsi `getLocalDayRangeUTC()` menghitung batas hari berdasarkan offset

## API Endpoints (REST)

Base URL: `http://localhost:3001`

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/health` | GET | Status server |
| `/api/auth/login` | POST | Autentikasi user |
| `/api/products` | GET/POST | List/tambah produk |
| `/api/products/:id` | PUT/DELETE | Update/hapus produk |
| `/api/transactions` | GET/POST | List/tambah transaksi |
| `/api/transactions/:id/void` | POST | Void transaksi |
| `/api/debts` | GET | Daftar hutang outstanding |
| `/api/dashboard/stats` | GET | Statistik dashboard |

## Fitur Khusus

### 1. AI Business Insight
- **Local Mode**: Menggunakan model GGUF (Llama) via node-llama-cpp
- **API Mode**: Integrasi dengan Groq, OpenRouter, atau custom endpoint
- **Auto-generate**: Insight di-generate otomatis per minggu/bulan/triwulan
- **Data Source**: Aggregated sales, profit, stock data

### 2. Barcode System
- Generate barcode otomatis (12 digit padded)
- Support barcode scanner via kamera (Quagga2) atau USB scanner
- Barcode preview dan batch print

### 3. Printing
- Thermal printer support (ESC/POS commands)
- Customizable receipt templates
- Cash drawer control
- Plain text report printing

### 4. Excel Integration
- Import produk dari Excel (bulk upsert)
- Export data transaksi, laporan
- Template export untuk editing massal

### 5. Cloudflare Tunnel
- Script: `start_tunnel.bat`
- Expose API server ke internet dengan tunnel aman
- Auto-install service support

## Optimasi Performance

### Low-Spec Optimizations
- V8 heap size: 256MB (RAM < 4GB) atau 512MB (RAM >= 4GB)
- Disable GPU compositing & software rasterizer
- Disk cache dibatasi 10MB
- Background throttling disabled
- Web workers untuk operasi berat

### Caching Strategy
- **Statement Cache**: Prepared SQL statements di-cache
- **Settings Cache**: Settings di-cache di memory
- **Dashboard Cache**: Cache statistik dashboard (TTL)
- **API Cache**: Tiered cache (5s/30s/5min) untuk endpoint REST

## Keamanan

### Authentication
- JWT-based auth dengan expiry
- Master key untuk reset password
- Password hashing dengan bcrypt (10 rounds)
- Force password change untuk user baru

### Authorization
- Role-based access control (RBAC)
- Route protection di frontend
- IPC handler checks di backend

### Data Protection
- Database file di user data directory (terenkripsi OS-level)
- Backup otomatis ke direktori terpisah
- Audit trail untuk semua perubahan stok

## Deployment

### Windows Build
- **Target**: Windows 10/11 x64
- **Output**: 
  - `TOKO BERSAMA BARU/` (directory build)
  - `Toko Bersama-{version}-Portable.exe` (portable)
- **Icon**: `assets/tb_logo_1771832778678.png`

### Resources yang Di-bundle
- `cloudflared.exe` → `resources/cloudflare/`
- `mobile-admin-dist/` → PWA untuk mobile
- `price-checker/` → Static price checker

## Troubleshooting

### Database
- **WAL files**: `pos-cashier.db-shm` dan `pos-cashier.db-wal` adalah normal
- **Corruption**: Jalankan `dbIntegrityCheck` via settings
- **Vacuum**: Otomatis di-schedule, atau manual via Database page

### Printer
- **Thermal printer**: Pastikan driver Windows terinstall
- **USB printer**: Cek device name di Settings
- **Drawer**: Perintah ESC/POS `0x1B 0x70 0x00 0x19 0xFA`

### AI Model
- **Download**: Model GGUF (~4GB) didownload otomatis
- **Custom model**: Bisa browse file model lokal
- **VRAM**: Minimal 4GB VRAM untuk local inference

## Referensi Dokumentasi

- [docs/API_MAP.md](pos-app/docs/API_MAP.md) - Daftar lengkap API endpoints
- [docs/SCHEMA.sql](pos-app/docs/SCHEMA.sql) - Skema database lengkap
- [docs/CONTEXT.md](pos-app/docs/CONTEXT.md) - Arsitektur dan context
- [docs/*_ROADMAP.md](pos-app/docs/) - Roadmap per fitur

## Catatan Penting untuk AI Agent

1. **Jangan ubah interface IPC** tanpa update `preload.js` dan `api.d.ts`
2. **SQL queries** selalu gunakan prepared statements (cached)
3. **Transaction handling** gunakan `db.transaction()` untuk atomicity
4. **Worker threads** untuk operasi yang bisa > 1 detik
5. **Bahasa Indonesia** untuk semua user-facing text
6. **TypeScript strict mode OFF** - jangan terlalu ketat type checking
7. **Electron security** - jangan enable nodeIntegration
8. **Test manual** setelah perubahan database schema
