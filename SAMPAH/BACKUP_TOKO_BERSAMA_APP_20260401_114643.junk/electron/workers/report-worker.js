/**
 * report-worker.js
 * Worker Thread — menjalankan getComprehensiveReport di thread terpisah
 * agar main thread / UI tidak freeze saat generate laporan besar.
 *
 * Penting: better-sqlite3 TIDAK boleh share koneksi antar thread.
 * Worker ini membuka koneksi database SENDIRI (read-only safe dengan WAL mode).
 */
'use strict';

const { workerData, parentPort } = require('worker_threads');
const Database = require('better-sqlite3');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

function openDb(dbPath) {
    const db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = -32000');   // 32MB cache di worker
    db.pragma('temp_store = MEMORY');
    return db;
}

function all(db, sql, params = []) {
    return db.prepare(sql).all(...params);
}

function get(db, sql, params = []) {
    return db.prepare(sql).get(...params);
}

// ─── Timezone helper (replicated from database.js) ───────────────────────────

function getLocalDayRangeUTC(db, dateObj = new Date()) {
    let offsetHours = 7; // WIB default
    try {
        const row = get(db, "SELECT value FROM settings WHERE key = 'timezone_offset'");
        if (row && row.value && row.value !== 'auto') {
            offsetHours = parseFloat(row.value);
        } else {
            offsetHours = -(new Date().getTimezoneOffset() / 60);
        }
    } catch (_) { }

    const utcNow = dateObj.getTime();
    const localNow = new Date(utcNow + (offsetHours * 3600000));
    const year = localNow.getUTCFullYear();
    const month = localNow.getUTCMonth();
    const day = localNow.getUTCDate();

    const startLocalTimestamp = Date.UTC(year, month, day, 0, 0, 0, 0);
    const endLocalTimestamp = Date.UTC(year, month, day + 1, 0, 0, 0, 0);

    const startUTC = new Date(startLocalTimestamp - (offsetHours * 3600000));
    const endUTC = new Date(endLocalTimestamp - (offsetHours * 3600000));

    const toSql = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

    return { start: toSql(startUTC), end: toSql(endUTC) };
}

function toUtcRange(db, dateFrom, dateTo) {
    const startRange = getLocalDayRangeUTC(db, new Date(dateFrom));
    const endRange = getLocalDayRangeUTC(db, new Date(dateTo));
    return { startUTC: startRange.start, endUTC: endRange.end };
}

// ─── Report sub-functions (mirror of database.js) ────────────────────────────

function getAuthoritativeStats(db, startUTC, endUTC) {
    const stats = get(db, `
        SELECT 
            COUNT(t.id) as count, 
            COALESCE(SUM(t.total - t.tax_amount), 0) as net_revenue,
            COALESCE(SUM(t.total - t.tax_amount - IFNULL(item_costs.total_cost, 0)), 0) as profit,
            COALESCE(SUM(IFNULL(item_costs.total_cost, 0)), 0) as total_cost
        FROM transactions t
        LEFT JOIN (
            SELECT transaction_id, SUM(quantity * original_cost) as total_cost
            FROM transaction_items GROUP BY transaction_id
        ) item_costs ON t.id = item_costs.transaction_id
        WHERE t.status = 'completed' AND t.created_at BETWEEN ? AND ?
    `, [startUTC, endUTC]);

    if (!stats) return { count: 0, total: 0, revenue: 0, cost: 0, profit: 0 };
    return {
        count: stats.count || 0,
        total: stats.net_revenue || 0,
        revenue: stats.net_revenue || 0,
        cost: stats.total_cost || 0,
        profit: stats.profit || 0
    };
}

function getSalesReport(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);

    const stats = getAuthoritativeStats(db, startUTC, endUTC);
    const summary = {
        count: stats.count,
        revenue: stats.revenue,
        average: stats.count > 0 ? stats.revenue / stats.count : 0
    };

    const paymentBreakdown = all(db,
        `SELECT payment_method, COUNT(*) as count, SUM(total) as total
         FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
         GROUP BY payment_method`,
        [startUTC, endUTC]
    );

    const dailyBreakdown = all(db,
        `SELECT date(created_at, 'localtime') as date, COUNT(*) as count, SUM(total) as total
         FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
         GROUP BY date(created_at, 'localtime') ORDER BY date(created_at, 'localtime')`,
        [startUTC, endUTC]
    );

    const topProducts = all(db,
        `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total
         FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
         GROUP BY ti.product_name ORDER BY qty DESC LIMIT 5`,
        [startUTC, endUTC]
    );

    const hourlyBreakdown = getHourlySalesPattern(db, dateFrom, dateTo);

    return { summary, paymentBreakdown, dailyBreakdown, topProducts, hourlyBreakdown };
}

function getProfitReport(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);

    const products = all(db,
        `SELECT ti.product_name,
            SUM(ti.quantity) as qty,
            SUM(ti.subtotal) as revenue,
            SUM(ti.quantity * ti.original_cost) as total_cost,
            SUM(ti.subtotal) - SUM(ti.quantity * ti.original_cost) as profit
         FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
         GROUP BY ti.product_name ORDER BY profit DESC`,
        [startUTC, endUTC]
    );

    const authoritative = getAuthoritativeStats(db, startUTC, endUTC);
    const totals = products.reduce((acc, p) => ({
        revenue: acc.revenue + p.revenue,
        cost: acc.cost + p.total_cost,
        profit: acc.profit + p.profit
    }), { revenue: 0, cost: 0, profit: 0 });

    const finalTotals = {
        revenue: authoritative.revenue,
        cost: totals.cost,
        profit: authoritative.profit,
        margin: authoritative.revenue > 0 ? (authoritative.profit / authoritative.revenue) * 100 : 0
    };

    return { products, totals: finalTotals };
}

function getHourlySalesPattern(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);
    const rows = all(db,
        `SELECT CAST(strftime('%H', created_at, 'localtime') AS INTEGER) as hour, COUNT(*) as count, SUM(total) as total
         FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
         GROUP BY hour ORDER BY hour`,
        [startUTC, endUTC]
    );
    const result = [];
    for (let h = 0; h < 24; h++) {
        const row = rows.find(r => r.hour === h);
        result.push(row || { hour: h, count: 0, total: 0 });
    }
    return result;
}

function getBottomProducts(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);
    return all(db,
        `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total,
            SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
         FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
         LEFT JOIN products p ON ti.product_id = p.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
         GROUP BY ti.product_name ORDER BY qty ASC LIMIT 5`,
        [startUTC, endUTC]
    );
}

function getTransactionLog(db, dateFrom, dateTo, limitSize = 500) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);
    const transactions = all(db,
        `SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
         ORDER BY t.created_at DESC LIMIT ?`,
        [startUTC, endUTC, limitSize]
    );
    if (transactions.length === 0) return [];

    const txIds = transactions.map(t => t.id);
    const placeholders = txIds.map(() => '?').join(',');
    const allItems = all(db, `SELECT * FROM transaction_items WHERE transaction_id IN (${placeholders})`, txIds);

    const itemsMap = {};
    allItems.forEach(item => {
        if (!itemsMap[item.transaction_id]) itemsMap[item.transaction_id] = [];
        itemsMap[item.transaction_id].push(item);
    });
    transactions.forEach(tx => { tx.items = itemsMap[tx.id] || []; });
    return transactions;
}

function getStockAuditLogSummary(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);
    return all(db,
        `SELECT product_id, product_name, action_type, old_stock, new_stock, (new_stock - old_stock) as change,
            user_name, notes, created_at
         FROM stock_audit_log
         WHERE created_at >= ? AND created_at < ?
         ORDER BY created_at DESC LIMIT 500`,
        [startUTC, endUTC]
    );
}

function getStockTrailAll(db, dateFrom, dateTo) {
    const { startUTC, endUTC } = toUtcRange(db, dateFrom, dateTo);
    return all(db,
        `SELECT st.*, p.name as current_product_name
         FROM stock_trail st LEFT JOIN products p ON st.product_id = p.id
         WHERE st.created_at >= ? AND st.created_at < ?
         ORDER BY st.created_at DESC LIMIT 2000`,
        [startUTC, endUTC]
    );
}

// ─── Main execution ──────────────────────────────────────────────────────────

const { dbPath, dateFrom, dateTo } = workerData;

try {
    const db = openDb(dbPath);

    const sales = getSalesReport(db, dateFrom, dateTo);
    const profit = getProfitReport(db, dateFrom, dateTo);
    const hourly = sales?.hourlyBreakdown || getHourlySalesPattern(db, dateFrom, dateTo);
    const bottomProducts = getBottomProducts(db, dateFrom, dateTo);
    const transactionLog = getTransactionLog(db, dateFrom, dateTo, 500);
    const stockAudit = getStockAuditLogSummary(db, dateFrom, dateTo);
    const stockTrail = getStockTrailAll(db, dateFrom, dateTo);

    db.close();

    parentPort.postMessage({
        success: true,
        result: { sales, profit, hourly, bottomProducts, transactionLog, stockAudit, stockTrail }
    });
} catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
}
