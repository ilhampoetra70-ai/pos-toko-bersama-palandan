const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Testing getStockAuditLogSummary...');
    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dateTo = new Date().toISOString().slice(0, 10);

    const query = `
            SELECT 
                product_id,
                product_name, 
                COUNT(*) as change_count, 
                SUM(difference) as total_change,
                GROUP_CONCAT(DISTINCT COALESCE(user_name, 'System')) as user_names,
                MIN(created_at) as first_change,
                MAX(created_at) as last_change
            FROM stock_audit_log
            WHERE date(created_at) >= ? AND date(created_at) <= ?
            GROUP BY product_id, product_name
            ORDER BY last_change DESC
        `;

    const results = db.prepare(query).all(dateFrom, dateTo);
    console.log('Results:', JSON.stringify(results, null, 2));

    if (results.length > 0) {
        const first = results[0];
        if (first.change_count !== undefined && first.total_change !== undefined && first.user_names !== undefined) {
            console.log('SUCCESS: Result structure matches expectations.');
        } else {
            console.error('FAILURE: Result structure missing fields.');
        }
    } else {
        console.log('No logs found in range, cannot verify structure but query ran successfully.');
    }

} catch (err) {
    console.error('Error executing script:', err);
} finally {
    db.close();
}
