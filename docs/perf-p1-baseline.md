# Baseline Performa P1 (Phase 0)

Tanggal: 2026-04-06  
Scope P1:
1. HTTP keep-alive di API server (`electron/api-server.js`)
2. N+1 validasi produk saat checkout (`src/pages/CashierPage.tsx`)

## Ringkasan Eksekusi Phase 0

Phase 0 berhasil dieksekusi **parsial** di environment CLI ini:
- ✅ Baseline mikro untuk bottleneck P1-B (N+1 vs batch query) berhasil diukur.
- ⚠️ Baseline end-to-end API HTTP (p95 multi-device) belum bisa diambil stabil karena Electron app tidak dapat dijalankan konsisten dalam sandbox CLI (GUI/runtime constraint).

Raw output benchmark tersimpan di:
- `docs/perf-p1-baseline.raw.json`
- `docs/perf-p1-baseline.api-checkout.raw.json`

Script benchmark yang digunakan:
- `scripts/p1-validation-benchmark.js`

## Hasil Baseline Mikro (P1-B)

Setup:
- SQLite `better-sqlite3`
- Seed produk: 20.000
- Iterasi: 25 run per skenario
- Perbandingan:
  - N+1: query `SELECT ... WHERE id=?` per item cart
  - Batch: query tunggal `SELECT ... WHERE id IN (...)`

| Cart Size | N+1 Avg (ms) | Batch Avg (ms) | Improvement Avg |
|---|---:|---:|---:|
| 5 | 0.0192 | 0.0847 | -341.15% |
| 20 | 0.0659 | 0.0821 | -24.58% |
| 50 | 0.1763 | 0.0894 | +49.29% |
| 100 | 0.3567 | 0.1556 | +56.38% |

Interpretasi:
- Untuk cart kecil (5-20 item), N+1 masih terlihat cepat karena overhead query batch + mapping.
- Untuk cart menengah-besar (>=50 item), batch jauh lebih efisien (sekitar 49%-56% lebih cepat pada rata-rata).
- Ini menguatkan prioritas P1-B untuk skenario beban nyata saat item transaksi banyak.

## Gap Baseline yang Masih Perlu Diambil di Mesin Lokal

Status terbaru (backfill):
1. ✅ p95 endpoint API untuk 1 vs 5 client sudah diambil pada DB benchmark terisolasi.
2. ⚠️ Checkout dari UI renderer belum diukur langsung; yang tersedia adalah benchmark jalur backend transaksi (proxy inti checkout).
3. ✅ CPU process benchmark (indikatif) direkam saat load test API.

### Backfill Metrik API (Isolated Benchmark)

Sumber: `docs/perf-p1-baseline.api-checkout.raw.json`  
Catatan: backfill ini diambil **setelah** implementasi P1 berjalan, jadi bukan baseline murni pre-change.

| Endpoint | Mode | Avg (ms) | p95 (ms) | Status |
|---|---|---:|---:|---|
| `/api/products` | 1 client | 3.746 | 4.746 | 200 x120 |
| `/api/products` | 5 client | 8.603 | 13.562 | 200 x200 |
| `/api/dashboard/stats` | 1 client | 1.092 | 3.491 | 200 x120 |
| `/api/dashboard/stats` | 5 client | 3.706 | 6.723 | 200 x200 |
| `/api/transactions?limit=50` | 1 client | 1.543 | 2.932 | 200 x120 |
| `/api/transactions?limit=50` | 5 client | 5.728 | 8.825 | 200 x200 |

### Backfill Metrik Checkout (Backend Proxy)

| Cart Size | Avg (ms) | p95 (ms) | Rounds |
|---|---:|---:|---:|
| 5 | 0.535 | 0.772 | 20 |
| 20 | 1.519 | 2.050 | 20 |
| 50 | 3.743 | 12.038 | 20 |

## Acceptance Target (Tetap untuk Phase 1-2)

1. p95 API turun minimal 20% (multi-device 5 client) setelah perbaikan keep-alive.
2. Checkout 20+ item turun minimal 40% setelah migrasi validasi batch.
3. Tidak ada regresi fungsional pada cashier flow.

## Catatan Kualitas

- Baseline mikro ini valid sebagai guardrail untuk keputusan desain P1-B (N+1 -> batch).
- Baseline API/load dan checkout backend sudah terisi lewat benchmark terisolasi.
- Untuk sign-off operasional final, masih direkomendasikan 1 pass manual di UI kasir nyata (printer/scanner/flow user) karena metrik UI renderer belum direkam langsung.

## Checklist P0 (Update)

1. Artefak benchmark terdokumentasi: ✅
2. Data baseline mikro N+1 vs batch: ✅
3. p95 endpoint API 1 vs 5 client: ✅ (isolated benchmark)
4. Checkout flow metric: ⚠️ (backend proxy tersedia, UI renderer langsung belum)
5. CPU indikator saat load: ✅
