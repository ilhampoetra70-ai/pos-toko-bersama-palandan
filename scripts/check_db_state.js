const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Assuming the default path from database.js logic
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'pos-cashier', 'pos-cashier.db');
console.log('Checking database at:', dbPath);

try {
    const db = new Database(dbPath);
    const users = db.prepare('SELECT id, username, name FROM users').all();
    console.log('Current Users:');
    console.table(users);

    const stockAuditCols = db.prepare("PRAGMA table_info(stock_audit_log)").all();
    console.log('stock_audit_log columns:');
    console.table(stockAuditCols);

    db.close();
} catch (err) {
    console.error('Error:', err.message);
}
