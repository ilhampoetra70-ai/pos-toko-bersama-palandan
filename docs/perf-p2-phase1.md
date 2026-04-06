# Phase P2 Checkpoint - Polling & Statement Cache

Tanggal: 2026-04-06  
Status: Selesai

## Perubahan

1. Optimasi polling dashboard (`src/lib/queries.ts`)
- Polling `useDashboardStats` sekarang hanya aktif saat window visible.
- `refetchIntervalInBackground` diset `false`.
- `staleTime` diset 30 detik untuk menghindari refetch berlebihan.

2. Batasi pertumbuhan prepared statement cache (`electron/database.js`)
- Menambahkan `MAX_STMT_CACHE_SIZE = 500`.
- `cachedPrepare` sekarang berperilaku LRU sederhana:
  - hit: refresh urutan entry
  - miss: insert entry baru
  - saat melebihi batas: evict entry tertua

## Tujuan

- Menurunkan beban API/DB saat aplikasi idle atau tidak aktif di foreground.
- Menjaga footprint memori lebih stabil untuk sesi aplikasi panjang.

## Verifikasi

- `node --check electron/database.js` -> OK
- `npm run build:renderer` -> OK

## Catatan Risiko

- Perubahan polling berpotensi membuat dashboard update sedikit lebih lambat saat user kembali dari background (tradeoff yang disengaja untuk efisiensi).
- Batas cache statement bersifat konservatif (500) dan bisa dituning berdasarkan profiling real usage.
