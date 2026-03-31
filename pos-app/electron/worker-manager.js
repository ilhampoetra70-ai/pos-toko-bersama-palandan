/**
 * worker-manager.js
 * Abstraksi untuk menjalankan Worker Threads dari main.js.
 *
 * Menyediakan dua fungsi:
 *  - runReportWorker(dbPath, dateFrom, dateTo) → Promise<result>
 *  - runBulkUpsertWorker(dbPath, products, onProgress) → Promise<{success, results}>
 */
'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Jalankan getComprehensiveReport di worker thread terpisah.
 * @param {string} dbPath - Path absolut ke file database SQLite
 * @param {string} dateFrom - Tanggal mulai (YYYY-MM-DD)
 * @param {string} dateTo   - Tanggal akhir (YYYY-MM-DD)
 * @returns {Promise<object>} - Hasil report atau null jika gagal
 */
function runReportWorker(dbPath, dateFrom, dateTo) {
    return new Promise((resolve, reject) => {
        const workerPath = path.join(__dirname, 'workers', 'report-worker.js');

        const worker = new Worker(workerPath, {
            workerData: { dbPath, dateFrom, dateTo }
        });

        worker.once('message', (msg) => {
            if (msg.success) {
                resolve(msg.result);
            } else {
                console.error('[ReportWorker] Worker error:', msg.error);
                resolve(null); // Kembalikan null agar caller bisa fallback ke sync
            }
        });

        worker.once('error', (err) => {
            console.error('[ReportWorker] Uncaught worker error:', err.message);
            resolve(null);
        });

        worker.once('exit', (code) => {
            if (code !== 0) {
                console.error(`[ReportWorker] Worker exited with code ${code}`);
            }
        });
    });
}

/**
 * Jalankan bulkUpsertProducts di worker thread terpisah.
 * @param {string} dbPath - Path absolut ke file database SQLite
 * @param {Array}  products - Array produk dari Excel import
 * @param {Function} [onProgress] - Callback (processed, total) untuk progress UI
 * @returns {Promise<{success: boolean, results: object}>}
 */
function runBulkUpsertWorker(dbPath, products, onProgress = null) {
    return new Promise((resolve) => {
        const workerPath = path.join(__dirname, 'workers', 'bulk-upsert-worker.js');

        const worker = new Worker(workerPath, {
            workerData: { dbPath, products }
        });

        worker.on('message', (msg) => {
            if (msg.type === 'progress' && onProgress) {
                onProgress(msg.processed, msg.total);
            } else if (msg.type === 'done') {
                resolve({ success: msg.success, results: msg.results, error: msg.error });
            }
        });

        worker.once('error', (err) => {
            console.error('[BulkUpsertWorker] Uncaught worker error:', err.message);
            resolve({ success: false, error: err.message });
        });

        worker.once('exit', (code) => {
            if (code !== 0) {
                console.error(`[BulkUpsertWorker] Worker exited with code ${code}`);
            }
        });
    });
}

module.exports = { runReportWorker, runBulkUpsertWorker };
