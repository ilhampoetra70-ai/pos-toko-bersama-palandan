const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Adjust path to database
// Since we run this with node, we might not have 'electron' app.getPath available easily if not running via electron.
// But we can guess the path based on typical structure or relative to this script.
// The user's DB is likely at: C:\Users\HAMBA\AppData\Roaming\pos-cashier\pos-cashier.db
// Or we can try to find it relative to the project if it's in a dev environment.
// However, the `database.js` uses `app.getPath('userData')`.
// For a standalone script, we should probably look in the standard location.

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

console.log('Target Database Path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    console.log('Trying local development path...');
    // Fallback to local if meaningful, but likely it is in AppData
    process.exit(1);
}

const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Checking "users" table schema...');
    const tableInfo = db.pragma('table_info(users)');
    const activeColumn = tableInfo.find(c => c.name === 'active');

    if (!activeColumn) {
        console.log('"active" column missing. Adding it...');
        db.prepare('ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1').run();
        console.log('"active" column added successfully.');
    } else {
        console.log('"active" column already exists.');
    }

    console.log('Updating all users to be active...');
    const result = db.prepare('UPDATE users SET active = 1 WHERE active IS NULL OR active = 0').run();
    console.log(`Updated ${result.changes} users to active status.`);

    const users = db.prepare('SELECT id, username, active FROM users').all();
    console.log('Current Users Status:', users);

} catch (err) {
    console.error('Error executing script:', err);
} finally {
    db.close();
}
