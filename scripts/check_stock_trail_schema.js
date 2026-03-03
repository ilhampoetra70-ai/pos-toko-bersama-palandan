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
    console.log('Checking "stock_trail" table schema...');
    const tableInfo = db.pragma('table_info(stock_trail)');
    console.log('Columns:', tableInfo.map(c => c.name));

    const userNameCol = tableInfo.find(c => c.name === 'user_name');
    const userIdCol = tableInfo.find(c => c.name === 'user_id');
    const notesCol = tableInfo.find(c => c.name === 'notes');

    console.log('user_name exists:', !!userNameCol);
    console.log('user_id exists:', !!userIdCol);
    console.log('notes exists:', !!notesCol);

    // Also check if there's any data
    const count = db.prepare('SELECT COUNT(*) as c FROM stock_trail').get();
    console.log('Row count:', count.c);

    if (count.c > 0) {
        const sample = db.prepare('SELECT * FROM stock_trail LIMIT 1').get();
        console.log('Sample row:', sample);
    }

} catch (err) {
    console.error('Error executing script:', err);
} finally {
    db.close();
}
