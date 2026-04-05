/**
 * bulk-upsert-worker.js
 * Worker Thread — menjalankan bulkUpsertProducts di thread terpisah
 * agar import Excel 500–5000 produk tidak membekukan UI.
 *
 * Penting: Worker ini membuka koneksi database SENDIRI dengan akses read-write.
 * better-sqlite3 aman dipakai di worker thread selama koneksinya tidak di-share
 * dengan thread lain.
 */
'use strict';

const { workerData, parentPort } = require('worker_threads');
const Database = require('better-sqlite3');

// ─── Open DB dengan pragmas optimal ─────────────────────────────────────────

function openDb(dbPath) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -32000');
    db.pragma('temp_store = MEMORY');
    db.pragma('foreign_keys = ON');
    return db;
}

// ─── Helper functions ────────────────────────────────────────────────────────

function run(db, sql, params = []) {
    return db.prepare(sql).run(...params);
}

function get(db, sql, params = []) {
    return db.prepare(sql).get(...params);
}

// ─── Bulk upsert logic (mirror dari database.js bulkUpsertProducts) ──────────

function bulkUpsert(db, products) {
    const results = { success: 0, failed: 0, errors: [] };

    // Pre-compute cost multiplier once (mirror getCostMultiplier)
    const settingsRow = get(db, "SELECT value FROM settings WHERE key = 'default_margin_percent'");
    const defaultMargin = parseFloat(settingsRow?.value || 10.5);
    const costMultiplier = 1 - (defaultMargin / 100);

    // Prepare statements upfront for performance
    const stmtGetCatByName = db.prepare('SELECT id FROM categories WHERE name = ?');
    const stmtInsertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const stmtGetByBarcode = db.prepare('SELECT id FROM products WHERE barcode = ?');
    const stmtGetStock = db.prepare('SELECT stock FROM products WHERE id = ?');
    const stmtUpdate = db.prepare(
        `UPDATE products SET name=?, price=?, cost=?, stock=stock+?, category_id=COALESCE(?,category_id), updated_at=datetime('now','localtime') WHERE id=?`
    );
    const stmtInsert = db.prepare(
        `INSERT INTO products(barcode,name,price,cost,stock,category_id,unit,margin_mode) VALUES(?,?,?,?,?,?,?,?)`
    );
    const stmtTrail = db.prepare(
        `INSERT INTO stock_trail(product_id,product_name,event_type,quantity_before,quantity_change,quantity_after,user_id,user_name,notes,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,datetime('now','localtime'))`
    );

    const transaction = db.transaction((items) => {
        for (const p of items) {
            try {
                const upperName = p.name ? p.name.toUpperCase() : 'UNKNOWN';

                // Resolve cost: use provided or auto from margin
                const price = p.price || 0;
                const cost = (p.cost && p.cost > 0) ? p.cost : Math.round(price * costMultiplier);

                // Category resolution
                let catId = null;
                if (p.category_name) {
                    const cat = stmtGetCatByName.get(p.category_name.toUpperCase());
                    if (cat) {
                        catId = cat.id;
                    } else {
                        const newCat = stmtInsertCat.run(p.category_name.toUpperCase());
                        catId = newCat.lastInsertRowid;
                    }
                }

                const existing = stmtGetByBarcode.get(p.barcode);
                if (existing) {
                    const oldStock = stmtGetStock.get(existing.id)?.stock || 0;
                    stmtUpdate.run(upperName, price, cost, p.stock || 0, catId, existing.id);
                    const stockAdded = p.stock || 0;
                    if (stockAdded !== 0) {
                        stmtTrail.run(
                            existing.id, upperName, 'restock',
                            oldStock, stockAdded, oldStock + stockAdded,
                            null, 'Import Excel', 'Import/update massal via Excel'
                        );
                    }
                } else {
                    const insertInfo = stmtInsert.run(
                        p.barcode, upperName, price, cost, p.stock || 0,
                        catId, p.unit || 'pcs', 'manual'
                    );
                    const newId = insertInfo.lastInsertRowid;
                    if ((p.stock || 0) > 0) {
                        stmtTrail.run(
                            newId, upperName, 'initial',
                            0, p.stock || 0, p.stock || 0,
                            null, 'Import Excel', 'Stok awal via import Excel'
                        );
                    }
                }
                results.success++;

                // Report progress every 50 items
                if (results.success % 50 === 0) {
                    parentPort.postMessage({ type: 'progress', processed: results.success + results.failed, total: items.length });
                }
            } catch (err) {
                results.failed++;
                results.errors.push(`${p.name}: ${err.message}`);
            }
        }
    });

    try {
        transaction(products);
    } catch (err) {
        console.error('[BulkUpsertWorker] Transaction failed:', err.message);
    }

    return results;
}

// ─── Main execution ──────────────────────────────────────────────────────────

const { dbPath, products } = workerData;

try {
    const db = openDb(dbPath);
    const results = bulkUpsert(db, products);
    db.close();
    parentPort.postMessage({ type: 'done', success: true, results });
} catch (err) {
    parentPort.postMessage({ type: 'done', success: false, error: err.message });
}
