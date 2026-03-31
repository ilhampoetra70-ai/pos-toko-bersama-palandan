const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

if (!fs.existsSync(dbPath)) {
    console.error('Database not found');
    process.exit(1);
}

const db = new Database(dbPath);
const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');

if (!user) {
    console.log('User admin tidak ditemukan.');
} else {
    const isDefault = bcrypt.compareSync('admin123', user.password_hash);
    if (isDefault) {
        console.log('Password is default: admin123');
    } else {
        console.log('Password is NOT default.');
    }
}
