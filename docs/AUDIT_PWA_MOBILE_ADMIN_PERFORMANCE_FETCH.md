# Audit Optimisasi Kinerja & Fetch Data
## Mobile PWA `mobile-admin-dist`

Tanggal audit: 2026-04-06  
Scope: `mobile-admin-dist` (runtime JS/CSS/HTML/SW), alur fetch laporan, dampak ke UX `reports-page`.

---

## Ringkasan Eksekutif

Masalah lambat di `div.page.reports-page div.report-section` terutama berasal dari kombinasi:

1. Render halaman laporan masih menunggu fetch awal dari bundle utama (`/dashboard/stats`) sebelum konten reports tampil.
2. Fetch laporan lanjutan (`/api/reports/advanced`) dipanggil berulang karena pola init/observer di patch runtime.
3. Endpoint `/reports/advanced` belum punya cache server-side, padahal query agregasinya cukup berat (grouping + join + top-k).
4. Chart dependency dari CDN dapat menambah latensi perceived loading.

Perbaikan cepat (hotfix) yang sudah diterapkan pada sesi ini menurunkan dampak UX:
- dedupe request + abort stale request,
- data list tampil dulu, chart render belakangan,
- harden loader Chart.js,
- bump cache SW + cache-busting script version.

---

## Baseline Teknis (Asset & Transfer)

Hasil ukur file `mobile-admin-dist`:

| Asset | Raw | Gzip |
|---|---:|---:|
| `assets/index-dIiPlqqO.js` | 324,738 B | 98,248 B |
| `assets/index-DbwTItRA.css` | 54,805 B | 10,564 B |
| `assets/index-srjh-ggs.css` | 53,183 B | 10,348 B |
| `assets/index--zcf7IKV.css` | 52,970 B | 10,312 B |
| `reports-fix.js` | 16,369 B | 4,634 B |
| Total (`.js/.css/.html/.json`) | 508,480 B | 136,421 B |

Catatan:
- `index.html` masih memuat Google Fonts eksternal.
- SW memakai strategi network-only untuk `/api/*`.

---

## Temuan Audit (Prioritas)

## P0

### 1) Render `reports-page` terblokir fetch awal dashboard
**Evidence**
- Bundle route `/reports` memanggil `t = await $()` sebelum konten laporan selesai dirender (di `mobile-admin-dist/assets/index-dIiPlqqO.js`).
- Fungsi `$()` fetch `/dashboard/stats` (bypass cache) dengan fallback.

**Dampak**
- User melihat loading lama sebelum `report-section` siap interaksi.
- Waktu first-meaningful-content laporan jadi tergantung API dashboard, bukan API laporan.

### 2) Request laporan bisa redundant (init berulang + observer)
**Evidence**
- `reports-fix.js` memanggil `init()` multi-attempt (`setTimeout` berulang) dan juga `MutationObserver` URL change.
- Sebelum hotfix, tidak ada dedupe/abort request.

**Dampak**
- Duplicate fetch ke `/api/reports/advanced`.
- Persaingan response (race) dan UI update tidak deterministik.

### 3) `/api/reports/advanced` tidak memiliki cache endpoint
**Evidence**
- `electron/api-server.js` endpoint `/reports/advanced` langsung panggil `db.getAdvancedReport(...)` tanpa `getCached/setCache`.
- `db.getAdvancedReport(...)` menjalankan beberapa query agregasi (`hourly`, `top_products`, `top_customers`) di `electron/database.js`.

**Dampak**
- Latensi tinggi saat period sering diganti.
- CPU/IO SQLite naik pada jam sibuk.

## P1

### 4) Chart.js dari CDN menambah variabilitas latency
**Evidence**
- `reports-fix.js` load script dari `https://cdn.jsdelivr.net/...`.

**Dampak**
- Jika koneksi CDN lambat/terblokir, UX grafik buruk.
- Sebelumnya bisa menahan data list (sebelum hotfix background render).

### 5) SW memaksa API selalu network (tanpa stale fallback)
**Evidence**
- `mobile-admin-dist/sw.js`: semua `/api` langsung `fetch(e.request)`.

**Dampak**
- Pada koneksi fluktuatif, reports terasa lambat walau data sebelumnya sebenarnya bisa dipakai sementara.

## P2

### 6) Technical debt: patch runtime di build output (`reports-fix.js`)
**Evidence**
- Logic override berjalan sebagai monkey patch di dist.

**Dampak**
- Sulit dipelihara, rawan conflict saat build hash berubah/flow router berubah.

### 7) Produksi menyimpan multiple CSS hasil build lama
**Evidence**
- Terdapat 3 file `index-*.css` di `mobile-admin-dist/assets`.

**Dampak**
- Bukan bottleneck utama runtime saat ini, namun menambah ukuran distribusi & kompleksitas release hygiene.

---

## Perubahan Hotfix Yang Sudah Diterapkan (Sesi Ini)

File terdampak:
- `mobile-admin-dist/reports-fix.js`
- `mobile-admin-dist/sw.js`
- `mobile-admin-dist/index.html`

Detail:
1. `reports-fix.js`
- tambah `AbortController` untuk membatalkan request lama,
- request dedupe (`start|end|days`) + guard request-id,
- render list/stat dulu, chart di background (non-blocking),
- single-flight loader Chart.js + fail-fast timeout,
- guard agar init/toggle tidak bind berulang.

2. `sw.js`
- `CACHE_NAME` bump ke `pos-admin-v102`.

3. `index.html`
- cache-busting `reports-fix.js?v=2026040601`.

Tujuan hotfix: mempercepat perceived load pada `report-section` tanpa mengubah kontrak API.

---

## Rencana Eksekusi (Chunk Phases)

## Phase 1 (Quick Win Stabilization) - 1 hari
**Goal**
- Hilangkan duplicate call dan blocking render yang paling terasa.

**Tasks**
1. Pertahankan hotfix dedupe + abort + background chart render.
2. Tambahkan telemetry sederhana (timestamp di client + server) untuk:
   - TTFB `/api/reports/advanced`
   - waktu render list
   - waktu render chart.
3. Verifikasi di 3 kondisi jaringan: WiFi normal, WiFi lambat, hotspot.

**Acceptance**
- Tidak ada request duplikat untuk period yang sama dalam 2 detik.
- List `top-products/top-customers` tampil < 1.2s pada LAN normal.

## Phase 2 (API Throughput & Caching) - 1-2 hari
**Goal**
- Turunkan latency backend untuk endpoint reports.

**Tasks**
1. Tambahkan server cache di `/reports/advanced` (TTL 10-30 detik, key: `start|end|timezone`).
2. Audit index SQLite untuk kolom grouping/filter yang dominan (`transactions(status, created_at)`, `transaction_items(transaction_id, product_name)` jika perlu).
3. Tambahkan short-circuit untuk range sama berulang dari user yang sama.

**Acceptance**
- P95 latency `/reports/advanced` turun minimal 30%.
- CPU spike backend saat pindah period berulang menurun signifikan.

## Phase 3 (Fetch Strategy PWA) - 1 hari
**Goal**
- Perceive app tetap cepat saat jaringan tidak stabil.

**Tasks**
1. Client cache untuk response reports (TTL pendek 15-30 detik) dengan stale-while-revalidate.
2. SW tetap network-first untuk API, namun fallback ke cached snapshot khusus read-only laporan.
3. Tampilkan badge `data dari cache` saat fallback aktif.

**Acceptance**
- Saat jaringan putus sesaat, halaman laporan tetap tampil dengan data terakhir + indikator stale.

## Phase 4 (Structural Cleanup) - 2-3 hari
**Goal**
- Kurangi technical debt dari patch runtime.

**Tasks**
1. Pindahkan logic `reports-fix.js` ke source utama (bukan patch dist).
2. Hapus dependency CDN Chart.js: bundle lokal agar deterministik.
3. Bersihkan aset build lama (`index-*.css` tidak terpakai) dari pipeline publish.

**Acceptance**
- `reports-fix.js` tidak lagi diperlukan sebagai patch terpisah.
- Build PWA lebih deterministik dan mudah diaudit.

---

## Risk & Guardrail

1. **Risk**: cache reports menampilkan data stale.
- Mitigasi: TTL pendek + indikator stale + tombol refresh manual.

2. **Risk**: perubahan endpoint memengaruhi dashboard/report konsistensi.
- Mitigasi: samakan util timezone + snapshot test hasil agregasi 7/30 hari.

3. **Risk**: perubahan SW menyebabkan update tidak langsung aktif.
- Mitigasi: versi cache selalu dibump + update banner paksa reload.

---

## Checklist Verifikasi Manual

1. Buka PWA -> masuk halaman laporan.
2. Catat waktu sampai:
- kartu summary muncul,
- list top products/customers muncul,
- chart muncul.
3. Klik period `7 Hari` <-> `30 Hari` cepat 5x:
- pastikan request lama dibatalkan,
- tidak ada flicker hasil lama menimpa hasil baru.
4. Simulasi jaringan lambat:
- list tetap muncul dulu,
- chart menyusul tanpa freeze UI.

---

## Rekomendasi Prioritas Implementasi

Urutan implementasi paling aman:
1. Phase 1 -> 2 (dampak terbesar, risiko rendah),
2. lanjut Phase 3 (resilience),
3. lalu Phase 4 (cleanup arsitektur).

