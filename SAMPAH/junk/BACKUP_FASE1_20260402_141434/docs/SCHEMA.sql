-- Database Schema Extracted from database.js
-- Use this for reference instead of reading the full 1600+ line database.js file

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    role TEXT,
    last_login DATETIME,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    barcode TEXT UNIQUE,
    name TEXT,
    price REAL,
    cost REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    margin_mode TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS transactions (
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
);

CREATE TABLE IF NOT EXISTS transaction_items (
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
);

CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    amount REAL,
    payment_method TEXT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INTEGER,
    notes TEXT,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS stock_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name TEXT,
    old_stock INTEGER,
    new_stock INTEGER,
    difference INTEGER DEFAULT 0,
    reason TEXT,
    user_id INTEGER,
    user_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'initial', 'sale', 'restock', 'adjustment', 'void', 'return'
    quantity_before INTEGER DEFAULT 0,
    quantity_change INTEGER DEFAULT 0,
    quantity_after INTEGER DEFAULT 0,
    user_id INTEGER,
    user_name TEXT,
    notes TEXT,
    reference_id INTEGER,
    created_at DATETIME DEFAULT(datetime('now', 'localtime'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_trail_product ON stock_trail(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_trail_event ON stock_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_stock_trail_created ON stock_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_name ON transaction_items(product_name);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(active, stock);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);
