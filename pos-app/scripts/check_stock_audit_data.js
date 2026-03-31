const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Checking "stock_audit_log" data...');
    const logs = db.prepare('SELECT * FROM stock_audit_log LIMIT 5').all();
    console.log('Logs:', logs);

    const nullUserNames = db.prepare('SELECT COUNT(*) as c FROM stock_audit_log WHERE user_name IS NULL').get();
    console.log('Rows with NULL user_name:', nullUserNames.c);

} catch (err) {
    console.error(err);
} finally {
    db.close();
}
