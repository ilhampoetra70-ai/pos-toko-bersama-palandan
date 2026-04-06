# Review Implementasi Performa P2

Tanggal review: 2026-04-06  
Reviewer: Codex (implementer)  
Tujuan: dokumen audit implementasi P2 oleh agent lain.

## Scope P2

P2 difokuskan pada stabilitas performa jangka menengah:
1. Mengurangi polling yang tidak perlu di renderer.
2. Menstabilkan pertumbuhan cache prepared statement di main/database.
3. Menstabilkan pertumbuhan cache response API dan housekeeping timer.

## Ringkasan Eksekusi (Chunk Phases)

### Phase P2-1
- Dashboard polling dibuat conditional (hanya saat window visible).
- Statement cache DB diberi batas + LRU sederhana.
- Referensi catatan phase:
  - `docs/perf-p2-phase1.md`

### Phase P2-2
- API response cache diberi batas ukuran.
- Cache hit refresh insertion order (LRU-like).
- Eviction entry tertua saat melewati batas.
- Purge expired cache periodik (1 menit).
- Cleanup timer rate limiter di-`unref()`.
- Referensi catatan phase:
  - `docs/perf-p2-phase2.md`

### Phase P2-3
- Validation gate:
  - `node --check electron/database.js` lulus.
  - `node --check electron/api-server.js` lulus.
  - `npm run build:renderer` lulus.
- Ringkasan completion:
  - `docs/perf-p2-complete.md`

## Bukti Perubahan Kode

1. Polling dashboard conditional visibility:
- [queries.ts](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\src\lib\queries.ts#L242)

2. Statement cache limit + LRU sederhana:
- [database.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\database.js#L14)
- [database.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\database.js#L17)

3. API cache limit + eviction + purge:
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L29)
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L35)
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L46)
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L60)
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L132)
- [api-server.js](D:\Ilham\Documents\Proyek\TOKO BERSAMA APP\electron\api-server.js#L179)

## Manfaat yang Diharapkan

1. Pengurangan beban request periodik saat app tidak aktif di foreground.
2. Penggunaan memori lebih stabil untuk sesi aplikasi panjang.
3. Risiko degradasi gradual karena cache map bertumbuh tanpa batas berkurang.

## Verifikasi yang Sudah Dilakukan

1. Build renderer sukses setelah perubahan P2.
2. Syntax check backend utama yang diubah sukses.
3. Marker perubahan terkonfirmasi via pencarian kode:
   - `MAX_STMT_CACHE_SIZE`
   - `MAX_API_CACHE_SIZE`
   - `purgeExpiredApiCache`
   - `refetchIntervalInBackground: false`

## Risiko & Tradeoff

1. Data dashboard bisa sedikit lebih stale saat user kembali dari background (tradeoff sengaja untuk efisiensi).
2. Batas cache (`500` statement, `300` API cache) bersifat tuning awal, bisa diubah berdasar profiling produksi.
3. Belum ada soak test otomatis jangka panjang di dokumen ini.

## Checklist Audit Lanjutan (Disarankan)

1. Jalankan soak test 2-4 jam, monitor memori process utama sebelum/sesudah P2.
2. Validasi UX dashboard saat app minimize/restore (pastikan refresh tetap expected).
3. Cek endpoint API high-traffic tetap konsisten (tanpa false cache/stale berlebihan).
4. Jika perlu, tuning:
   - `MAX_STMT_CACHE_SIZE`
   - `MAX_API_CACHE_SIZE`
   - interval purge cache.

## Kesimpulan

Implementasi P2 selesai sesuai scope yang disepakati, bersifat low-risk, dan tidak menyentuh skema database maupun kontrak API utama.
