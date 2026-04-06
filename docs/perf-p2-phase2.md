# Phase P2 Checkpoint - API Cache Stabilization

Tanggal: 2026-04-06  
Status: Selesai

## Perubahan

File: `electron/api-server.js`

1. Menambahkan batas ukuran cache:
- `MAX_API_CACHE_SIZE = 300`

2. `getCached` sekarang refresh urutan entry saat hit:
- Map diperlakukan sebagai LRU sederhana.

3. `setCache` sekarang melakukan evict entry tertua jika ukuran melebihi limit.

4. Menambahkan `purgeExpiredApiCache()` dan housekeeping interval 1 menit:
- Interval di-`unref()` agar tidak menahan lifecycle proses.

5. Merapikan interval cleanup rate limiter dengan `unref()`.

## Tujuan

- Menjaga memori API cache stabil pada request pattern bervariasi.
- Menghindari pertumbuhan `Map` tanpa batas saat key cache bertambah.
- Mengurangi overhead idle timer pada lifecycle app/server.

## Verifikasi

- `node --check electron/api-server.js` -> OK
- Pencarian marker perubahan:
  - `MAX_API_CACHE_SIZE`
  - `purgeExpiredApiCache`
  - `rateLimitCleanup.unref()`
