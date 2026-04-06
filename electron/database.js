const Database = require('better-sqlite3');
const path = require('path');
const { app, ipcMain } = require('electron');
const fs = require('fs');

let db;
let dbPath;
let settingsCache = null;
let dashboardCache = { data: null, expiry: 0 };
let cachedCostMultiplier = null;

// ─── Prepared Statement Cache ───────────────────────────
const stmtCache = new Map();
const MAX_STMT_CACHE_SIZE = 500;

function cachedPrepare(sql) {
    let stmt = stmtCache.get(sql);
    if (stmt) {
        // Refresh insertion order so Map behaves like LRU.
        stmtCache.delete(sql);
        stmtCache.set(sql, stmt);
        return stmt;
    }

    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
    if (stmtCache.size > MAX_STMT_CACHE_SIZE) {
        const oldestKey = stmtCache.keys().next().value;
        if (oldestKey) stmtCache.delete(oldestKey);
    }

    return stmt;
}

function clearStmtCache() {
    stmtCache.clear();
}

// ─── Timezone Cache ─────────────────────────────────────
let cachedTimezoneOffset = null;

// ─── Initialization ─────────────────────────────────────
function initDatabase() {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'pos-cashier.db');

    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    console.log('[Database] Path:', dbPath);

    try {
        db = new Database(dbPath, { verbose: null }); // verbose: console.log
        applyPragmas();

        createTables();

        const settingsCount = get("SELECT COUNT(*) as count FROM settings");
        if (!settingsCount || settingsCount.count === 0) {
            seedSettings();
        }

        runMigrations();
        padExistingBarcodes();

        console.log('[Database] Initialized successfully');
    } catch (err) {
        console.error('[Database] Initialization failed:', err);
        throw err;
    }
}

// ─── Helpers ────────────────────────────────────────────
function applyPragmas() {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');     // Aman dengan WAL, lebih cepat
    db.pragma('cache_size = -64000');      // 64MB cache (default cuma 2MB)
    db.pragma('temp_store = MEMORY');      // Temp tables di RAM
    db.pragma('foreign_keys = ON');        // [FIX] Tegakkan referential integrity

    // Dynamic mmap_size based on system RAM
    const totalRamMB = Math.floor(require('os').totalmem() / 1024 / 1024);
    const mmapSize = totalRamMB >= 4096
        ? 268435456   // 256MB — RAM >= 4GB
        : 134217728;  // 128MB — RAM < 4GB (low-spec)

    db.pragma(`mmap_size = ${mmapSize}`);
    console.log(`[Database] Pragmas applied. RAM: ${totalRamMB}MB, mmap_size: ${mmapSize / 1024 / 1024}MB, foreign_keys: ON`);
}
function run(sql, params = []) {
    return cachedPrepare(sql).run(params);
}

function get(sql, params = []) {
    return cachedPrepare(sql).get(params);
}

function padExistingBarcodes() {
    try {
        console.log('[Database] Checking for barcodes to pad...');
        // Find numeric barcodes that are shorter than 12 digits
        const products = all("SELECT id, barcode FROM products WHERE length(barcode) < 12 AND barcode GLOB '[0-9]*'");
        if (products.length > 0) {
            console.log(`[Database] Padding ${products.length} barcodes...`);
            db.transaction(() => {
                for (const p of products) {
                    const padded = p.barcode.padStart(12, '0');
                    run("UPDATE products SET barcode = ? WHERE id = ?", [padded, p.id]);
                }
            })();
            console.log('[Database] Barcode padding complete.');
        }
    } catch (err) {
        console.error('[Database] Failed to pad barcodes:', err.message);
    }
}

function all(sql, params = []) {
    return cachedPrepare(sql).all(params);
}

function saveDatabase() { } // no-op

function getLocalDateString(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - offset)).toISOString().slice(0, 10);
    return localISOTime;
}

function createTables() {
    run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    role TEXT,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    run(`CREATE TABLE IF NOT EXISTS device_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

    run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    barcode TEXT UNIQUE,
    name TEXT,
    price REAL,
    cost REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit TEXT,
    active INTEGER DEFAULT 1,
    low_stock_threshold INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    margin_mode TEXT DEFAULT 'manual'
  )`);
    run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE,
    user_id INTEGER,
    subtotal REAL,
    tax_amount REAL,
    discount_amount REAL,
    total REAL,
    payment_method TEXT,
    amount_paid REAL,
    change_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT,
    customer_address TEXT,
    payment_status TEXT DEFAULT 'lunas',
    due_date DATETIME,
    total_paid REAL DEFAULT 0,
    remaining_balance REAL DEFAULT 0,
    payment_notes TEXT,
    status TEXT DEFAULT 'completed'
  )`);
    run(`CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    product_id INTEGER,
    product_name TEXT,
    price REAL,
    original_cost REAL DEFAULT 0, 
    quantity INTEGER,
    discount REAL,
    subtotal REAL,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
  )`);
    run(`CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    amount REAL,
    payment_method TEXT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INTEGER,
    notes TEXT,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
  )`);
    run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
    run(`CREATE TABLE IF NOT EXISTS stock_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name TEXT,
    old_stock INTEGER,
    new_stock INTEGER,
    difference INTEGER,
    reason TEXT,
    user_id INTEGER,
    user_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    // New comprehensive stock trail table
    run(`CREATE TABLE IF NOT EXISTS stock_trail(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            quantity_before INTEGER DEFAULT 0,
            quantity_change INTEGER DEFAULT 0,
            quantity_after INTEGER DEFAULT 0,
            user_id INTEGER,
            user_name TEXT,
            notes TEXT,
            reference_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    run(`CREATE INDEX IF NOT EXISTS idx_stock_trail_product ON stock_trail(product_id)`);
    run(`CREATE INDEX IF NOT EXISTS idx_stock_trail_event ON stock_trail(event_type)`);
    run(`CREATE INDEX IF NOT EXISTS idx_stock_trail_created ON stock_trail(created_at)`);

    // Performance Indexes
    run(`CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at)`);
    run(`CREATE INDEX IF NOT EXISTS idx_transaction_items_tx_id ON transaction_items(transaction_id)`);
    run(`CREATE INDEX IF NOT EXISTS idx_transaction_items_product_name ON transaction_items(product_name)`);
    run(`CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id)`); // NEW
    run(`CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status)`);   // NEW
    run(`CREATE INDEX IF NOT EXISTS idx_stock_trail_product_created ON stock_trail(product_id, created_at)`); // NEW
    run(`CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(active, stock)`);

    // AI Insight cache — single-row table, keyed by data hash
    run(`CREATE TABLE IF NOT EXISTS ai_insight_cache (
        id INTEGER PRIMARY KEY,
        insight_json TEXT NOT NULL,
        data_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
}

function seedSettings() {
    const defaults = {
        store_name: 'Toko Saya',
        store_address: 'Jl. Contoh No. 123',
        store_phone: '08123456789',
        printer_type: '58mm',
        tax_percentage: '0',
        footer_message: 'Terima kasih atas kunjungan Anda',
        auto_backup_dir: '',
        last_backup_date: '',
        default_margin_percent: '10.5',
        auto_start: 'false',
        app_name: 'POS Kasir',
        app_logo: '',
        timezone_offset: 'auto',
        // Font size setting (xs, sm, md, lg, xl)
        app_font_size: 'md',
        // Print offset settings (in mm)
        print_margin_top: '10',
        print_margin_bottom: '10',
        print_margin_left: '5',
        print_margin_right: '5',
        // Line height and spacing settings
        print_line_height: '1.4',      // Jarak antar baris (1.0 = rapat, 2.0 = renggang)
        print_item_spacing: 'normal',   // Spasi antar item: 'compact', 'normal', 'relaxed'
        print_scale: '100',
        // Page break control (untuk menghemat kertas antar struk)
        print_page_gap: 'compact',      // Jarak antar struk: 'none', 'compact', 'normal'
        print_min_height: 'auto',        // Minimal tinggi struk: 'auto', '50mm', '100mm', '150mm'
        // TOTP settings
        totp_admin_enabled: '0',        // Apakah ada admin yang mengaktifkan TOTP
    };
    const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((settings) => {
        for (const [key, value] of Object.entries(settings)) insert.run(key, value);
    });
    transaction(defaults);
}

function runMigrations() {
    console.log('[Migrations] Starting migration check...');

    const addColumnIfNotExists = (table, column, definition) => {
        try {
            const info = db.prepare(`PRAGMA table_info(${table})`).all();
            const exists = info.some(c => c.name === column);
            if (!exists) {
                console.log(`[Migrations] Adding column ${column} to ${table}...`);
                run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition} `);
                console.log(`[Migrations] SUCCESS: Added column ${column} to ${table} `);
            }
        } catch (err) {
            console.error(`[Migrations] Error checking / adding column ${column} to ${table}: `, err.message);
        }
    };

    const addIndexIfNotExists = (indexName, tableName, columns) => {
        try {
            run(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns})`);
        } catch (err) {
            console.error(`[Migrations] Error creating index ${indexName}: `, err.message);
        }
    };

    addColumnIfNotExists('transactions', 'customer_name', 'TEXT');
    addColumnIfNotExists('transactions', 'customer_address', 'TEXT');
    addColumnIfNotExists('transactions', 'payment_status', "TEXT DEFAULT 'lunas'");
    addColumnIfNotExists('transactions', 'due_date', 'DATETIME');
    addColumnIfNotExists('transactions', 'total_paid', 'REAL DEFAULT 0');
    addColumnIfNotExists('transactions', 'remaining_balance', 'REAL DEFAULT 0');
    addColumnIfNotExists('transactions', 'payment_notes', 'TEXT');
    addColumnIfNotExists('products', 'margin_mode', "TEXT DEFAULT 'manual'");
    addColumnIfNotExists('products', 'low_stock_threshold', 'INTEGER DEFAULT NULL');
    addColumnIfNotExists('transaction_items', 'original_cost', 'REAL DEFAULT 0');
    addColumnIfNotExists('stock_audit_log', 'difference', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('stock_audit_log', 'reason', 'TEXT');
    addColumnIfNotExists('stock_audit_log', 'user_id', 'INTEGER');
    addColumnIfNotExists('stock_audit_log', 'user_name', 'TEXT');
    addColumnIfNotExists('users', 'logged_out_at', 'INTEGER NOT NULL DEFAULT 0');

    addIndexIfNotExists('idx_products_barcode', 'products', 'barcode');
    addIndexIfNotExists('idx_products_name', 'products', 'name');
    addIndexIfNotExists('idx_transactions_created', 'transactions', 'created_at');
    addIndexIfNotExists('idx_transactions_invoice', 'transactions', 'invoice_number');
    addIndexIfNotExists('idx_transaction_items_product_id', 'transaction_items', 'product_id');
    addIndexIfNotExists('idx_payment_history_tx_id', 'payment_history', 'transaction_id');
    addIndexIfNotExists('idx_transactions_payment_due', 'transactions', 'payment_status, due_date');
    addIndexIfNotExists('idx_stock_audit_product', 'stock_audit_log', 'product_id');
    addIndexIfNotExists('idx_stock_audit_created', 'stock_audit_log', 'created_at');

    addColumnIfNotExists('users', 'last_login', 'DATETIME');
    addColumnIfNotExists('users', 'active', 'INTEGER DEFAULT 1');
    addColumnIfNotExists('users', 'password_changed', 'INTEGER DEFAULT 0');

    // TOTP columns
    addColumnIfNotExists('users', 'totp_secret', 'TEXT');
    addColumnIfNotExists('users', 'totp_secret_temp', 'TEXT');
    addColumnIfNotExists('users', 'totp_backup_codes', 'TEXT');
    addColumnIfNotExists('users', 'totp_backup_codes_temp', 'TEXT');
    addColumnIfNotExists('users', 'totp_enabled', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('users', 'totp_enabled_at', 'INTEGER');

    // Ensure auto_start setting exists
    const autoStart = get("SELECT value FROM settings WHERE key = 'auto_start'");
    if (!autoStart) {
        console.log('[Migrations] Adding default auto_start setting...');
        run("INSERT INTO settings (key, value) VALUES ('auto_start', 'false')");
    }

    // Ensure timezone_offset setting exists
    const timezoneOffset = get("SELECT value FROM settings WHERE key = 'timezone_offset'");
    if (!timezoneOffset) {
        console.log('[Migrations] Adding default timezone_offset setting (auto)...');
        run("INSERT INTO settings (key, value) VALUES ('timezone_offset', 'auto')");
    } else if (String(timezoneOffset.value).trim() === '0') {
        // Legacy value "0" menyebabkan semua jam dibaca UTC.
        // Karena opsi timezone sudah disederhanakan ke otomatis, normalisasi ke auto.
        console.log('[Migrations] Normalizing legacy timezone_offset=0 to auto...');
        run("UPDATE settings SET value = 'auto' WHERE key = 'timezone_offset'");
    }

    // Ensure app_font_size setting exists
    const appFontSize = get("SELECT value FROM settings WHERE key = 'app_font_size'");
    if (!appFontSize) {
        console.log('[Migrations] Adding default app_font_size setting (medium)...');
        run("INSERT INTO settings (key, value) VALUES ('app_font_size', 'medium')");
    }

    // Fix malformed invoice numbers (Migration for issue fixed on 2026-02-09)
    try {
        const malformedCount = get("SELECT COUNT(*) as c FROM transactions WHERE invoice_number LIKE 'INV - %'").c;
        if (malformedCount > 0) {
            console.log(`[Migrations] Found ${malformedCount} malformed invoice numbers. Fixing...`);
            run("UPDATE transactions SET invoice_number = REPLACE(REPLACE(invoice_number, ' - ', '-'), ' ', '') WHERE invoice_number LIKE 'INV - %'");
            console.log('[Migrations] Fixed malformed invoice numbers.');
        }
    } catch (err) {
        console.error('[Migrations] Error fixing invoice numbers:', err.message);
    }


    // Device sessions table
    try {
        run(`CREATE TABLE IF NOT EXISTS device_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, device_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
        run(`CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_id)`);
        console.log('[Migrations] device_sessions table ready');
    } catch (e) { console.error('[Migrations] device_sessions:', e.message); }

    // Migrate existing stock_trail.created_at from localtime to UTC
    // (Previously used datetime('now','localtime'), now uses CURRENT_TIMESTAMP/UTC)
    try {
        const alreadyMigrated = get("SELECT value FROM settings WHERE key = 'migrated_stock_trail_utc'");
        if (!alreadyMigrated) {
            const offsetRow = get("SELECT value FROM settings WHERE key = 'timezone_offset'");
            const offset = (offsetRow?.value && offsetRow.value !== 'auto')
                ? parseFloat(offsetRow.value)
                : -(new Date().getTimezoneOffset() / 60);
            const sign = offset >= 0 ? '-' : '+';
            const absOffset = Math.abs(offset);
            const count = get('SELECT COUNT(*) as c FROM stock_trail')?.c || 0;
            if (count > 0) {
                run(`UPDATE stock_trail SET created_at = datetime(created_at, '${sign}${absOffset} hours')`);
            }
            run("INSERT OR IGNORE INTO settings (key, value) VALUES ('migrated_stock_trail_utc', '1')");
            console.log(`[Migrations] Converted ${count} stock_trail records from localtime to UTC (offset: ${offset}h)`);
        }
    } catch (err) {
        console.error('[Migrations] stock_trail UTC migration error:', err.message);
    }

    // AI Insight cache: add days column for per-range cache isolation
    addColumnIfNotExists('ai_insight_cache', 'days', 'INTEGER NOT NULL DEFAULT 30');

    // Kolom updated_at di transactions — dibutuhkan oleh voidTransaction() untuk mencatat waktu void
    addColumnIfNotExists('transactions', 'updated_at', 'DATETIME');

    // ─── Trigger Validasi event_type di stock_trail ───────────
    // SQLite tidak support ALTER TABLE ADD CONSTRAINT, jadi gunakan trigger
    try {
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS chk_stock_trail_event_type
            BEFORE INSERT ON stock_trail
            WHEN NEW.event_type NOT IN ('initial', 'sale', 'restock', 'adjustment', 'void', 'return')
            BEGIN
                SELECT RAISE(ABORT, 'Invalid event_type: must be initial|sale|restock|adjustment|void|return');
            END
        `);
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS chk_stock_trail_event_type_upd
            BEFORE UPDATE ON stock_trail
            WHEN NEW.event_type NOT IN ('initial', 'sale', 'restock', 'adjustment', 'void', 'return')
            BEGIN
                SELECT RAISE(ABORT, 'Invalid event_type: must be initial|sale|restock|adjustment|void|return');
            END
        `);
        console.log('[Migrations] stock_trail event_type trigger: OK');
    } catch (e) {
        console.error('[Migrations] stock_trail trigger error:', e.message);
    }

    // ─── Trigger Validasi status di transactions ──────────────
    try {
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS chk_transactions_status
            BEFORE INSERT ON transactions
            WHEN NEW.status NOT IN ('completed', 'voided', 'pending')
            BEGIN
                SELECT RAISE(ABORT, 'Invalid status: must be completed|voided|pending');
            END
        `);
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS chk_transactions_status_upd
            BEFORE UPDATE ON transactions
            WHEN NEW.status NOT IN ('completed', 'voided', 'pending')
            BEGIN
                SELECT RAISE(ABORT, 'Invalid status: must be completed|voided|pending');
            END
        `);
        console.log('[Migrations] transactions status trigger: OK');
    } catch (e) {
        console.error('[Migrations] transactions status trigger error:', e.message);
    }

    try { db.exec('ANALYZE'); } catch (e) { /* ignore */ }
    console.log('[Migrations] Migration check completed.');
}

// ─── Users ──────────────────────────────────────────────
function getUsers() {
    return all('SELECT id, username, name, role, active, last_login, created_at FROM users ORDER BY name');
}
function getUserById(id) { return get('SELECT * FROM users WHERE id = ?', [id]); }
function getUserByUsername(username) { return get('SELECT * FROM users WHERE username = ?', [username]); }

function createUser(user) {
    const result = run(
        'INSERT INTO users (username, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.password_hash, user.name, user.role, user.active !== undefined ? user.active : 1]
    );
    return { id: result.lastInsertRowid, ...user };
}

function updateUser(id, user) {
    // Guard: cegah menonaktifkan admin terakhir yang aktif
    if (user.active === 0) {
        const target = getUserById(id);
        if (target?.role === 'admin') {
            const otherActiveAdmins = get(
                'SELECT COUNT(*) as c FROM users WHERE role = ? AND active = 1 AND id != ?',
                ['admin', id]
            )?.c || 0;
            if (otherActiveAdmins === 0) {
                throw new Error(
                    'Tidak dapat menonaktifkan admin terakhir yang aktif. ' +
                    'Pastikan ada admin lain yang aktif terlebih dahulu.'
                );
            }
        }
    }
    const sets = [];
    const params = [];
    if (user.username !== undefined) { sets.push('username=?'); params.push(user.username); }
    if (user.password_hash !== undefined) { sets.push('password_hash=?'); params.push(user.password_hash); }
    if (user.name !== undefined) { sets.push('name=?'); params.push(user.name); }
    if (user.role !== undefined) { sets.push('role=?'); params.push(user.role); }
    if (user.active !== undefined) { sets.push('active=?'); params.push(user.active); }
    // TOTP fields
    if (user.totp_secret !== undefined) { sets.push('totp_secret=?'); params.push(user.totp_secret); }
    if (user.totp_secret_temp !== undefined) { sets.push('totp_secret_temp=?'); params.push(user.totp_secret_temp); }
    if (user.totp_backup_codes !== undefined) { sets.push('totp_backup_codes=?'); params.push(user.totp_backup_codes); }
    if (user.totp_backup_codes_temp !== undefined) { sets.push('totp_backup_codes_temp=?'); params.push(user.totp_backup_codes_temp); }
    if (user.totp_enabled !== undefined) { sets.push('totp_enabled=?'); params.push(user.totp_enabled); }
    if (user.totp_enabled_at !== undefined) { sets.push('totp_enabled_at=?'); params.push(user.totp_enabled_at); }

    if (sets.length === 0) return getUserById(id);

    params.push(id);
    run(`UPDATE users SET ${sets.join(', ')} WHERE id=?`, params);
    return getUserById(id);
}

function updateUserLastLogin(id) {
    run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}

function invalidateUserToken(id) {
    run("UPDATE users SET logged_out_at = unixepoch() WHERE id = ?", [id]);
}

function deleteUser(id) {
    const target = getUserById(id);
    if (target?.role === 'admin') {
        const activeAdminCount = get(
            'SELECT COUNT(*) as c FROM users WHERE role = ? AND active = 1',
            ['admin']
        )?.c || 0;
        if (activeAdminCount <= 1) {
            throw new Error(
                'Tidak dapat menghapus admin terakhir yang aktif. ' +
                'Pastikan ada admin lain yang aktif sebelum menghapus akun ini.'
            );
        }
    }
    run('DELETE FROM users WHERE id = ?', [id]);
    return { id };
}

// ─── Device Sessions ──────────────────────────────────────────────
function upsertDeviceSession(userId, deviceId, deviceName) {
    run(
        `INSERT INTO device_sessions (user_id, device_id, device_name, last_seen)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, device_id) DO UPDATE SET
         device_name = excluded.device_name,
         last_seen = CURRENT_TIMESTAMP`,
        [userId, deviceId, deviceName]
    );
}

function getDeviceSessions(userId) {
    return all(
        `SELECT * FROM device_sessions WHERE user_id = ? ORDER BY last_seen DESC`,
        [userId]
    );
}

function getDeviceSessionByDeviceId(userId, deviceId) {
    return get(
        `SELECT * FROM device_sessions WHERE user_id = ? AND device_id = ?`,
        [userId, deviceId]
    );
}

function countDeviceSessions(userId) {
    const row = get(`SELECT COUNT(*) as c FROM device_sessions WHERE user_id = ?`, [userId]);
    return row ? row.c : 0;
}

function getOldestDeviceSession(userId) {
    return get(
        `SELECT * FROM device_sessions WHERE user_id = ? ORDER BY last_seen ASC LIMIT 1`,
        [userId]
    );
}

function deleteDeviceSessionById(id) {
    run(`DELETE FROM device_sessions WHERE id = ?`, [id]);
}

function deleteDeviceSession(userId, deviceId) {
    run(`DELETE FROM device_sessions WHERE user_id = ? AND device_id = ?`, [userId, deviceId]);
}

// ─── Categories ─────────────────────────────────────────
function getCategories() { return all('SELECT * FROM categories ORDER BY name'); }
function getCategoryById(id) { return get('SELECT * FROM categories WHERE id = ?', [id]); }

function createCategory(name) {
    const upperName = name.toUpperCase();
    try {
        const result = run('INSERT INTO categories (name) VALUES (?)', [upperName]);
        return { id: result.lastInsertRowid, name: upperName };
    } catch (e) {
        const existing = get('SELECT * FROM categories WHERE name = ?', [upperName]);
        if (existing) return existing;
        throw e;
    }
}

function updateCategory(id, name) {
    const upperName = name.toUpperCase();
    run('UPDATE categories SET name = ? WHERE id = ?', [upperName, id]);
    return { id, name: upperName };
}

function deleteCategory(id) {
    const deleteTx = db.transaction(() => {
        run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
        run('DELETE FROM categories WHERE id = ?', [id]);
    });
    deleteTx();
    return { id };
}

// ─── Products ───────────────────────────────────────────
function getProducts(searchOrFilters = '', categoryId = null, limit = null, offset = 0, sortBy = 'name', sortOrder = 'asc') {
    // Support both object-based and positional arguments
    let search = '';
    if (typeof searchOrFilters === 'object' && searchOrFilters !== null) {
        // Object-based call: getProducts({ search, category_id, limit, offset, sortBy, sortOrder })
        search = searchOrFilters.search || '';
        categoryId = searchOrFilters.category_id || searchOrFilters.categoryId || null;
        limit = searchOrFilters.limit || null;
        offset = searchOrFilters.offset || 0;
        sortBy = searchOrFilters.sortBy || 'name';
        sortOrder = searchOrFilters.sortOrder || 'asc';
    } else {
        // Positional call: getProducts(search, categoryId, limit, offset, sortBy, sortOrder)
        search = searchOrFilters || '';
    }

    let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.active = 1
        `;
    const params = [];
    let countQuery = `SELECT COUNT(*) as count FROM products p WHERE active = 1`;

    if (search) {
        search = search.trim();
        const isNumeric = /^\d+$/.test(search);

        if (isNumeric && search.length >= 3) {
            // Optimized barcode search (Prefix search)
            const searchPart = ` AND (p.barcode LIKE ? OR p.name LIKE ?)`;
            query += searchPart;
            // Note: countQuery needs WHERE clause adjustments if appended blindly, 
            // but here we are appending AND clauses to existing WHERE.
            // Wait, logic above: `countQuery = ... WHERE active = 1`. So appending AND is correct.
            // BUT: `countQuery` logic in original code appended searchPart too.
            // Original: `countQuery += searchPart;`

            // Let's stick to the structure but fix params.
            countQuery += ` AND (p.barcode LIKE ? OR p.name LIKE ?)`;
            params.push(`${search}%`, `%${search}%`);
        } else {
            const searchPart = ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
            query += searchPart;
            countQuery += searchPart;
            params.push(`%${search}%`, `%${search}%`);
        }
    }
    if (categoryId) {
        const catPart = ` AND p.category_id = ? `;
        query += catPart;
        countQuery += ` AND p.category_id = ? `;
        params.push(categoryId);
    }

    if (typeof searchOrFilters === 'object' && searchOrFilters.low_stock) {
        const lowStockPart = ` AND p.stock < 15 `;
        query += lowStockPart;
        countQuery += lowStockPart;
    }

    const totalRes = get(countQuery, params);
    const total = totalRes ? totalRes.count : 0;

    const allowedSorts = ['name', 'price', 'stock', 'barcode', 'category_name', 'created_at'];
    const sortCol = allowedSorts.includes(sortBy) ? sortBy : (sortBy === 'category' ? 'category_name' : 'name');
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${order} `;

    if (limit) {
        query += ` LIMIT ? OFFSET ? `;
        params.push(limit, offset);
    }

    const products = all(query, params);
    if (products.length > 0) {
        const costMultiplier = getCostMultiplier();
        products.forEach(p => {
            if ((!p.cost || p.cost === 0) && p.price > 0) {
                p.cost = Math.round(p.price * costMultiplier);
            }
        });
    }

    if (limit) {
        return { data: products, total };
    }
    return products;
}


function getProductById(id) { return get('SELECT * FROM products WHERE id = ?', [id]); }
function getProductByBarcode(barcode) { return get('SELECT * FROM products WHERE barcode = ? AND active = 1', [barcode]); }
function getProductByName(name) { return get('SELECT * FROM products WHERE UPPER(name) = UPPER(?) AND active = 1', [name]); }

function validateProductsActiveBulk(productIds = []) {
    const ids = [...new Set((productIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0))];

    if (ids.length === 0) return { inactiveProducts: [] };

    const placeholders = ids.map(() => '?').join(',');
    const rows = all(`SELECT id, name, active FROM products WHERE id IN (${placeholders})`, ids);
    const byId = new Map(rows.map((row) => [row.id, row]));

    const inactiveProducts = [];
    for (const id of ids) {
        const row = byId.get(id);
        if (!row || row.active === 0) {
            inactiveProducts.push({ id, name: row?.name || `ID:${id}` });
        }
    }

    return { inactiveProducts };
}

function searchProducts(query, limit = 50) {
    // Trim query to remove accidental spaces
    query = query.trim();

    // Check if query is numeric for barcode optimization
    const isNumeric = /^\d+$/.test(query);

    if (isNumeric && query.length >= 3) {
        // Optimized barcode search (Prefix search uses index)
        return all(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.active = 1 AND (p.barcode LIKE ? OR p.name LIKE ?) 
             LIMIT 50`,
            [`${query}%`, `%${query}%`]
        );
    }

    // Standard search
    return all(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.active = 1 AND (p.name LIKE ? OR p.barcode LIKE ?) 
         LIMIT 50`,
        [`%${query}%`, `%${query}%`]
    );
}

function getLowStockProducts(threshold = 5) {
    return all(
        `SELECT p.id, p.category_id, p.name, p.barcode, p.stock, p.price, p.cost, p.unit, p.margin_mode, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.active = 1 AND p.stock <= ?
        ORDER BY p.stock ASC, p.name ASC`,
        [threshold]
    );
}


function createProduct(product) {
    const upperName = product.name.toUpperCase();
    const lowerUnit = (product.unit || 'pcs').toLowerCase();
    const initialStock = product.stock || 0;

    try {
        const result = run(
            `INSERT INTO products(category_id, barcode, name, price, cost, stock, unit, margin_mode)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [product.category_id || null, product.barcode, upperName, product.price, product.cost || 0, initialStock, lowerUnit, product.margin_mode || 'manual']
        );
        const newProduct = getProductById(result.lastInsertRowid);

        // Create initial stock trail
        if (initialStock > 0) {
            createStockTrail({
                product_id: newProduct.id,
                product_name: upperName,
                event_type: 'initial',
                quantity_before: 0,
                quantity_change: initialStock,
                quantity_after: initialStock,
                user_id: product.userId || product.user_id || null,
                user_name: product.userName || product.user_name || null,
                notes: 'Stok awal produk baru'
            });
        }

        return newProduct;
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed: products.barcode')) {
            throw new Error('Barcode ini sudah digunakan oleh produk lain');
        }
        throw err;
    }
}

function updateProduct(id, product, auditInfo = null) {
    // Get old product data for audit
    const oldProduct = get('SELECT * FROM products WHERE id = ?', [id]);
    if (!oldProduct) {
        throw new Error('Produk tidak ditemukan');
    }

    // Use existing values as fallback for partial updates
    const upperName = (product.name || oldProduct.name).toUpperCase();
    const lowerUnit = (product.unit || oldProduct.unit || 'pcs').toLowerCase();
    const newStock = product.stock !== undefined ? product.stock : oldProduct.stock;
    const newPrice = product.price !== undefined ? product.price : oldProduct.price;
    const newCost = product.cost !== undefined ? product.cost : oldProduct.cost;
    const newCategoryId = product.category_id !== undefined ? product.category_id : oldProduct.category_id;
    const newBarcode = product.barcode !== undefined ? product.barcode : oldProduct.barcode;
    const newMarginMode = product.margin_mode || oldProduct.margin_mode || 'manual';

    try {
        run(
            `UPDATE products SET
        category_id =?, barcode =?, name =?, price =?, cost =?, stock =?, unit =?, margin_mode =?, updated_at = datetime('now', 'localtime')
         WHERE id =? `,
            [newCategoryId, newBarcode, upperName, newPrice, newCost, newStock, lowerUnit, newMarginMode, id]
        );

        // Create stock trail if stock changed
        if (oldProduct && oldProduct.stock !== newStock) {
            const diff = newStock - oldProduct.stock;
            const eventType = diff > 0 ? 'restock' : 'adjustment';

            createStockTrail({
                product_id: id,
                product_name: upperName,
                event_type: eventType,
                quantity_before: oldProduct.stock,
                quantity_change: diff,
                quantity_after: newStock,
                user_id: auditInfo?.userId || null,
                user_name: auditInfo?.userName || null,
                notes: auditInfo?.source === 'manual' ? 'Edit manual dari halaman Produk' : (auditInfo?.source || 'Update stok')
            });

            // Also log to old audit table for backward compat
            createStockAuditLog({
                product_id: id,
                product_name: upperName,
                old_stock: oldProduct.stock,
                new_stock: newStock,
                difference: diff,
                reason: auditInfo?.source || 'manual',
                user_id: auditInfo?.userId,
                user_name: auditInfo?.userName
            });
        }

        return getProductById(id);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed: products.barcode')) {
            throw new Error('Barcode ini sudah digunakan oleh produk lain');
        }
        throw err;
    }
}

function deleteProduct(id) {
    run('UPDATE products SET active = 0 WHERE id = ?', [id]);
    return { id };
}

function restoreProduct(id) {
    const product = get('SELECT id, name FROM products WHERE id = ?', [id]);
    if (!product) throw new Error('Produk tidak ditemukan');
    run(`UPDATE products SET active = 1, updated_at = datetime('now', 'localtime') WHERE id = ?`, [id]);
    return getProductById(id);
}



function bulkUpsertProducts(products) {
    const results = { success: 0, failed: 0, errors: [] };
    const transaction = db.transaction((items) => {
        for (const p of items) {
            try {
                const upperName = p.name ? p.name.toUpperCase() : 'UNKNOWN';
                let catId = null;
                if (p.category_name) {
                    const cat = get('SELECT id FROM categories WHERE name = ?', [p.category_name.toUpperCase()]);
                    if (cat) catId = cat.id;
                    else {
                        const newCat = run('INSERT INTO categories (name) VALUES (?)', [p.category_name.toUpperCase()]);
                        catId = newCat.lastInsertRowid;
                    }
                }
                const existing = get('SELECT id FROM products WHERE barcode = ?', [p.barcode]);
                if (existing) {
                    const oldStock = get('SELECT stock FROM products WHERE id = ?', [existing.id])?.stock || 0;
                    run(
                        `UPDATE products SET
    name =?, price =?, cost =?, stock = stock +?, category_id = COALESCE(?, category_id), updated_at = datetime('now', 'localtime')
             WHERE id =? `,
                        [upperName, p.price, p.cost, p.stock || 0, catId, existing.id]
                    );
                    const stockAdded = p.stock || 0;
                    if (stockAdded !== 0) {
                        createStockTrail({
                            product_id: existing.id,
                            product_name: upperName,
                            event_type: 'restock',
                            quantity_before: oldStock,
                            quantity_change: stockAdded,
                            quantity_after: oldStock + stockAdded,
                            user_id: null,
                            user_name: 'Import Excel',
                            notes: 'Import/update massal via Excel'
                        });
                    }
                } else {
                    const insertInfo = run(
                        `INSERT INTO products(barcode, name, price, cost, stock, category_id, unit, margin_mode)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
                        [p.barcode, upperName, p.price, p.cost, p.stock || 0, catId, 'pcs', 'manual']
                    );
                    const newId = insertInfo.lastInsertRowid;
                    if ((p.stock || 0) > 0) {
                        createStockTrail({
                            product_id: newId,
                            product_name: upperName,
                            event_type: 'initial',
                            quantity_before: 0,
                            quantity_change: p.stock || 0,
                            quantity_after: p.stock || 0,
                            user_id: null,
                            user_name: 'Import Excel',
                            notes: 'Stok awal via import Excel'
                        });
                    }
                }
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`${p.name}: ${err.message} `);
            }
        }
    });
    try { transaction(products); } catch (err) { console.error("Bulk upsert transaction failed:", err); }
    return results;
}

function bulkDeleteProducts(ids) {
    const transaction = db.transaction((idList) => {
        for (const id of idList) run('UPDATE products SET active = 0 WHERE id = ?', [id]);
    });
    transaction(ids);
    return { success: true, count: ids.length };
}

function bulkUpdateField(ids, field, value) {
    if (!['category_id', 'margin_mode'].includes(field)) return { success: false };
    const sql = `UPDATE products SET ${field} = ?, updated_at = datetime('now', 'localtime') WHERE id = ? `;
    const transaction = db.transaction((idList) => {
        for (const id of idList) run(sql, [value, id]);
    });
    transaction(ids);
    return { success: true };
}

function generateProductBarcode() {
    const now = new Date();
    const dateStr = now.getFullYear().toString().substr(-2) + (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `2${dateStr}`;
    const count = get("SELECT barcode FROM products WHERE barcode LIKE ? ORDER BY barcode DESC LIMIT 1", [`${prefix}%`]);
    let seq = 1;
    if (count && count.barcode) {
        // Try to parse the sequence from the end (use 7 digits for 12 total digits)
        const lastSeq = parseInt(count.barcode.slice(-7));
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    if (seq > 9999999) {
        throw new Error('Sequence barcode untuk bulan ini sudah penuh (maks 9.999.999). Hubungi administrator.');
    }
    return `${prefix}${seq.toString().padStart(7, '0')}`;
}

function generateMultipleBarcodes(count) {
    const codes = [];
    const now = new Date();
    const dateStr = now.getFullYear().toString().substr(-2) + (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `2${dateStr}`;

    const lastRow = get("SELECT barcode FROM products WHERE barcode LIKE ? ORDER BY barcode DESC LIMIT 1", [`${prefix}%`]);
    let seq = 1;
    if (lastRow && lastRow.barcode) {
        const lastSeq = parseInt(lastRow.barcode.slice(-7));
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    if (seq + count > 9999999) {
        throw new Error(`Sequence barcode tidak cukup. Tersedia ${9999999 - seq + 1} slot, dibutuhkan ${count}.`);
    }

    for (let i = 0; i < count; i++) {
        codes.push(`${prefix}${seq.toString().padStart(7, '0')}`);
        seq++;
    }
    return codes;
}

function createStockAuditLog(log) {
    let effectiveUserId = log.user_id;
    let effectiveUserName = log.user_name;

    // Resolve user details if missing
    if (effectiveUserId && !effectiveUserName) {
        try {
            const u = get('SELECT name, username FROM users WHERE id = ?', [effectiveUserId]);
            if (u) effectiveUserName = u.name || u.username;
        } catch (e) { }
    }

    if (!effectiveUserId) {
        try {
            const result = get('SELECT id, username, name FROM users ORDER BY id ASC LIMIT 1');
            if (result) {
                effectiveUserId = result.id;
                if (!effectiveUserName) effectiveUserName = result.name || result.username;
            } else {
                effectiveUserId = 1;
            }
        } catch (e) { effectiveUserId = 1; }
    }

    if (!effectiveUserName) effectiveUserName = 'System';

    try {
        run(
            `INSERT INTO stock_audit_log(product_id, product_name, old_stock, new_stock, difference, reason, user_id, user_name)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [log.product_id, log.product_name, log.old_stock, log.new_stock, log.difference || (log.new_stock - log.old_stock), log.reason, effectiveUserId, effectiveUserName]
        );
    } catch (err) {
        console.warn('[StockAudit] Insert failed:', err.message);
    }
}

function getStockAuditLogByProduct(productId) {
    // Filter out 'Penjualan' transactions to show only manual/stock updates
    return all(
        `SELECT l.*, COALESCE(l.user_name, u.name) as user_name FROM stock_audit_log l LEFT JOIN users u ON l.user_id = u.id 
     WHERE l.product_id = ? AND l.reason NOT LIKE 'Penjualan%' ORDER BY l.created_at DESC`, [productId]
    );
}

function createStockTrail(data) {
    try {
        // Debug log dihapus — terlalu verbose di production (setiap transaksi mencetak log ini)
        // Fallback: If user_id is present but user_name is missing, try to fetch it
        // This is crucial for transactions which only pass user_id
        if (data.user_id && !data.user_name) {
            try {
                const user = get('SELECT name, username FROM users WHERE id = ?', [data.user_id]);
                if (user) {
                    data.user_name = user.name || user.username;
                } else {
                    // Fallback to first available user or system
                    const firstUser = get('SELECT name, username FROM users ORDER BY id ASC LIMIT 1');
                    if (firstUser) {
                        data.user_name = firstUser.name || firstUser.username;
                    } else {
                        data.user_name = 'System';
                    }
                }
            } catch (ignore) {
                data.user_name = 'System';
            }
        }

        run(
            `INSERT INTO stock_trail(product_id, product_name, event_type, quantity_before, quantity_change, quantity_after, user_id, user_name, notes, reference_id)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.product_id, data.product_name, data.event_type, data.quantity_before || 0, data.quantity_change || 0, data.quantity_after || 0, data.user_id || null, data.user_name || null, data.notes || null, data.reference_id || null]
        );
    } catch (err) {
        console.error('[StockTrail] Failed to create trail:', err.message);
    }
}

function getStockTrailByProduct(productId, limit = 50) {
    return all(
        `SELECT st.*, COALESCE(st.user_name, u.name, u.username) as user_name 
         FROM stock_trail st 
         LEFT JOIN users u ON st.user_id = u.id 
         WHERE st.product_id = ? 
         ORDER BY st.created_at DESC LIMIT ? `, [productId, limit]
    );
}

function getStockTrailAll(filters = {}) {
    let query = `SELECT st.*, COALESCE(st.user_name, u.name, u.username) as user_name 
                 FROM stock_trail st 
                 LEFT JOIN users u ON st.user_id = u.id 
                 WHERE 1 = 1`;
    const params = [];

    if (filters.product_id) {
        query += ` AND st.product_id = ? `;
        params.push(filters.product_id);
    }
    if (filters.event_type) {
        query += ` AND st.event_type = ? `;
        params.push(filters.event_type);
    }
    if (filters.exclude_sale) {
        query += ` AND st.event_type != 'sale' `;
    }
    if (filters.user_id) {
        query += ` AND st.user_id = ? `;
        params.push(filters.user_id);
    }
    if (filters.date_from) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_from));
        query += ` AND st.created_at >= ? `;
        params.push(range.start);
    }
    if (filters.date_to) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_to));
        query += ` AND st.created_at <= ? `;
        params.push(range.end);
    }
    if (filters.search) {
        const term = `%${filters.search}%`;
        query += ` AND (st.product_name LIKE ? OR st.notes LIKE ?)`;
        params.push(term, term);
    }

    query += ` ORDER BY st.created_at DESC`;

    if (filters.limit) {
        query += ` LIMIT ? `;
        params.push(filters.limit);
        if (filters.offset) {
            query += ` OFFSET ? `;
            params.push(filters.offset);
        }
    }

    return all(query, params);
}

function getStockTrailCount(filters = {}) {
    let query = `SELECT COUNT(*) as total
                 FROM stock_trail st
                 LEFT JOIN users u ON st.user_id = u.id
                 WHERE 1 = 1`;
    const params = [];

    if (filters.product_id) {
        query += ` AND st.product_id = ? `;
        params.push(filters.product_id);
    }
    if (filters.event_type) {
        query += ` AND st.event_type = ? `;
        params.push(filters.event_type);
    }
    if (filters.exclude_sale) {
        query += ` AND st.event_type != 'sale' `;
    }
    if (filters.user_id) {
        query += ` AND st.user_id = ? `;
        params.push(filters.user_id);
    }
    if (filters.date_from) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_from));
        query += ` AND st.created_at >= ? `;
        params.push(range.start);
    }
    if (filters.date_to) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_to));
        query += ` AND st.created_at <= ? `;
        params.push(range.end);
    }
    if (filters.search) {
        const term = `%${filters.search}%`;
        query += ` AND (st.product_name LIKE ? OR st.notes LIKE ?)`;
        params.push(term, term);
    }

    const result = get(query, params);
    return result ? result.total : 0;
}


function getStockAuditLog(filters = {}) {
    let query = `SELECT l.*, COALESCE(l.user_name, u.name) as user_name FROM stock_audit_log l LEFT JOIN users u ON l.user_id = u.id WHERE 1 = 1`;
    const params = [];
    if (filters.date_from) { query += " AND date(l.created_at) >= ?"; params.push(filters.date_from); }
    if (filters.date_to) { query += " AND date(l.created_at) <= ?"; params.push(filters.date_to); }
    query += " ORDER BY l.created_at DESC";
    const limit = filters.limit || 100;
    query += " LIMIT ?";
    params.push(limit);
    return all(query, params);
}

function cleanupOldAuditLogs(daysToKeep = 90) {
    const result = run("DELETE FROM stock_audit_log WHERE created_at < date('now', '-' || ? || ' days')", [daysToKeep]);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return {
        success: true,
        deleted: result.changes,
        cutoffDate: cutoffDate.toISOString().split('T')[0]
    };
}

// ─── Transactions ───────────────────────────────────────
function generateInvoiceNumber() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        (now.getDate()).toString().padStart(2, '0');

    // Use standard format without spaces: INV-YYYYMMDD-XXXX
    const count = get("SELECT COUNT(*) as cnt FROM transactions WHERE invoice_number LIKE ?", [`INV-${dateStr}-%`]).cnt;
    const seq = ((count || 0) + 1).toString().padStart(4, '0');
    return `INV-${dateStr}-${seq}`;
}

// --- Transaction Sub-functions ---

function resolvePaymentStatus(data) {
    const paymentStatus = data.payment_status || 'lunas';
    let totalPaid = 0;
    let remainingBalance = 0;
    let amountPaid = data.amount_paid;
    let changeAmount = data.change_amount;

    if (paymentStatus === 'lunas') {
        totalPaid = data.total;
        remainingBalance = 0;
    } else if (paymentStatus === 'pending') {
        totalPaid = 0;
        remainingBalance = data.total;
        amountPaid = 0;
        changeAmount = 0;
    } else if (paymentStatus === 'hutang' || paymentStatus === 'cicilan') {
        const initialPayment = data.initial_payment || 0;
        totalPaid = initialPayment;
        remainingBalance = data.total - initialPayment;
        amountPaid = initialPayment;
        changeAmount = 0;
    }

    return { paymentStatus, totalPaid, remainingBalance, amountPaid, changeAmount };
}

function decrementProductStock(productId, quantity, userId, userName, invoiceNumber, txId) {
    const updateResult = run(
        "UPDATE products SET stock = stock - ?, updated_at = datetime('now', 'localtime') WHERE id = ? AND active = 1 AND stock >= ?",
        [quantity, productId, quantity]
    );
    if (updateResult.changes === 0) {
        // Stock tidak cukup — ambil stok aktual untuk pesan error yang informatif
        const current = get("SELECT stock, name, active FROM products WHERE id = ?", [productId]);
        if (!current) {
            throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
        }
        if (current.active === 0) {
            throw new Error(`Produk "${current.name}" sudah tidak aktif dan tidak bisa dijual.`);
        }
        const stockNow = current ? current.stock : 0;
        const productName = current ? current.name : `ID ${productId}`;
        throw new Error(`Stok tidak mencukupi untuk produk "${productName}". Stok saat ini: ${stockNow}, dibutuhkan: ${quantity}`);
    }
    // Re-read after update to get accurate new stock for trail logging
    const currentProduct = get("SELECT stock, name FROM products WHERE id = ?", [productId]);
    const newStock = currentProduct ? (currentProduct.stock ?? 0) : 0;
    const oldStock = newStock + quantity;

    // Record to new stock trail
    createStockTrail({
        product_id: productId,
        product_name: currentProduct ? currentProduct.name : 'Unknown Product',
        event_type: 'sale',
        quantity_before: oldStock,
        quantity_change: -quantity,
        quantity_after: newStock,
        user_id: userId,
        user_name: userName || null,
        notes: `Penjualan ${quantity} x`,
        reference_id: txId
    });

    // Record stock audit (backward compat)
    createStockAuditLog({
        product_id: productId,
        product_name: currentProduct ? currentProduct.name : 'Unknown Product',
        old_stock: oldStock,
        new_stock: newStock,
        difference: -quantity,
        reason: `Penjualan #${invoiceNumber}`,
        user_id: userId,
        user_name: userName
    });
}

function insertInitialPayment(txId, amount, paymentMethod, userId) {
    run(
        `INSERT INTO payment_history(transaction_id, amount, payment_method, received_by, notes)
         VALUES(?, ?, ?, ?, ?)`,
        [txId, amount, paymentMethod, userId, 'Pembayaran awal (DP)']
    );
}

function createTransaction(data) {
    const items = data.items || [];
    const status = resolvePaymentStatus(data);

    const costMultiplier = getCostMultiplier();

    const insertTransaction = db.transaction(() => {
        // Generate invoice number inside transaction so concurrent calls cannot produce duplicates
        const invoiceNumber = generateInvoiceNumber();
        const info = run(
            `INSERT INTO transactions(invoice_number, user_id, subtotal, tax_amount, discount_amount, total, payment_method, amount_paid, change_amount, customer_name, customer_address, payment_status, due_date, total_paid, remaining_balance, payment_notes)
             VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoiceNumber, data.user_id, data.subtotal, data.tax_amount, data.discount_amount, data.total, data.payment_method, status.amountPaid, status.changeAmount, data.customer_name || null, data.customer_address || null, status.paymentStatus, data.due_date || null, status.totalPaid, status.remainingBalance, data.payment_notes || null]
        );
        const txId = info.lastInsertRowid;

        for (const item of items) {
            let itemCost = Number(item.cost) || 0;
            if (itemCost === 0 && Number(item.price) > 0) {
                itemCost = Math.round(item.price * costMultiplier);
            }

            run(
                'INSERT INTO transaction_items (transaction_id, product_id, product_name, price, original_cost, quantity, discount, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [txId, item.product_id || null, item.product_name, item.price, itemCost, item.quantity, item.discount || 0, item.subtotal]
            );

            if (item.product_id) {
                decrementProductStock(item.product_id, item.quantity, data.user_id, data.user_name, invoiceNumber, txId);
            }
        }

        if ((status.paymentStatus === 'cicilan' || status.paymentStatus === 'hutang') && status.totalPaid > 0) {
            insertInitialPayment(txId, status.totalPaid, data.payment_method, data.user_id);
        }

        return txId;
    });

    const txId = insertTransaction();
    return getTransactionById(txId);
}

function getTransactionById(id) {
    const tx = get(`SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ? `, [id]);
    if (!tx) return null;
    tx.items = all('SELECT * FROM transaction_items WHERE transaction_id = ?', [id]);
    tx.payment_history = all(`
    SELECT ph.*, u.name as receiver_name
    FROM payment_history ph
    LEFT JOIN users u ON ph.received_by = u.id
    WHERE ph.transaction_id = ?
        ORDER BY ph.payment_date ASC
  `, [id]);
    return tx;
}

function getTransactions(filters = {}) {
    let whereClause = '1 = 1';
    const params = [];

    if (filters.date_from) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_from));
        whereClause += ` AND t.created_at >= ? `;
        params.push(range.start);
    }
    if (filters.date_to) {
        const range = getLocalDayRangeUTC(parseDateLocal(filters.date_to));
        whereClause += ` AND t.created_at <= ? `;
        params.push(range.end);
    }
    if (filters.user_id) {
        whereClause += ` AND t.user_id = ? `;
        params.push(filters.user_id);
    }
    if (filters.status) {
        whereClause += ` AND t.status = ? `;
        params.push(filters.status);
    }
    if (filters.payment_status) {
        whereClause += ` AND t.payment_status = ? `;
        params.push(filters.payment_status);
    }
    if (filters.customer_search) {
        whereClause += ` AND (t.customer_name LIKE ? OR t.customer_address LIKE ? OR t.invoice_number LIKE ?)`;
        const searchTerm = `%${filters.customer_search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    // Count total matches for pagination
    const totalRow = get(`SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`, params);
    const total = totalRow ? totalRow.total : 0;

    // [PERF] Replaced correlated N+1 subquery with pre-aggregated LEFT JOIN
    let query = `SELECT t.*, u.name as cashier_name, COALESCE(ic.item_count, 0) as item_count 
                 FROM transactions t 
                 LEFT JOIN users u ON t.user_id = u.id 
                 LEFT JOIN (
                     SELECT transaction_id, COUNT(*) as item_count
                     FROM transaction_items GROUP BY transaction_id
                 ) ic ON t.id = ic.transaction_id
                 WHERE ${whereClause} 
                 ORDER BY t.created_at DESC`;

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = all(query, params);
    return { data, total };
}

function voidTransaction(id) {
    const tx = getTransactionById(id);
    if (!tx || tx.status === 'voided') return null;

    const transaction = db.transaction(() => {
        // Set status voided sekaligus catat waktu perubahan
        run("UPDATE transactions SET status = 'voided', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

        for (const item of tx.items) {
            if (item.product_id) {
                // Baca stok aktual SEBELUM dikembalikan (di dalam transaction untuk konsistensi)
                const current = get('SELECT stock, name FROM products WHERE id = ?', [item.product_id]);
                const stockBefore = current ? (current.stock ?? 0) : 0;
                const stockAfter = stockBefore + item.quantity;

                // Kembalikan stok produk
                run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);

                // Catat ke stock_trail — event 'void' (kuantitas positif = stok kembali)
                createStockTrail({
                    product_id: item.product_id,
                    product_name: current ? current.name : (item.product_name || 'Unknown'),
                    event_type: 'void',
                    quantity_before: stockBefore,
                    quantity_change: item.quantity,
                    quantity_after: stockAfter,
                    user_id: tx.user_id || null,
                    user_name: tx.cashier_name || null,
                    notes: `Void transaksi #${tx.invoice_number}`,
                    reference_id: id
                });

                // Catat ke stock_audit_log (backward compat dengan sistem lama)
                createStockAuditLog({
                    product_id: item.product_id,
                    product_name: current ? current.name : (item.product_name || 'Unknown'),
                    old_stock: stockBefore,
                    new_stock: stockAfter,
                    difference: item.quantity,
                    reason: `Void transaksi #${tx.invoice_number}`,
                    user_id: tx.user_id || null,
                    user_name: tx.cashier_name || null
                });
            }
        }
    });
    transaction();
    return getTransactionById(id);
}

// ─── Reports ────────────────────────────────────────────
function getDashboardStats() {
    const now = new Date();
    const todayRange = getLocalDayRangeUTC(now);

    // Invalidate cache if day or timezone offset has changed
    const todayKey = todayRange.local_date;
    const cacheKey = `${todayKey}:${cachedTimezoneOffset ?? 'auto'}`;
    if (dashboardCache.key && dashboardCache.key !== cacheKey) {
        dashboardCache.data = null;
    }
    dashboardCache.today = todayKey;
    dashboardCache.key = cacheKey;

    const todaySales = get("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?", [todayRange.start, todayRange.end]) || { count: 0, total: 0 };
    const totalProducts = get('SELECT COUNT(*) as count FROM products WHERE active = 1') || { count: 0 };
    const lowStock = get('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock <= 10') || { count: 0 };

    // Batch query for last 7 days - single query instead of 7
    const day7ago = new Date(now);
    day7ago.setDate(day7ago.getDate() - 6);
    const range7start = getLocalDayRangeUTC(day7ago).start;
    const offsetHrs = getTimezoneOffsetHours();

    const daily7Rows = all(`
        SELECT date(created_at, ? || ' hours') as local_date,
               COALESCE(SUM(total), 0) as total
        FROM transactions
        WHERE status = 'completed' AND created_at >= ? AND created_at < ?
        GROUP BY local_date
    `, [(offsetHrs >= 0 ? '+' : '') + offsetHrs, range7start, todayRange.end]);

    const daily7Map = {};
    daily7Rows.forEach(r => { daily7Map[r.local_date] = r.total; });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const r = getLocalDayRangeUTC(d);
        last7Days.push({ date: r.local_date, total: daily7Map[r.local_date] || 0 });
    }

    return {
        today_sales_count: todaySales.count,
        today_sales_total: todaySales.total,
        total_products: totalProducts.count,
        low_stock_count: lowStock.count,
        last_7_days: last7Days,
        recent_transactions: getTransactions({ limit: 5 }).data
    };
}



/**
 * Helper untuk mencegah bug parsing date-only string sebagai UTC midnight.
 * "2026-04-03" -> "2026-04-03T12:00:00" agar diparse sebagai local noon
 */
function parseDateLocal(dateStr) {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string') {
        if (dateStr.length === 10) return new Date(dateStr + 'T12:00:00');
        if (!dateStr.includes('T')) return new Date(dateStr + 'T12:00:00');
    }
    return new Date(dateStr);
}

function getLocalDayRangeUTC(dateObj = new Date()) {
    // 1. Get cached offset (avoid DB query on every call)
    let offsetHours = 7; // Default to WIB (UTC+7)
    if (cachedTimezoneOffset !== null && cachedTimezoneOffset !== 'auto') {
        offsetHours = cachedTimezoneOffset;
    } else {
        try {
            const row = get("SELECT value FROM settings WHERE key = 'timezone_offset'");
            if (row && row.value && row.value !== 'auto') {
                offsetHours = parseFloat(row.value);
                cachedTimezoneOffset = offsetHours;
            } else {
                // AUTO-DETECT: Use machine offset
                offsetHours = -(new Date().getTimezoneOffset() / 60);
                if (row && row.value === 'auto') {
                    cachedTimezoneOffset = 'auto'; // Keep it dynamic
                } else {
                    cachedTimezoneOffset = offsetHours;
                }
            }
        } catch (e) {
            offsetHours = 7;
        }
    }

    // 2. Adjust input date to "Local Time" using the offset
    const utcNow = dateObj.getTime();
    const localNow = new Date(utcNow + (offsetHours * 3600000));

    const year = localNow.getUTCFullYear();
    const month = localNow.getUTCMonth();
    const day = localNow.getUTCDate();

    // 3. Create Start and End in "Local" terms
    const startLocalTimestamp = Date.UTC(year, month, day, 0, 0, 0, 0);
    const endLocalTimestamp = Date.UTC(year, month, day + 1, 0, 0, 0, 0);

    // 4. Convert back to real UTC timestamp for database filtering
    const startUTC = new Date(startLocalTimestamp - (offsetHours * 3600000));
    const endUTC = new Date(endLocalTimestamp - (offsetHours * 3600000));

    const toSql = (d) => d.toISOString().replace('T', ' ').slice(0, 19);
    const localDate = localNow.toISOString().split('T')[0];

    return {
        // 'start' and 'end' now return the ACTUAL UTC boundaries for the queries
        start: toSql(startUTC),
        end: toSql(endUTC),
        local_date: localDate,
        startLocal: localDate + ' 00:00:00',
        endLocal: localDate + ' 23:59:59',
        debug_offset: offsetHours
    };
}

function getSqliteTimezoneModifier() {
    const offsetHrs = getTimezoneOffsetHours();
    const sign = offsetHrs >= 0 ? '+' : '';
    return `${sign}${offsetHrs} hours`;
}

/**
 * Shared aggregation engine for Dashboard and Reports
 * Ensures "Today" sales on Dashboard matches "Hari Ini" report exactly.
 */
/**
 * Authoritative aggregation engine for Dashboard and Reports.
 * Accounts for global discounts and tax by using transaction totals as the base.
 * Revenue = SUM(total - tax_amount)
 * Profit = SUM(total - tax_amount - sum_of_item_costs)
 */
function getAuthoritativeStats(startUTC, endUTC) {
    try {
        const stats = get(`
            SELECT 
                COUNT(t.id) as count, 
                COALESCE(SUM(t.total - t.tax_amount), 0) as net_revenue,
                COALESCE(SUM(t.total - t.tax_amount - IFNULL(item_costs.total_cost, 0)), 0) as profit,
                COALESCE(SUM(IFNULL(item_costs.total_cost, 0)), 0) as total_cost
            FROM transactions t
            LEFT JOIN (
                SELECT transaction_id, SUM(quantity * original_cost) as total_cost
                FROM transaction_items
                GROUP BY transaction_id
            ) item_costs ON t.id = item_costs.transaction_id
            WHERE t.status = 'completed' AND t.created_at BETWEEN ? AND ?
        `, [startUTC, endUTC]);

        if (!stats) {
            return { count: 0, total: 0, revenue: 0, cost: 0, profit: 0 };
        }

        return {
            count: stats.count || 0,
            total: stats.net_revenue || 0,
            revenue: stats.net_revenue || 0,
            cost: stats.total_cost || 0,
            profit: stats.profit || 0
        };
    } catch (err) {
        console.error('[Database] getAuthoritativeStats failed:', err.message);
        throw err;
    }
}

// --- Dashboard Sub-functions ---

function getTopProductsToday(startUTC, endUTC, limit = 5) {
    return all(`
        SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
        GROUP BY ti.product_name ORDER BY qty DESC LIMIT ?
    `, [startUTC, endUTC, limit]);
}

function getDailySalesBreakdown(days, todayRangeEnd) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const rangeStart = getLocalDayRangeUTC(startDate).start;
    const offsetHrs = getTimezoneOffsetHours();

    const offsetSign = offsetHrs >= 0 ? '+' : '';
    const offsetStr = `${offsetSign}${offsetHrs} hours`;

    const dailyRows = all(`
        SELECT date(created_at, ?) as local_date,
               COALESCE(SUM(total - tax_amount), 0) as total
        FROM transactions
        WHERE status = 'completed' AND created_at >= ? AND created_at < ?
        GROUP BY date(created_at, ?)
        ORDER BY local_date
    `, [offsetStr, rangeStart, todayRangeEnd, offsetStr]);

    const dailyMap = {};
    dailyRows.forEach(r => { dailyMap[r.local_date] = r.total; });

    const breakdown = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const r = getLocalDayRangeUTC(d);
        breakdown.push({ date: r.local_date, total: dailyMap[r.local_date] || 0 });
    }
    return breakdown;
}

function getEnhancedDashboardStats() {
    const nowTs = Date.now();
    const now = new Date();
    const todayRange = getLocalDayRangeUTC(now);
    const todayKey = todayRange.local_date;
    // Cache key includes timezone offset so changing it in Settings invalidates cache
    const cacheKey = `${todayKey}:${cachedTimezoneOffset ?? 'auto'}`;

    // Invalidate cache if day or timezone offset has changed
    if (dashboardCache.key && dashboardCache.key !== cacheKey) {
        dashboardCache.data = null;
    }

    // BYPASS CACHE for Today's stats to ensure REAL-TIME updates
    let result = null;
    if (dashboardCache.data && nowTs < dashboardCache.expiry) {
        result = { ...dashboardCache.data };
    }

    // Today/Yesterday using Authoritative engine
    const todayStats = getAuthoritativeStats(todayRange.start, todayRange.end);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayRange = getLocalDayRangeUTC(yesterdayDate);
    const yesterdayStats = getAuthoritativeStats(yesterdayRange.start, yesterdayRange.end);

    // If we have cached historical data, we can skip the heavy parts
    if (result) {
        result.today_sales_count = todayStats.count;
        result.today_sales_total = todayStats.total;
        result.yesterday_sales_count = yesterdayStats.count;
        result.yesterday_sales_total = yesterdayStats.total;
        result.today_profit = todayStats.profit;
        result.yesterday_profit = yesterdayStats.profit;
        result.today_revenue = todayStats.revenue;
        result.today_cost = todayStats.cost;
        result.recent_transactions = getTransactions({ limit: 5 }).data;
        return result;
    }

    // heavy calculations if no cache
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const weekRangeStart = getLocalDayRangeUTC(startOfWeek).start;

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekRangeStart = getLocalDayRangeUTC(lastWeekStart).start;

    const thisWeekStats = getAuthoritativeStats(weekRangeStart, todayRange.end);
    const lastWeekStats = getAuthoritativeStats(lastWeekRangeStart, weekRangeStart);

    const topProductsToday = getTopProductsToday(todayRange.start, todayRange.end, 5);
    const debtSummary = getDebtSummary();
    const daily30 = getDailySalesBreakdown(30, todayRange.end);

    const settings = getSettings();
    const lowStock = get('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock <= 10') || { count: 0 };

    result = {
        today_sales_count: todayStats.count,
        today_sales_total: todayStats.total,
        yesterday_sales_count: yesterdayStats.count,
        yesterday_sales_total: yesterdayStats.total,
        today_profit: todayStats.profit,
        yesterday_profit: yesterdayStats.profit,
        today_revenue: todayStats.revenue,
        today_cost: todayStats.cost,
        this_week_total: thisWeekStats.revenue,
        last_week_total: lastWeekStats.revenue,
        top_products_today: topProductsToday || [],
        debt_total_outstanding: debtSummary.total_outstanding,
        debt_total_count: debtSummary.total_count,
        debt_overdue_count: debtSummary.overdue_count,
        debt_overdue_total: debtSummary.overdue_total,
        last_7_days: daily30.slice(-7),
        last_30_days: daily30,
        recent_transactions: getTransactions({ limit: 5 }).data,
        last_backup_date: settings.last_backup_date || null,
        low_stock_count: lowStock.count
    };

    dashboardCache = {
        data: result,
        expiry: nowTs + 30000,
        today: todayKey,
        key: cacheKey
    };

    return result;
}

function getSalesReport(dateFrom, dateTo) {
    try {
        // Convert date strings (YYYY-MM-DD) to UTC boundaries
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));

        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const stats = getAuthoritativeStats(startUTC, endUTC);

        const summary = {
            count: stats.count,
            revenue: stats.revenue,
            average: stats.count > 0 ? stats.revenue / stats.count : 0
        };

        const paymentBreakdown = all(
            `SELECT payment_method, COUNT(*) as count, SUM(total) as total
         FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
            GROUP BY payment_method`,
            [startUTC, endUTC]
        );

        const tzModifier = getSqliteTimezoneModifier();
        const dailyBreakdown = all(
            `SELECT date(created_at, ?) as date, COUNT(*) as count, SUM(total) as total
         FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
            GROUP BY date(created_at, ?) ORDER BY date(created_at, ?)`,
            [tzModifier, startUTC, endUTC, tzModifier, tzModifier]
        );

        const topProducts = all(
            `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total
         FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
            GROUP BY ti.product_name ORDER BY qty DESC LIMIT 5`,
            [startUTC, endUTC]
        );

        const transactionLog = getTransactionLog(dateFrom, dateTo, 300);
        const hourlyBreakdown = getHourlySalesPattern(dateFrom, dateTo);

        return { summary, paymentBreakdown, dailyBreakdown, topProducts, transactionLog, hourlyBreakdown };
    } catch (err) {
        console.error('[Database] getSalesReport failed:', err.message);
        throw err;
    }
}

function getProfitReport(dateFrom, dateTo) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));

        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const products = all(
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

        const totals = products.reduce((acc, p) => ({
            revenue: acc.revenue + p.revenue,
            cost: acc.cost + p.total_cost,
            profit: acc.profit + p.profit
        }), { revenue: 0, cost: 0, profit: 0 });

        // Account for global discounts by using authoritative stats
        const authoritative = getAuthoritativeStats(startUTC, endUTC);

        const finalTotals = {
            revenue: authoritative.revenue,
            cost: totals.cost,
            profit: authoritative.profit,
            margin: authoritative.revenue > 0 ? (authoritative.profit / authoritative.revenue) * 100 : 0
        };

        const transactionLog = getTransactionLog(dateFrom, dateTo, 300);

        return { products, totals: finalTotals, transactionLog };
    } catch (err) {
        console.error('[Database] getProfitReport failed:', err.message);
        throw err;
    }
}

function getSalesByCategory(dateFrom, dateTo) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));

        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const rows = all(`
            SELECT 
                COALESCE(c.name, 'Tanpa Kategori') as category_name,
                SUM(ti.quantity) as total_quantity,
                SUM(ti.subtotal) as total_revenue
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
            GROUP BY p.category_id
            ORDER BY total_revenue DESC
        `, [startUTC, endUTC]);

        return rows;
    } catch (err) {
        console.error('[Database] getSalesByCategory failed:', err.message);
        return [];
    }
}

function getAdvancedReport(dateFrom, dateTo) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));

        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const tzModifier = getSqliteTimezoneModifier();
        const hourlySales = all(`
            SELECT 
                CAST(strftime('%H', datetime(created_at, ?)) AS INTEGER) as hour,
                COUNT(*) as transaction_count,
                SUM(total) as total_revenue
            FROM transactions 
            WHERE status = 'completed' AND created_at >= ? AND created_at < ?
            GROUP BY hour
            ORDER BY hour ASC
        `, [tzModifier, startUTC, endUTC]);

        const topProductsData = all(`
            SELECT 
                ti.product_name,
                SUM(ti.quantity) as qty,
                SUM(ti.subtotal) as total_revenue
            FROM transaction_items ti 
            JOIN transactions t ON ti.transaction_id = t.id
            WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
            GROUP BY ti.product_name
            ORDER BY qty DESC
            LIMIT 10
        `, [startUTC, endUTC]);

        const topProducts = topProductsData.map((p, i) => ({ rank: i + 1, ...p }));

        const topCustomersData = all(`
            SELECT 
                TRIM(customer_name) as customer_name,
                COUNT(*) as transaction_count,
                SUM(total) as total_revenue
            FROM transactions
            WHERE status = 'completed' 
              AND created_at >= ? AND created_at < ?
              AND customer_name IS NOT NULL 
              AND TRIM(customer_name) != ''
            GROUP BY TRIM(customer_name)
            ORDER BY total_revenue DESC
            LIMIT 10
        `, [startUTC, endUTC]);

        const topCustomers = topCustomersData.map((c, i) => ({ rank: i + 1, ...c }));

        // Calculate summary
        const totalTransactions = hourlySales.reduce((sum, h) => sum + h.transaction_count, 0);
        const totalRevenue = hourlySales.reduce((sum, h) => sum + h.total_revenue, 0);
        const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return {
            hourly_sales: hourlySales,
            top_products: topProducts,
            top_customers: topCustomers,
            summary: {
                total_transactions: totalTransactions,
                total_revenue: totalRevenue,
                avg_transaction: Math.round(avgTransaction)
            }
        };
    } catch (err) {
        console.error('[Database] getAdvancedReport failed:', err.message);
        throw err;
    }
}

function getPeriodComparison(dateFrom1, dateTo1, dateFrom2, dateTo2) {
    // [PERF] Use UTC range boundaries instead of date() function which bypasses index
    const getSummary = (from, to) => {
        const startRange = getLocalDayRangeUTC(parseDateLocal(from));
        const endRange = getLocalDayRangeUTC(parseDateLocal(to));
        return get(
            `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue, COALESCE(AVG(total), 0) as average 
            FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ? `,
            [startRange.start, endRange.end]
        ) || { count: 0, revenue: 0, average: 0 };
    };

    const periodA = getSummary(dateFrom1, dateTo1);
    const periodB = getSummary(dateFrom2, dateTo2);

    const calcDelta = (a, b) => a === 0 ? 0 : ((b - a) / a) * 100;

    return {
        periodA, periodB,
        delta: {
            revenue: calcDelta(periodA.revenue, periodB.revenue),
            count: calcDelta(periodA.count, periodB.count),
            average: calcDelta(periodA.average, periodB.average)
        }
    };
}

function getHourlySalesPattern(dateFrom, dateTo) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));
        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const tzModifier = getSqliteTimezoneModifier();
        const rows = all(
            `SELECT CAST(strftime('%H', datetime(created_at, ?)) AS INTEGER) as hour, COUNT(*) as count, SUM(total) as total
             FROM transactions WHERE status = 'completed' AND created_at >= ? AND created_at < ?
            GROUP BY hour ORDER BY hour`,
            [tzModifier, startUTC, endUTC]
        );
        const result = [];
        for (let h = 0; h < 24; h++) {
            const row = rows.find(r => r.hour === h);
            result.push(row || { hour: h, count: 0, total: 0 });
        }
        return result;
    } catch (err) {
        console.error('[Database] getHourlySalesPattern failed:', err.message);
        throw err;
    }
}

function getBottomProducts(dateFrom, dateTo) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));
        const startUTC = startRange.start;
        const endUTC = endRange.end;

        return all(
            `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total,
            SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
             FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
             LEFT JOIN products p ON ti.product_id = p.id
             WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
            GROUP BY ti.product_name ORDER BY qty ASC LIMIT 5`,
            [startUTC, endUTC]
        );
    } catch (err) {
        console.error('[Database] getBottomProducts failed:', err.message);
        throw err;
    }
}

function getSlowMovingProducts(inactiveDays = 120, limit = 10) {
    return all(
        `SELECT p.id, p.name, p.stock, p.price, p.cost, p.unit,
                c.name as category_name, p.created_at,
                MAX(t.created_at) as last_sale_date,
                CAST(
                    julianday('now') - COALESCE(
                        julianday(MAX(t.created_at)),
                        julianday(p.created_at)
                    )
                AS INTEGER) as days_inactive
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN transaction_items ti ON p.id = ti.product_id
         LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.status = 'completed'
         WHERE p.stock > 0 AND p.active = 1
         GROUP BY p.id
         HAVING (last_sale_date IS NULL AND julianday('now') - julianday(p.created_at) > ?)
             OR (last_sale_date IS NOT NULL AND julianday('now') - julianday(MAX(t.created_at)) > ?)
         ORDER BY last_sale_date ASC, p.stock DESC LIMIT ?`,
        [inactiveDays, inactiveDays, limit]
    );
}

function getTopProductsExpanded(dateFrom, dateTo, limit = 10) {
    // [PERF] Use UTC range boundaries instead of date() function which bypasses index
    const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
    const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));
    return all(
        `SELECT ti.product_id, ti.product_name, SUM(ti.quantity) as qty, COUNT(DISTINCT ti.transaction_id) as frequency,
        SUM(ti.subtotal) as total, SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
         FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id
         LEFT JOIN products p ON ti.product_id = p.id
         WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
        GROUP BY ti.product_id, ti.product_name ORDER BY qty DESC LIMIT ? `,
        [startRange.start, endRange.end, limit]
    );
}

function getTransactionLog(dateFrom, dateTo, limitSize = 500) {
    try {
        const startRange = getLocalDayRangeUTC(parseDateLocal(dateFrom));
        const endRange = getLocalDayRangeUTC(parseDateLocal(dateTo));
        const startUTC = startRange.start;
        const endUTC = endRange.end;

        const transactions = all(
            `SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id
             WHERE t.status = 'completed' AND t.created_at >= ? AND t.created_at < ?
            ORDER BY t.created_at DESC LIMIT ?`,
            [startUTC, endUTC, limitSize]
        );
        if (transactions.length === 0) return [];

        const txIds = transactions.map(t => t.id);
        const placeholders = txIds.map(() => '?').join(',');
        const allItems = all(`SELECT * FROM transaction_items WHERE transaction_id IN (${placeholders})`, txIds);

        const itemsMap = {};
        allItems.forEach(item => {
            if (!itemsMap[item.transaction_id]) itemsMap[item.transaction_id] = [];
            itemsMap[item.transaction_id].push(item);
        });

        transactions.forEach(tx => {
            tx.items = itemsMap[tx.id] || [];
        });

        return transactions;
    } catch (err) {
        console.error('[Database] getTransactionLog failed:', err.message);
        throw err;
    }
}

function getComprehensiveReport(dateFrom, dateTo) {
    const logPath = path.join(app.getPath('userData'), 'debug_report.log');
    const log = (msg) => {
        try {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
            console.log(msg);
        } catch (e) { }
    };

    try {
        log(`[getComprehensiveReport] Starting... range: ${dateFrom} to ${dateTo}`);

        // [PERF] getSalesReport already calls getTransactionLog & getHourlySalesPattern internally,
        // so we reuse its results instead of calling them again (was duplicating ~250ms of work)
        const sales = getSalesReport(dateFrom, dateTo);
        log(`[getComprehensiveReport] Sales: ${sales ? 'OK' : 'NULL'}`);

        const profit = getProfitReport(dateFrom, dateTo);
        log(`[getComprehensiveReport] Profit: ${profit ? 'OK' : 'NULL'}`);

        // Reuse hourly from sales (already computed inside getSalesReport)
        const hourly = sales?.hourlyBreakdown || getHourlySalesPattern(dateFrom, dateTo);
        log(`[getComprehensiveReport] Hourly: ${hourly ? `OK (${hourly.length})` : 'NULL'}`);

        const bottomProducts = getBottomProducts(dateFrom, dateTo);
        log(`[getComprehensiveReport] Bottom: ${bottomProducts ? `OK (${bottomProducts.length})` : 'NULL'}`);

        // [PERF] Call getTransactionLog once with the final limit (500).
        // getSalesReport fetches with limit 300 for its own summary, but getComprehensiveReport
        // needs the full 500 — so we always make this single authoritative call here.
        const transactionLog = getTransactionLog(dateFrom, dateTo, 500);
        log(`[getComprehensiveReport] TxLog: ${transactionLog ? `OK (${transactionLog.length})` : 'NULL'}`);

        const stockAudit = getStockAuditLogSummary(dateFrom, dateTo);
        log(`[getComprehensiveReport] StockAudit: ${stockAudit ? `OK (${stockAudit.length})` : 'NULL'}`);

        const stockTrail = getStockTrailAll({ date_from: dateFrom, date_to: dateTo, limit: 2000 });
        log(`[getComprehensiveReport] StockTrail: ${stockTrail ? `OK (${stockTrail.length})` : 'NULL'}`);


        const result = {
            sales,
            profit,
            hourly,
            bottomProducts,
            transactionLog,
            stockAudit,
            stockTrail
        };

        if (!result.sales || !result.profit) {
            log(`[getComprehensiveReport] CRITICAL: Missing required report data`);
        }

        log(`[getComprehensiveReport] Success. Returning result keys: ${Object.keys(result).join(', ')}`);
        return result;
    } catch (err) {
        log(`[getComprehensiveReport] ERROR: ${err.message}\n${err.stack}`);
        return null;
    }
}

// ─── Payment History & Debt ─────────────────────────────
function getPaymentHistory(transactionId) {
    return all(
        `SELECT ph.*, u.name as receiver_name FROM payment_history ph LEFT JOIN users u ON ph.received_by = u.id
         WHERE ph.transaction_id = ? ORDER BY ph.payment_date ASC`, [transactionId]
    );
}

function addPayment(transactionId, amount, paymentMethod, userId, notes) {
    const tx = get('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!tx || tx.status === 'voided' || tx.payment_status === 'lunas') return { success: false, error: 'Invalid transaction' };

    if (amount <= 0 || amount > tx.remaining_balance) return { success: false, error: 'Invalid amount' };

    const transaction = db.transaction(() => {
        run(
            'INSERT INTO payment_history(transaction_id, amount, payment_method, received_by, notes) VALUES(?, ?, ?, ?, ?)',
            [transactionId, amount, paymentMethod, userId, notes]
        );
        const newTotalPaid = tx.total_paid + amount;
        const newRemaining = tx.total - newTotalPaid;
        const newStatus = newRemaining <= 0 ? 'lunas' : tx.payment_status;

        run('UPDATE transactions SET total_paid=?, remaining_balance=?, payment_status=? WHERE id=?',
            [newTotalPaid, Math.max(0, newRemaining), newStatus, transactionId]);

        return { newStatus, isPaid: newRemaining <= 0 };
    });

    const res = transaction();
    return { success: true, transaction: getTransactionById(transactionId), ...res };
}

function getOutstandingDebts(filters = {}) {
    let query = `SELECT t.*, u.name as cashier_name 
                 FROM transactions t LEFT JOIN users u ON t.user_id = u.id
                 WHERE t.status = 'completed' AND t.payment_status IN ('pending', 'hutang', 'cicilan') AND t.remaining_balance > 0`;
    const params = [];

    if (filters.payment_status) {
        query += " AND t.payment_status = ?";
        params.push(filters.payment_status);
    }

    if (filters.customer_search && filters.customer_search.trim()) {
        const search = `%${filters.customer_search.trim()}%`;
        query += " AND (t.customer_name LIKE ? OR t.customer_address LIKE ?)";
        params.push(search, search);
    }

    if (filters.overdue_only) {
        query += " AND t.due_date IS NOT NULL AND date(t.due_date) < date('now')";
    }

    query += " ORDER BY t.due_date ASC, t.created_at DESC";
    if (filters.limit) {
        query += " LIMIT ?";
        params.push(filters.limit);
    }

    return all(query, params);
}

function getDebtSummary() {
    const overall = get(`SELECT COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as total 
                        FROM transactions 
                        WHERE status = 'completed' AND payment_status IN ('pending', 'hutang', 'cicilan') AND remaining_balance > 0`) || { count: 0, total: 0 };

    const overdue = get(`SELECT COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as total 
                        FROM transactions 
                        WHERE status = 'completed' AND payment_status IN ('pending', 'hutang', 'cicilan') AND remaining_balance > 0 
                        AND due_date IS NOT NULL AND date(due_date) < date('now')`) || { count: 0, total: 0 };

    const byStatus = all(`SELECT payment_status, COUNT(*) as count, SUM(remaining_balance) as total 
                         FROM transactions 
                         WHERE status = 'completed' AND payment_status IN ('pending', 'hutang', 'cicilan') AND remaining_balance > 0 
                         GROUP BY payment_status`);

    return {
        total_count: overall.count,
        total_outstanding: overall.total,
        overdue_count: overdue.count,
        overdue_total: overdue.total,
        by_status: byStatus
    };
}

function getOverdueTransactions() {
    return all(`
        SELECT t.*, u.name as cashier_name, julianday('now') - julianday(t.due_date) as days_overdue
        FROM transactions t LEFT JOIN users u ON t.user_id = u.id
        WHERE t.status = 'completed' AND t.payment_status IN('pending', 'hutang', 'cicilan') AND t.remaining_balance > 0
        AND t.due_date IS NOT NULL AND date(t.due_date) < date('now') ORDER BY t.due_date ASC
    `);
}

// ─── Settings & Backup ──────────────────────────────────
function getSettings() {
    if (settingsCache) return settingsCache;
    const rows = all('SELECT * FROM settings');
    const obj = {};
    for (const row of rows) obj[row.key] = row.value;
    settingsCache = obj;
    return obj;
}

function getCostMultiplier() {
    if (cachedCostMultiplier !== null) return cachedCostMultiplier;
    const settings = getSettings();
    const defaultMargin = parseFloat(settings.default_margin_percent || 10.5);
    cachedCostMultiplier = 1 - (defaultMargin / 100);
    return cachedCostMultiplier;
}

function updateSetting(key, value) {
    if (key === 'timezone_offset') cachedTimezoneOffset = null;
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    settingsCache = null;
    cachedCostMultiplier = null;
}

function updateSettings(settings) {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((sets) => {
        for (const [key, value] of Object.entries(sets)) {
            stmt.run(key, String(value));
        }
    });
    transaction(settings);
    settingsCache = null;
    cachedCostMultiplier = null;
    if ('timezone_offset' in settings) cachedTimezoneOffset = null;
    return getSettings();
}

function resetSettings() {
    run('DELETE FROM settings');
    seedSettings(); // defined in part1
    return { success: true };
}

function hardResetDatabase() {
    // This is drastic. Drop ALL tables (termasuk stock_trail & device_sessions).
    clearStmtCache();
    const tables = [
        'transaction_items', 'transactions',
        'products', 'categories',
        'users', 'settings',
        'stock_audit_log', 'payment_history',
        'stock_trail',       // [FIX] sebelumnya terlewat
        'device_sessions',   // [FIX] sebelumnya terlewat
    ];
    db.pragma('foreign_keys = OFF'); // matikan sementara agar bisa drop
    for (const t of tables) db.exec(`DROP TABLE IF EXISTS ${t}`);
    db.pragma('foreign_keys = ON');

    createTables();
    seedSettings();
    const auth = require('./auth');
    if (auth.seedDefaultAdmin) auth.seedDefaultAdmin();
    return { success: true };
}

function getDatabaseStats() {
    const tables = ['users', 'categories', 'products', 'transactions', 'transaction_items', 'settings'];
    const counts = {};
    tables.forEach(t => {
        try { counts[t] = get(`SELECT COUNT(*) as count FROM ${t} `).count; } catch (e) { counts[t] = 0; }
    });

    let fileSize = 0;
    try { fileSize = fs.statSync(dbPath).size; } catch { }
    const settings = getSettings();

    const voidedRes = get("SELECT COUNT(*) as count FROM transactions WHERE status = 'voided'");
    const dateRange = get("SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM transactions");

    return {
        counts,
        fileSize,
        lastBackupDate: settings.last_backup_date,
        voidedTransactions: voidedRes ? voidedRes.count : 0,
        oldestTransaction: dateRange ? dateRange.oldest : null,
        newestTransaction: dateRange ? dateRange.newest : null,
        autoBackupDir: settings.auto_backup_dir
    };
}

const AUTO_BACKUP_MAX_ROTATE = 3; // [FIX] Jumlah rotasi backup otomatis yang dipertahankan

async function createAutoBackup() {
    const settings = getSettings();
    const dir = settings.auto_backup_dir || path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupName = `pos-cashier-auto-${timestamp}.db`;
    const backupPath = path.join(dir, backupName);

    try {
        await db.backup(backupPath);
        run("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_date', ?)", [now.toISOString()]);
        run("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_path', ?)", [backupPath]);

        // [FIX] Rotasi: hapus backup otomatis lama jika sudah melebihi batas
        try {
            const autoFiles = fs.readdirSync(dir)
                .filter(f => f.startsWith('pos-cashier-auto-') && f.endsWith('.db'))
                .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
                .sort((a, b) => b.mtime - a.mtime); // terbaru di depan

            // Hapus yang lebih dari batas rotasi
            const toDelete = autoFiles.slice(AUTO_BACKUP_MAX_ROTATE);
            for (const f of toDelete) {
                try { fs.unlinkSync(path.join(dir, f.name)); } catch (_) { }
            }
            if (toDelete.length > 0) {
                console.log(`[AutoBackup] Rotasi: hapus ${toDelete.length} backup lama, pertahankan ${AUTO_BACKUP_MAX_ROTATE} terbaru.`);
            }
        } catch (rotateErr) {
            console.warn('[AutoBackup] Rotasi gagal (non-fatal):', rotateErr.message);
        }

        return { success: true, path: backupPath, filename: backupName };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function restoreDatabase(backupPath) {
    try {
        clearStmtCache();
        settingsCache = null;
        cachedTimezoneOffset = null;
        db.close();
        fs.copyFileSync(backupPath, dbPath);
        db = new Database(dbPath);
        applyPragmas();
        runMigrations(); // [FIX] Pastikan skema terkini setelah restore backup lama
        console.log('[Database] Restore selesai, migrasi diterapkan.');
        return { success: true, requiresRestart: true };
    } catch (e) {
        console.error('[Database] Restore gagal:', e.message);
        return { success: false, error: e.message };
    }
}

function getDatabasePath() { return dbPath; }
function getBackupDir() { return getSettings().auto_backup_dir || path.join(app.getPath('userData'), 'backups'); }
function getBackupHistory() {
    const dir = getBackupDir();
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.startsWith('pos-cashier-backup') && f.endsWith('.db'))
        .map(f => {
            const s = fs.statSync(path.join(dir, f));
            return { filename: f, path: path.join(dir, f), size: s.size, date: s.mtime.toISOString() };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
}
function deleteBackupFile(p) {
    try {
        const backupDir = path.resolve(getBackupDir());
        const targetPath = path.resolve(p);
        if (!targetPath.startsWith(backupDir)) {
            return { success: false, error: 'Path tidak valid.' };
        }
        fs.unlinkSync(targetPath);
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}
function validateBackupFile(p) {
    if (!fs.existsSync(p)) return { valid: false, error: 'Not found' };
    const s = fs.statSync(p);
    if (s.size < 100) return { valid: false, error: 'Too small' };
    return { valid: true, size: s.size };
}
function getAllTransactionsWithItems(filters = {}) { return getTransactions(filters); /* simplified wrapper */ }
function getMarginImpactStats() {
    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM products').get().count || 0;
        const autoCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE margin_mode = 'auto'").get().count || 0;
        const manualCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE margin_mode = 'manual' OR margin_mode IS NULL").get().count || 0;
        return { total, auto: autoCount, manual: manualCount };
    } catch (err) {
        console.error('[Database] Error getting margin stats:', err.message);
        return { total: 0, auto: 0, manual: 0 };
    }
}
function updateMarginSettings(percent, mode) {
    try {
        const marginPercent = parseFloat(percent) / 100;

        // Save the margin percentage to settings
        const updateSettingStmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('default_margin', ?)");
        updateSettingStmt.run(percent.toString());

        let updated = 0;

        if (mode === 'new_only') {
            // Only update the setting, don't modify any existing products
            return { success: true, updated: 0 };
        } else if (mode === 'auto_only') {
            // Update only products with margin_mode = 'auto'
            const products = db.prepare("SELECT id, price FROM products WHERE margin_mode = 'auto'").all();
            const updateStmt = db.prepare("UPDATE products SET cost = ?, updated_at = datetime('now', 'localtime') WHERE id = ?");

            const transaction = db.transaction((items) => {
                for (const product of items) {
                    const newCost = product.price * (1 - marginPercent);
                    updateStmt.run(Math.round(newCost), product.id);
                    updated++;
                }
            });
            transaction(products);
        } else if (mode === 'force_all') {
            // Update ALL products and set their margin_mode to 'auto'
            const products = db.prepare("SELECT id, price FROM products").all();
            const updateStmt = db.prepare("UPDATE products SET cost = ?, margin_mode = 'auto', updated_at = datetime('now', 'localtime') WHERE id = ?");

            const transaction = db.transaction((items) => {
                for (const product of items) {
                    const newCost = product.price * (1 - marginPercent);
                    updateStmt.run(Math.round(newCost), product.id);
                    updated++;
                }
            });
            transaction(products);
        }

        return { success: true, updated };
    } catch (err) {
        console.error('[Database] Error updating margin settings:', err.message);
        return { success: false, error: err.message };
    }
}

function clearVoidedTransactions() {
    try {
        const transaction = db.transaction(() => {
            const voidedIds = all("SELECT id FROM transactions WHERE status = 'voided'").map(r => r.id);
            if (voidedIds.length === 0) return 0;

            const placeHolders = voidedIds.map(() => '?').join(',');
            run(`DELETE FROM transaction_items WHERE transaction_id IN(${placeHolders})`, voidedIds);
            run(`DELETE FROM payment_history WHERE transaction_id IN(${placeHolders})`, voidedIds);
            const result = run(`DELETE FROM transactions WHERE id IN(${placeHolders})`, voidedIds);
            return result.changes;
        });
        const deleted = transaction();
        return { success: true, deleted };
    } catch (err) {
        console.error('[Database] Clear voided failed:', err.message);
        return { success: false, error: err.message };
    }
}

function getArchivableTransactions(months = 6) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const row = get("SELECT COUNT(*) as count FROM transactions WHERE date(created_at) < ?", [cutoffStr]);
        return { count: row ? row.count : 0, cutoffDate: cutoffStr };
    } catch (err) {
        console.error('[Database] Get archivable failed:', err.message);
        return { count: 0, error: err.message };
    }
}

function deleteOldTransactions(months = 6) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const transaction = db.transaction(() => {
            const oldIds = all("SELECT id FROM transactions WHERE date(created_at) < ?", [cutoffStr]).map(r => r.id);
            if (oldIds.length === 0) return 0;

            const placeHolders = oldIds.map(() => '?').join(',');
            run(`DELETE FROM transaction_items WHERE transaction_id IN(${placeHolders})`, oldIds);
            run(`DELETE FROM payment_history WHERE transaction_id IN(${placeHolders})`, oldIds);
            const result = run(`DELETE FROM transactions WHERE id IN(${placeHolders})`, oldIds);
            return result.changes;
        });

        const deleted = transaction();
        return { success: true, deleted };
    } catch (err) {
        console.error('[Database] Archive failed:', err.message);
        return { success: false, error: err.message };
    }
}

function getStockAuditLogSummary(dateFrom, dateTo) {
    try {
        const query = `
            SELECT 
                product_id,
                product_name, 
                COUNT(*) as change_count, 
                SUM(difference) as total_change,
                GROUP_CONCAT(DISTINCT COALESCE(user_name, 'Sistem')) as user_names,
                MIN(created_at) as first_change,
                MAX(created_at) as last_change
            FROM stock_audit_log
            WHERE date(created_at) >= ? AND date(created_at) <= ?
            GROUP BY product_id, product_name
            ORDER BY last_change DESC
        `;
        return all(query, [dateFrom, dateTo]);
    } catch (err) {
        console.error('[Database] Get audit summary failed:', err.message);
        return [];
    }
}

function getTotalDbSize() {
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    let size = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    if (fs.existsSync(walPath)) size += fs.statSync(walPath).size;
    if (fs.existsSync(shmPath)) size += fs.statSync(shmPath).size;
    return size;
}

function vacuumDatabase() {
    try {
        // Lakukan Checkpoint agresif (TRUNCATE) agar ukuran file wal terestart ke 0 byte, mencegah akumulasi file.
        db.pragma('wal_checkpoint(TRUNCATE)');

        const sizeBefore = getTotalDbSize();

        db.exec('VACUUM');

        // Pastikan WAL bersih lagi setelah VACUUM untuk mengamankan shrink file.
        db.pragma('wal_checkpoint(TRUNCATE)');

        const sizeAfter = getTotalDbSize();
        return {
            success: true,
            sizeBefore,
            sizeAfter
        };
    } catch (err) {
        console.error('[Database] Vacuum failed:', err.message);
        return { success: false, error: err.message };
    }
}

function checkDatabaseIntegrity() {
    try {
        const result = get('PRAGMA integrity_check');
        const ok = result && result.integrity_check === 'ok';
        return {
            ok,
            result: result ? result.integrity_check : 'Unknown'
        };
    } catch (err) {
        console.error('[Database] Integrity check failed:', err.message);
        return { ok: false, result: err.message };
    }
}

function closeDatabase() { clearStmtCache(); if (db) db.close(); }

// ─── AI Insight Cache ─────────────────────────────────────
/**
 * Purge AI insight cache rows whose age exceeds their own `days` period.
 * e.g. a row with days=7 expires after 7 days, days=30 after 30 days.
 * This is consistent with the isScheduleDue() calendar-period logic in main.js.
 */
function purgeExpiredAiInsightCache() {
    try {
        // Each row's TTL = its own `days` value (weekly=7d, monthly=30d, quarterly=90d)
        const result = run(
            "DELETE FROM ai_insight_cache WHERE datetime(created_at) < datetime('now', '-' || days || ' days')"
        );
        if (result && result.changes > 0) {
            console.log(`[AiCache] Purged ${result.changes} expired AI insight cache row(s)`);
        }
    } catch (e) {
        console.error('[AiCache] purgeExpiredAiInsightCache error:', e.message);
    }
}

function getAiInsightCache(days = null) {
    purgeExpiredAiInsightCache();
    if (days) {
        return get('SELECT * FROM ai_insight_cache WHERE days = ? ORDER BY id DESC LIMIT 1', [days]);
    }
    return get('SELECT * FROM ai_insight_cache ORDER BY id DESC LIMIT 1');
}

function getLatestAiInsightCache() {
    purgeExpiredAiInsightCache();
    return get('SELECT * FROM ai_insight_cache ORDER BY id DESC LIMIT 1');
}

function getTimezoneOffsetHours() {
    if (cachedTimezoneOffset !== null && cachedTimezoneOffset !== 'auto') {
        return Number(cachedTimezoneOffset);
    }
    try {
        const row = get("SELECT value FROM settings WHERE key = 'timezone_offset'");
        if (row && row.value && row.value !== 'auto') return parseFloat(row.value);
    } catch (e) { /* fallback */ }
    return -(new Date().getTimezoneOffset() / 60);
}

function saveAiInsightCache(insightJson, dataHash, days = 30) {
    run('DELETE FROM ai_insight_cache WHERE days = ?', [days]);
    run(
        'INSERT INTO ai_insight_cache (insight_json, data_hash, days, created_at) VALUES (?, ?, ?, ?)',
        [insightJson, dataHash, days, new Date().toISOString()]
    );
}

function deleteAiInsightCache(days) {
    run('DELETE FROM ai_insight_cache WHERE days = ?', [days]);
}

// ─── AI LLM Preset ────────────────────────────────────────
function getAiLlmPreset() {
    const row = get("SELECT value FROM settings WHERE key = 'ai_llm_preset'");
    return row?.value ?? 'seimbang';
}

function saveAiLlmPreset(preset) {
    run("INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_llm_preset', ?)", [preset]);
}

function analyzeDatabase() {
    try {
        db.exec('ANALYZE');
        return { success: true };
    } catch (e) {
        console.error('[Database] ANALYZE failed:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Invalidate all in-process caches.
 * Dipanggil oleh main.js setelah Worker Thread selesai menulis ke DB
 * agar read berikutnya dari main process mengambil data baru.
 */
function invalidateCaches() {
    settingsCache = null;
    cachedCostMultiplier = null;
    cachedTimezoneOffset = null;
    dashboardCache = { data: null, expiry: 0 };
    clearStmtCache();
    console.log('[Database] All caches invalidated (post-worker write)');
}

// ─── Exports ────────────────────────────────────────────
module.exports = {
    analyzeDatabase, invalidateCaches,
    initDatabase, closeDatabase, saveDatabase: () => { }, // no-op compatibility
    run, get, all, // low-level helpers (used by ai-aggregator, etc.)
    getUsers, getUserById, getUserByUsername, createUser, updateUser, deleteUser, updateUserLastLogin, invalidateUserToken,
    upsertDeviceSession, getDeviceSessions, getDeviceSessionByDeviceId, countDeviceSessions,
    getOldestDeviceSession, deleteDeviceSessionById, deleteDeviceSession,
    getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
    getProducts, getProductById, getProductByBarcode, searchProducts, getProductByName, getLowStockProducts, validateProductsActiveBulk,
    createProduct, updateProduct, deleteProduct, restoreProduct, bulkUpsertProducts, bulkDeleteProducts, bulkUpdateField,
    generateProductBarcode, generateMultipleBarcodes,
    createStockAuditLog, getStockAuditLogByProduct, getStockAuditLog, getStockAuditLogSummary, cleanupOldAuditLogs,
    createStockTrail, getStockTrailByProduct, getStockTrailAll, getStockTrailCount,
    createTransaction, getTransactionById, getTransactions, voidTransaction, generateInvoiceNumber,
    getPaymentHistory, addPayment, getOutstandingDebts, getDebtSummary, getOverdueTransactions,
    getSettings, updateSetting, updateSettings, resetSettings,
    getDashboardStats, getEnhancedDashboardStats,
    getSalesReport, getProfitReport, getSalesByCategory, getAdvancedReport, getPeriodComparison, getHourlySalesPattern, getBottomProducts, getTransactionLog, getComprehensiveReport,
    getSlowMovingProducts, getTopProductsExpanded,
    getDatabaseStats, checkDatabaseIntegrity, vacuumDatabase, analyzeDatabase,
    clearVoidedTransactions, getArchivableTransactions, deleteOldTransactions,
    getAllTransactionsWithItems, hardResetDatabase,
    getDatabasePath, getBackupDir, getBackupHistory,
    createAutoBackup, deleteBackupFile, validateBackupFile, restoreDatabase,
    createTables, seedSettings,
    getMarginImpactStats, updateMarginSettings,
    getAiInsightCache, getLatestAiInsightCache, saveAiInsightCache, deleteAiInsightCache, getTimezoneOffsetHours, purgeExpiredAiInsightCache,
    getAiLlmPreset, saveAiLlmPreset,
};
