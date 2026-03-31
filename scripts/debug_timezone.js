const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Path to database
const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

console.log('Database Path:', dbPath);
const db = new Database(dbPath, { readonly: true });

// 1. Check SQLite Time
const timeCheck = db.prepare("SELECT datetime('now') as utc, datetime('now', 'localtime') as local").get();
console.log('\n--- SQLite Time ---');
console.log('UTC:', timeCheck.utc);
console.log('Local:', timeCheck.local);

// 2. Check Node.js Time
function getLocalDateString(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - offset)).toISOString().slice(0, 10);
    return localISOTime;
}
console.log('\n--- Node.js Time ---');
console.log('Current Date:', new Date().toString());
console.log('getLocalDateString:', getLocalDateString());

// 3. Check Transactions
console.log('\n--- Recent Transactions ---');
const recent = db.prepare(`
    SELECT id, total, created_at, 
           datetime(created_at, 'localtime') as created_at_local,
           date(created_at, 'localtime') as date_local
    FROM transactions 
    ORDER BY id DESC LIMIT 5
`).all();

console.table(recent);

// 4. Simulate Dashboard Query with UTC Range
function getLocalDayRangeUTC(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    const startLocal = new Date(year, month, day, 0, 0, 0, 0);
    const endLocal = new Date(year, month, day + 1, 0, 0, 0, 0);

    const toSql = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

    return {
        start: toSql(startLocal),
        end: toSql(endLocal)
    };
}

const range = getLocalDayRangeUTC(new Date());
console.log('\n--- Dashboard UTC Range Check ---');
console.log('Range Start (UTC):', range.start);
console.log('Range End (UTC):', range.end);

const query = `
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
    FROM transactions 
    WHERE status = 'completed' 
    AND created_at >= ? AND created_at < ?
`;
const result = db.prepare(query).get(range.start, range.end);
console.log('Result:', result);
