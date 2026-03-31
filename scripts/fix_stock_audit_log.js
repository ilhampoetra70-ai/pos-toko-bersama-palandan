const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    process.exit(1);
}

const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Checking "stock_audit_log" table schema...');
    const tableInfo = db.pragma('table_info(stock_audit_log)');
    const userNameColumn = tableInfo.find(c => c.name === 'user_name');

    if (!userNameColumn) {
        console.log('"user_name" column missing. Adding it...');
        db.prepare('ALTER TABLE stock_audit_log ADD COLUMN user_name TEXT').run();
        console.log('"user_name" column added successfully.');
    } else {
        console.log('"user_name" column already exists.');
    }

} catch (err) {
    console.error('Error executing script:', err);
} finally {
    db.close();
}
