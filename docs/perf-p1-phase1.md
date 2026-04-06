# Phase 1 Checkpoint - HTTP Keep-Alive

Tanggal: 2026-04-06  
Status: Selesai (code-level)

## Perubahan

- Menghapus middleware yang memaksa header `Connection: close` pada semua response.
- File yang diubah:
  - `electron/api-server.js` (sekitar baris 166)

## Alasan

Pemaksaan `Connection: close` membuat setiap request membuka koneksi baru. Ini menambah latency dan CPU saat request berulang dari banyak client.

## Verifikasi

- `rg` memastikan hardcode `Connection: close` sudah tidak ada.
- Module sanity check:
  - `node -e "require('./electron/api-server')"` -> berhasil (`api-server module ok`)

## Catatan Kualitas

- Verifikasi runtime end-to-end (p95 endpoint 1 vs 5 client) belum dijalankan di checkpoint ini karena membutuhkan app berjalan stabil selama sesi benchmark.
- Perubahan ini low-risk karena tidak mengubah kontrak endpoint maupun payload.
