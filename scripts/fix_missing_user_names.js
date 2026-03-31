const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'pos-cashier') : path.join(process.env.HOME, '.config', 'pos-cashier');
const dbPath = path.join(userDataPath, 'pos-cashier.db');

const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Backfilling user_names in stock_audit_log...');

    // Update stock_audit_log
    const auditUpdate = db.prepare(`
    UPDATE stock_audit_log 
    SET user_name = (SELECT username FROM users WHERE users.id = stock_audit_log.user_id)
    WHERE user_name IS NULL AND user_id IS NOT NULL
  `).run();
    console.log(`Updated ${auditUpdate.changes} rows in stock_audit_log.`);

    // Set default for remaining NULLs
    const auditDefault = db.prepare(`
    UPDATE stock_audit_log 
    SET user_name = 'System'
    WHERE user_name IS NULL
  `).run();
    console.log(`Set ${auditDefault.changes} rows to 'System' in stock_audit_log.`);

    console.log('Backfilling user_names in stock_trail...');
    // Update stock_trail
    const trailUpdate = db.prepare(`
    UPDATE stock_trail 
    SET user_name = (SELECT username FROM users WHERE users.id = stock_trail.user_id)
    WHERE user_name IS NULL AND user_id IS NOT NULL
  `).run();
    console.log(`Updated ${trailUpdate.changes} rows in stock_trail.`);

    // Set default for remaining NULLs in stock_trail
    const trailDefault = db.prepare(`
    UPDATE stock_trail 
    SET user_name = 'System'
    WHERE user_name IS NULL
  `).run();
    console.log(`Set ${trailDefault.changes} rows to 'System' in stock_trail.`);

} catch (err) {
    console.error('Error executing script:', err);
} finally {
    db.close();
}
