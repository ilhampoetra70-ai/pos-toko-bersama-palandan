const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;
let dbPath;
let saveTimer;

// Helper: format date as YYYY-MM-DD in local timezone (NOT UTC)
function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'pos-cashier.db');
}

async function initDatabase() {
  dbPath = getDbPath();
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  createTables();
  seedSettings();
  scheduleSave();
  return db;
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

function scheduleSave() {
  // Auto-save every 5 seconds if there are changes
  if (saveTimer) clearInterval(saveTimer);
  saveTimer = setInterval(() => saveDatabase(), 5000);
}

// Helper: run query and return all rows as array of objects
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run query and return first row as object or null
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  db.run(sql, params);
  const lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0];
  const changes = db.getRowsModified();
  saveDatabase();
  return { lastInsertRowid, changes };
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'cashier')),
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER,
      price INTEGER NOT NULL DEFAULT 0,
      cost INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      image TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      subtotal INTEGER NOT NULL DEFAULT 0,
      tax_amount INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      amount_paid INTEGER NOT NULL DEFAULT 0,
      change_amount INTEGER NOT NULL DEFAULT 0,
      customer_name TEXT,
      customer_address TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'voided')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  // Migration: add customer_name and customer_address columns if they don't exist
  try { db.run('ALTER TABLE transactions ADD COLUMN customer_name TEXT'); } catch {}
  try { db.run('ALTER TABLE transactions ADD COLUMN customer_address TEXT'); } catch {}

  // Migration: add payment status tracking columns
  try { db.run("ALTER TABLE transactions ADD COLUMN payment_status TEXT DEFAULT 'lunas'"); } catch {}
  try { db.run('ALTER TABLE transactions ADD COLUMN due_date TEXT'); } catch {}
  try { db.run('ALTER TABLE transactions ADD COLUMN total_paid INTEGER DEFAULT 0'); } catch {}
  try { db.run('ALTER TABLE transactions ADD COLUMN remaining_balance INTEGER DEFAULT 0'); } catch {}
  try { db.run('ALTER TABLE transactions ADD COLUMN payment_notes TEXT'); } catch {}

  // Payment history table for installment/partial payments
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      payment_date TEXT DEFAULT (datetime('now', 'localtime')),
      received_by INTEGER,
      notes TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (received_by) REFERENCES users(id)
    )
  `);

  // Migrate existing transactions to have correct payment status values
  try {
    db.run("UPDATE transactions SET payment_status = 'lunas', total_paid = amount_paid, remaining_balance = 0 WHERE payment_status IS NULL");
  } catch {}
  db.run(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      discount INTEGER DEFAULT 0,
      subtotal INTEGER NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )
  `);

  // Stock audit log table - tracks manual stock changes only
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      old_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes (IF NOT EXISTS is implicit for sql.js when table exists)
  try { db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_stock_audit_product ON stock_audit_log(product_id)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_stock_audit_user ON stock_audit_log(user_id)'); } catch {}

  // Migration: add context_note column to stock_audit_log
  try { db.run('ALTER TABLE stock_audit_log ADD COLUMN context_note TEXT'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_stock_audit_date ON stock_audit_log(created_at)'); } catch {}

  // Migration: add last_login_at column to users
  try { db.run('ALTER TABLE users ADD COLUMN last_login_at TEXT'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_payment_history_tx ON payment_history(transaction_id)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date)'); } catch {}
  // Indexes for slow moving & top products queries
  try { db.run('CREATE INDEX IF NOT EXISTS idx_tx_items_product ON transaction_items(product_id)'); } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_tx_items_transaction ON transaction_items(transaction_id)'); } catch {}
}

function seedSettings() {
  const defaults = {
    store_name: 'My Store',
    store_address: 'Jl. Example No. 1',
    store_phone: '08123456789',
    tax_rate: '11',
    tax_enabled: 'true',
    receipt_header: 'Terima Kasih Atas Kunjungan Anda',
    receipt_footer: 'Barang yang sudah dibeli tidak dapat dikembalikan',
    printer_name: '',
    receipt_width: '58',
    receipt_template: JSON.stringify({
      sections: {
        logo: false,
        store_name: true,
        store_address: true,
        store_phone: true,
        invoice_info: true,
        tax_line: true,
        discount_line: true,
        payment_info: true,
        header_text: true,
        footer_text: true
      },
      font_size: 'medium'
    }),
    receipt_logo: '',
    print_after_transaction: 'preview'
  };
  for (const [key, value] of Object.entries(defaults)) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
  saveDatabase();
}

// ─── Users ──────────────────────────────────────────────
function getUsers() {
  return all('SELECT id, username, role, name, active, created_at FROM users ORDER BY id');
}

function getUserById(id) {
  return get('SELECT id, username, role, name, active, created_at, last_login_at FROM users WHERE id = ?', [id]);
}

function updateUserLastLogin(userId) {
  return run("UPDATE users SET last_login_at = datetime('now', 'localtime') WHERE id = ?", [userId]);
}

function getUserByUsername(username) {
  return get('SELECT * FROM users WHERE username = ?', [username]);
}

function createUser(user) {
  const result = run('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)',
    [user.username, user.password_hash, user.role, user.name]);
  return getUserById(result.lastInsertRowid);
}

function updateUser(id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active); }
  if (data.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(data.password_hash); }
  if (fields.length === 0) return getUserById(id);
  values.push(id);
  run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return getUserById(id);
}

function deleteUser(id) {
  return run('DELETE FROM users WHERE id = ?', [id]);
}

// ─── Categories ─────────────────────────────────────────
function getCategories() {
  return all('SELECT * FROM categories ORDER BY name');
}

function getCategoryById(id) {
  return get('SELECT * FROM categories WHERE id = ?', [id]);
}

function createCategory(name, description = '') {
  // Check if category already exists (case-insensitive)
  const existing = get('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [name]);
  if (existing) return existing;
  const result = run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
  return get('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
}

function updateCategory(id, name, description) {
  run('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  return get('SELECT * FROM categories WHERE id = ?', [id]);
}

function deleteCategory(id) {
  return run('DELETE FROM categories WHERE id = ?', [id]);
}

// ─── Products ───────────────────────────────────────────
function getProducts(filters = {}) {
  let query = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];

  if (filters.search) {
    query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.category_id) {
    query += ` AND p.category_id = ?`;
    params.push(Number(filters.category_id));
  }
  if (filters.active !== undefined) {
    query += ` AND p.active = ?`;
    params.push(filters.active);
  }
  query += ` ORDER BY p.name`;
  return all(query, params);
}

function getProductById(id) {
  return get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
}

function getProductByBarcode(barcode) {
  return get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?', [barcode]);
}

function searchProducts(query, limit = 20) {
  const searchTerm = `%${query}%`;
  return all(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.active = 1 AND (p.name LIKE ? OR p.barcode LIKE ?)
     ORDER BY
       CASE WHEN p.name LIKE ? THEN 0 ELSE 1 END,
       p.name
     LIMIT ?`,
    [searchTerm, searchTerm, query + '%', limit]
  );
}

function getProductByName(name) {
  return get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE LOWER(p.name) = LOWER(?) AND p.active = 1', [name]);
}

function createProduct(product) {
  const result = run(
    'INSERT INTO products (barcode, name, category_id, price, cost, stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [product.barcode || null, product.name, product.category_id || null, product.price, product.cost || 0, product.stock || 0, product.unit || 'pcs']
  );
  return getProductById(result.lastInsertRowid);
}

function updateProduct(id, data, auditInfo = null) {
  // Get current product for stock comparison
  const currentProduct = getProductById(id);
  if (!currentProduct) return null;

  const fields = [];
  const values = [];
  const allowed = ['barcode', 'name', 'category_id', 'price', 'cost', 'stock', 'unit', 'active'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) return getProductById(id);
  fields.push("updated_at = datetime('now', 'localtime')");
  values.push(id);
  run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);

  // Log stock change if stock was updated and auditInfo provided
  if (auditInfo && data.stock !== undefined && currentProduct.stock !== data.stock) {
    createStockAuditLog(
      id,
      currentProduct.name,
      auditInfo.userId,
      auditInfo.userName,
      currentProduct.stock,
      data.stock,
      auditInfo.source || 'manual',
      auditInfo.notes || ''
    );
  }

  return getProductById(id);
}

function deleteProduct(id) {
  return run('DELETE FROM products WHERE id = ?', [id]);
}

function bulkUpsertProducts(products) {
  let count = 0;
  for (const p of products) {
    try {
      db.run(
        `INSERT INTO products (barcode, name, category_id, price, cost, stock, unit)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(barcode) DO UPDATE SET
           name = excluded.name,
           category_id = excluded.category_id,
           price = excluded.price,
           cost = excluded.cost,
           stock = excluded.stock,
           unit = excluded.unit,
           updated_at = datetime('now', 'localtime')`,
        [p.barcode || null, p.name, p.category_id || null, p.price || 0, p.cost || 0, p.stock || 0, p.unit || 'pcs']
      );
      count++;
    } catch (e) {
      // skip invalid rows
    }
  }
  saveDatabase();
  return count;
}

// Bulk delete products
function bulkDeleteProducts(ids) {
  let deleted = 0;
  for (const id of ids) {
    try {
      db.run('DELETE FROM products WHERE id = ?', [id]);
      deleted++;
    } catch (e) {
      // skip errors
    }
  }
  saveDatabase();
  return { deleted };
}

// Bulk update single field for multiple products
function bulkUpdateField(ids, field, value) {
  const allowed = ['category_id', 'price', 'cost', 'stock', 'unit'];
  if (!allowed.includes(field)) {
    return { success: false, error: 'Field tidak diizinkan' };
  }

  let updated = 0;
  for (const id of ids) {
    try {
      db.run(`UPDATE products SET ${field} = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [value, id]);
      updated++;
    } catch (e) {
      // skip errors
    }
  }
  saveDatabase();
  return { success: true, updated };
}

function generateProductBarcode() {
  // Generate a unique 12-digit barcode
  // Format: 2 + YYMM + 6-digit sequential
  const now = new Date();
  const prefix = '2' + now.getFullYear().toString().slice(2) +
    (now.getMonth() + 1).toString().padStart(2, '0');

  // Find highest existing barcode with this prefix
  const row = get(
    "SELECT barcode FROM products WHERE barcode LIKE ? ORDER BY barcode DESC LIMIT 1",
    [prefix + '%']
  );

  let seq = 1;
  if (row && row.barcode) {
    const existingSeq = parseInt(row.barcode.slice(prefix.length));
    if (!isNaN(existingSeq)) seq = existingSeq + 1;
  }

  const seqStr = seq.toString().padStart(12 - prefix.length, '0');
  return prefix + seqStr;
}

function generateMultipleBarcodes(count) {
  // Generate multiple unique barcodes in batch
  const barcodes = [];
  const now = new Date();
  const prefix = '2' + now.getFullYear().toString().slice(2) +
    (now.getMonth() + 1).toString().padStart(2, '0');

  // Find highest existing barcode with this prefix
  const row = get(
    "SELECT barcode FROM products WHERE barcode LIKE ? ORDER BY barcode DESC LIMIT 1",
    [prefix + '%']
  );

  let seq = 1;
  if (row && row.barcode) {
    const existingSeq = parseInt(row.barcode.slice(prefix.length));
    if (!isNaN(existingSeq)) seq = existingSeq + 1;
  }

  for (let i = 0; i < count; i++) {
    const seqStr = (seq + i).toString().padStart(12 - prefix.length, '0');
    barcodes.push(prefix + seqStr);
  }

  return barcodes;
}

// ─── Stock Audit Log ────────────────────────────────────

// Auto-generate context note based on source and change
function generateContextNote(source, oldStock, newStock, userName) {
  const changeAmount = newStock - oldStock;
  const isIncrease = changeAmount > 0;
  const action = isIncrease ? 'Penambahan' : 'Pengurangan';
  const absChange = Math.abs(changeAmount);

  const contextMap = {
    'manual': `${action} stok manual oleh ${userName}. Stok diubah dari ${oldStock} menjadi ${newStock} (${isIncrease ? '+' : ''}${changeAmount} unit).`,
    'bulk_edit': `${action} stok via Bulk Edit/Spreadsheet. Perubahan massal: ${oldStock} → ${newStock} (${isIncrease ? '+' : ''}${changeAmount} unit).`,
    'import': `${action} stok dari Import Excel/CSV. Data diimpor: ${oldStock} → ${newStock} (${isIncrease ? '+' : ''}${changeAmount} unit).`,
    'adjustment': `Penyesuaian stok (Stock Opname). Hasil penghitungan fisik: ${oldStock} → ${newStock} (selisih ${isIncrease ? '+' : ''}${changeAmount} unit).`,
    'return': `${action} stok dari retur barang. Stok dikembalikan: ${oldStock} → ${newStock} (+${absChange} unit).`,
    'damage': `Pengurangan stok karena barang rusak/expired. Stok dihapus: ${oldStock} → ${newStock} (-${absChange} unit).`,
    'transfer': `Transfer stok antar gudang/lokasi. Perpindahan: ${oldStock} → ${newStock} (${isIncrease ? '+' : ''}${changeAmount} unit).`,
    'initial': `Stok awal produk baru. Stok diinisialisasi: ${newStock} unit.`,
  };

  return contextMap[source] || `Perubahan stok oleh ${userName}: ${oldStock} → ${newStock} (${isIncrease ? '+' : ''}${changeAmount} unit). Sumber: ${source}`;
}

function createStockAuditLog(productId, productName, userId, userName, oldStock, newStock, source = 'manual', customNote = '') {
  if (oldStock === newStock) return null; // No change, don't log

  const changeAmount = newStock - oldStock;
  let contextNote = generateContextNote(source, oldStock, newStock, userName);

  // Append custom note if provided
  if (customNote && customNote.trim()) {
    contextNote += ` | Catatan: ${customNote.trim()}`;
  }

  const result = run(
    `INSERT INTO stock_audit_log (product_id, product_name, user_id, user_name, old_stock, new_stock, change_amount, source, context_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, productName, userId, userName, oldStock, newStock, changeAmount, source, contextNote]
  );
  return result.lastInsertRowid;
}

// Cleanup audit logs older than specified days (default: 30 days / 1 month)
function cleanupOldAuditLogs(retentionDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffStr = getLocalDateString(cutoffDate);

  // Count records to be deleted
  const countResult = get(
    `SELECT COUNT(*) as count FROM stock_audit_log WHERE date(created_at) < ?`,
    [cutoffStr]
  );
  const deleteCount = countResult ? countResult.count : 0;

  if (deleteCount > 0) {
    run(`DELETE FROM stock_audit_log WHERE date(created_at) < ?`, [cutoffStr]);
    console.log(`[Audit Cleanup] Deleted ${deleteCount} audit logs older than ${retentionDays} days (before ${cutoffStr})`);
  }

  return { deleted: deleteCount, cutoffDate: cutoffStr };
}

function getStockAuditLogByProduct(productId, limit = 50) {
  return all(
    `SELECT * FROM stock_audit_log WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`,
    [productId, limit]
  );
}

function getStockAuditLog(filters = {}) {
  let query = `SELECT * FROM stock_audit_log WHERE 1=1`;
  const params = [];

  if (filters.product_id) {
    query += ` AND product_id = ?`;
    params.push(filters.product_id);
  }
  if (filters.user_id) {
    query += ` AND user_id = ?`;
    params.push(filters.user_id);
  }
  if (filters.date_from) {
    query += ` AND date(created_at) >= ?`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND date(created_at) <= ?`;
    params.push(filters.date_to);
  }
  if (filters.source) {
    query += ` AND source = ?`;
    params.push(filters.source);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(filters.limit);
  }

  return all(query, params);
}

function getStockAuditLogSummary(dateFrom, dateTo) {
  // Get summary grouped by product for the date range
  // Returns array with timestamps for each change
  const result = all(
    `SELECT
       product_id,
       product_name,
       COUNT(*) as change_count,
       SUM(change_amount) as total_change,
       GROUP_CONCAT(DISTINCT user_name) as user_names,
       MIN(created_at) as first_change,
       MAX(created_at) as last_change
     FROM stock_audit_log
     WHERE date(created_at) >= ? AND date(created_at) <= ?
     GROUP BY product_id, product_name
     ORDER BY last_change DESC`,
    [dateFrom, dateTo]
  );

  return result || [];
}

// ─── Transactions ───────────────────────────────────────
function generateInvoiceNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const count = get("SELECT COUNT(*) as cnt FROM transactions WHERE invoice_number LIKE ?", [`INV-${dateStr}%`]);
  const seq = ((count?.cnt || 0) + 1).toString().padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
}

function createTransaction(data) {
  const invoiceNumber = generateInvoiceNumber();
  const items = data.items || [];

  console.log('[createTransaction] Starting. Invoice:', invoiceNumber, 'Items count:', items.length);
  if (items.length > 0) {
    console.log('[createTransaction] First item:', JSON.stringify(items[0]));
  }

  // Payment status handling
  const paymentStatus = data.payment_status || 'lunas';
  const dueDate = data.due_date || null;
  const paymentNotes = data.payment_notes || null;

  // Calculate total_paid and remaining_balance based on payment status
  let totalPaid = 0;
  let remainingBalance = 0;
  let amountPaid = data.amount_paid;
  let changeAmount = data.change_amount;

  if (paymentStatus === 'lunas') {
    // Fully paid - existing behavior
    totalPaid = data.total;
    remainingBalance = 0;
  } else if (paymentStatus === 'pending') {
    // COD/Pay later - nothing paid yet
    totalPaid = 0;
    remainingBalance = data.total;
    amountPaid = 0;
    changeAmount = 0;
  } else if (paymentStatus === 'hutang' || paymentStatus === 'cicilan') {
    // Credit or installment - may have initial payment (DP)
    const initialPayment = data.initial_payment || 0;
    totalPaid = initialPayment;
    remainingBalance = data.total - initialPayment;
    amountPaid = initialPayment;
    changeAmount = 0;
  }

  // Insert transaction header with payment status fields
  db.run(
    `INSERT INTO transactions (invoice_number, user_id, subtotal, tax_amount, discount_amount, total, payment_method, amount_paid, change_amount, customer_name, customer_address, payment_status, due_date, total_paid, remaining_balance, payment_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, data.user_id, data.subtotal, data.tax_amount, data.discount_amount, data.total, data.payment_method, amountPaid, changeAmount, data.customer_name || null, data.customer_address || null, paymentStatus, dueDate, totalPaid, remainingBalance, paymentNotes]
  );

  const txId = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0];
  console.log('[createTransaction] Transaction ID:', txId);

  // Insert each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      db.run(
        'INSERT INTO transaction_items (transaction_id, product_id, product_name, price, quantity, discount, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [txId, item.product_id || null, item.product_name, item.price, item.quantity, item.discount || 0, item.subtotal]
      );
      console.log(`[createTransaction] Item ${i + 1} inserted: "${item.product_name}" qty=${item.quantity}`);
    } catch (err) {
      console.error(`[createTransaction] FAILED to insert item ${i + 1}:`, item.product_name, err.message);
    }

    if (item.product_id) {
      try {
        db.run("UPDATE products SET stock = stock - ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [item.quantity, item.product_id]);
      } catch (err) {
        console.error(`[createTransaction] FAILED to update stock for product ${item.product_id}:`, err.message);
      }
    }
  }

  // Record initial payment in payment_history for cicilan/hutang with DP
  if ((paymentStatus === 'cicilan' || paymentStatus === 'hutang') && totalPaid > 0) {
    db.run(
      `INSERT INTO payment_history (transaction_id, amount, payment_method, received_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [txId, totalPaid, data.payment_method, data.user_id, 'Pembayaran awal (DP)']
    );
  }

  // Save once after all inserts
  saveDatabase();

  // Verify items were saved
  const savedItems = all('SELECT * FROM transaction_items WHERE transaction_id = ?', [txId]);
  console.log('[createTransaction] Verified saved items count:', savedItems.length);

  return getTransactionById(txId);
}

function getTransactionById(id) {
  const tx = get(`SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ?`, [id]);
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
  let query = `SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1`;
  const params = [];

  if (filters.date_from) {
    query += ` AND t.created_at >= ?`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND t.created_at <= ?`;
    params.push(filters.date_to + ' 23:59:59');
  }
  if (filters.user_id) {
    query += ` AND t.user_id = ?`;
    params.push(filters.user_id);
  }
  if (filters.status) {
    query += ` AND t.status = ?`;
    params.push(filters.status);
  }
  if (filters.payment_status) {
    query += ` AND t.payment_status = ?`;
    params.push(filters.payment_status);
  }
  if (filters.customer_search) {
    query += ` AND (t.customer_name LIKE ? OR t.customer_address LIKE ?)`;
    const searchTerm = `%${filters.customer_search}%`;
    params.push(searchTerm, searchTerm);
  }
  query += ` ORDER BY t.created_at DESC`;
  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(filters.limit);
  }
  return all(query, params);
}

function voidTransaction(id) {
  const tx = getTransactionById(id);
  if (!tx || tx.status === 'voided') return null;

  run("UPDATE transactions SET status = 'voided' WHERE id = ?", [id]);
  for (const item of tx.items) {
    if (item.product_id) {
      run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }
  }
  return getTransactionById(id);
}

// ─── Settings ───────────────────────────────────────────
function getSettings() {
  const rows = all('SELECT * FROM settings');
  const obj = {};
  for (const row of rows) obj[row.key] = row.value;
  return obj;
}

function updateSetting(key, value) {
  run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

function updateSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
  }
  saveDatabase();
  return getSettings();
}

// ─── Dashboard Stats ────────────────────────────────────
function getDashboardStats() {
  const today = getLocalDateString();

  const todaySales = get(
    "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM transactions WHERE status = 'completed' AND date(created_at) = ?",
    [today]
  ) || { count: 0, total: 0 };

  const totalProducts = get('SELECT COUNT(*) as count FROM products WHERE active = 1') || { count: 0 };
  const lowStock = get('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock <= 5') || { count: 0 };

  const recentTransactions = getTransactions({ limit: 5 });

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const row = get(
      "SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE status = 'completed' AND date(created_at) = ?",
      [dateStr]
    ) || { total: 0 };
    last7Days.push({ date: dateStr, total: row.total });
  }

  return {
    today_sales_count: todaySales.count,
    today_sales_total: todaySales.total,
    total_products: totalProducts.count,
    low_stock_count: lowStock.count,
    recent_transactions: recentTransactions,
    last_7_days: last7Days
  };
}

// ─── Enhanced Dashboard Stats ───────────────────────────
function getEnhancedDashboardStats() {
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  // Existing stats
  const todaySales = get("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM transactions WHERE status='completed' AND date(created_at)=?", [today]);
  const yesterdaySales = get("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM transactions WHERE status='completed' AND date(created_at)=?", [yesterday]);
  const totalProducts = get("SELECT COUNT(*) as count FROM products WHERE active=1");
  const lowStockCount = get("SELECT COUNT(*) as count FROM products WHERE active=1 AND stock<=5");

  // Today's profit (join transaction_items with products)
  const todayProfit = get(`
    SELECT COALESCE(SUM(ti.subtotal),0) as revenue,
           COALESCE(SUM(ti.quantity * COALESCE(p.cost,0)),0) as cost
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.status='completed' AND date(t.created_at)=?
  `, [today]);

  // Weekly totals
  const thisWeekStart = getWeekStart(new Date());
  const lastWeekStart = getWeekStart(new Date(Date.now() - 7*86400000));
  const lastWeekEnd = getLocalDateString(new Date(thisWeekStart.getTime() - 86400000));

  const thisWeekTotal = get("SELECT COALESCE(SUM(total),0) as total FROM transactions WHERE status='completed' AND date(created_at)>=?", [getLocalDateString(thisWeekStart)]);
  const lastWeekTotal = get("SELECT COALESCE(SUM(total),0) as total FROM transactions WHERE status='completed' AND date(created_at)>=? AND date(created_at)<=?", [getLocalDateString(lastWeekStart), lastWeekEnd]);

  // Top 5 products today
  const topProductsToday = all(`
    SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.status='completed' AND date(t.created_at)=?
    GROUP BY ti.product_name ORDER BY qty DESC LIMIT 5
  `, [today]);

  // Low stock products (details)
  const lowStockProducts = all("SELECT name, stock FROM products WHERE active=1 AND stock<=5 ORDER BY stock LIMIT 10");

  // Last 7 and 30 days
  const last7Days = getLast7Days();
  const last30Days = getLastNDays(30);

  // Recent transactions
  const recentTransactions = getTransactions({ limit: 5 });

  // Last backup date
  const settings = getSettings();

  // Debt summary for dashboard
  const debtSummary = getDebtSummary();

  return {
    today_sales_count: todaySales?.count || 0,
    today_sales_total: todaySales?.total || 0,
    yesterday_sales_count: yesterdaySales?.count || 0,
    yesterday_sales_total: yesterdaySales?.total || 0,
    total_products: totalProducts?.count || 0,
    low_stock_count: lowStockCount?.count || 0,
    today_profit: (todayProfit?.revenue || 0) - (todayProfit?.cost || 0),
    today_revenue: todayProfit?.revenue || 0,
    today_cost: todayProfit?.cost || 0,
    this_week_total: thisWeekTotal?.total || 0,
    last_week_total: lastWeekTotal?.total || 0,
    top_products_today: topProductsToday || [],
    low_stock_products: lowStockProducts || [],
    last_7_days: last7Days,
    last_30_days: last30Days,
    recent_transactions: recentTransactions,
    last_backup_date: settings.last_backup_date || null,
    // Debt info
    debt_total_outstanding: debtSummary.total_outstanding || 0,
    debt_total_count: debtSummary.total_count || 0,
    debt_overdue_count: debtSummary.overdue_count || 0,
    debt_overdue_total: debtSummary.overdue_total || 0
  };
}

function getLast7Days() {
  return getLastNDays(7);
}

function getLastNDays(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const row = get("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM transactions WHERE status='completed' AND date(created_at)=?", [dateStr]);
    result.push({ date: dateStr, count: row?.count || 0, total: row?.total || 0 });
  }
  return result;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

// ─── Reports ────────────────────────────────────────────
function getSalesReport(dateFrom, dateTo) {
  const summary = get(
    `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue,
      COALESCE(AVG(total),0) as average
    FROM transactions WHERE status='completed'
      AND date(created_at) >= ? AND date(created_at) <= ?`,
    [dateFrom, dateTo]
  ) || { count: 0, revenue: 0, average: 0 };

  const paymentBreakdown = all(
    `SELECT payment_method, COUNT(*) as count, SUM(total) as total
    FROM transactions WHERE status='completed'
      AND date(created_at) >= ? AND date(created_at) <= ?
    GROUP BY payment_method`,
    [dateFrom, dateTo]
  );

  const dailyBreakdown = all(
    `SELECT date(created_at) as date, COUNT(*) as count, SUM(total) as total
    FROM transactions WHERE status='completed'
      AND date(created_at) >= ? AND date(created_at) <= ?
    GROUP BY date(created_at) ORDER BY date(created_at)`,
    [dateFrom, dateTo]
  );

  const topProducts = all(
    `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.status='completed'
      AND date(t.created_at) >= ? AND date(t.created_at) <= ?
    GROUP BY ti.product_name ORDER BY qty DESC LIMIT 10`,
    [dateFrom, dateTo]
  );

  return { summary, paymentBreakdown, dailyBreakdown, topProducts };
}

function getProfitReport(dateFrom, dateTo) {
  const products = all(
    `SELECT ti.product_name,
      SUM(ti.quantity) as qty,
      SUM(ti.subtotal) as revenue,
      SUM(ti.quantity * COALESCE(p.cost, 0)) as total_cost,
      SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.status='completed'
      AND date(t.created_at) >= ? AND date(t.created_at) <= ?
    GROUP BY ti.product_name
    ORDER BY profit DESC`,
    [dateFrom, dateTo]
  );

  const totals = products.reduce((acc, p) => {
    acc.revenue += p.revenue;
    acc.cost += p.total_cost;
    acc.profit += p.profit;
    return acc;
  }, { revenue: 0, cost: 0, profit: 0 });

  totals.margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  return { products, totals };
}

function getPeriodComparison(dateFrom1, dateTo1, dateFrom2, dateTo2) {
  const getSummary = (from, to) => {
    return get(
      `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue,
        COALESCE(AVG(total),0) as average
      FROM transactions WHERE status='completed'
        AND date(created_at) >= ? AND date(created_at) <= ?`,
      [from, to]
    ) || { count: 0, revenue: 0, average: 0 };
  };

  const periodA = getSummary(dateFrom1, dateTo1);
  const periodB = getSummary(dateFrom2, dateTo2);

  const delta = {
    revenue: periodA.revenue === 0 ? 0 : ((periodB.revenue - periodA.revenue) / periodA.revenue) * 100,
    count: periodA.count === 0 ? 0 : ((periodB.count - periodA.count) / periodA.count) * 100,
    average: periodA.average === 0 ? 0 : ((periodB.average - periodA.average) / periodA.average) * 100,
  };

  return { periodA, periodB, delta };
}

function getHourlySalesPattern(dateFrom, dateTo) {
  const rows = all(
    `SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as count, SUM(total) as total
    FROM transactions WHERE status='completed'
      AND date(created_at) >= ? AND date(created_at) <= ?
    GROUP BY strftime('%H', created_at) ORDER BY hour`,
    [dateFrom, dateTo]
  );
  const hourMap = {};
  rows.forEach(r => { hourMap[r.hour] = r; });
  const result = [];
  for (let h = 0; h < 24; h++) {
    result.push(hourMap[h] || { hour: h, count: 0, total: 0 });
  }
  return result;
}

function getBottomProducts(dateFrom, dateTo) {
  return all(
    `SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as total,
      SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.status='completed'
      AND date(t.created_at) >= ? AND date(t.created_at) <= ?
    GROUP BY ti.product_name ORDER BY qty ASC LIMIT 5`,
    [dateFrom, dateTo]
  );
}

// Slow Moving Products - products with no sales in X days
// Only includes products that:
// 1. Were sold before BUT last sale > X days ago, OR
// 2. Were CREATED > X days ago AND never sold (old inventory)
function getSlowMovingProducts(inactiveDays = 120, limit = 10) {
  return all(
    `SELECT
      p.id,
      p.name,
      p.stock,
      p.price,
      p.cost,
      c.name as category_name,
      p.created_at as product_created_at,
      MAX(t.created_at) as last_sale_date,
      CASE
        WHEN MAX(t.created_at) IS NOT NULL THEN
          CAST(JULIANDAY('now', 'localtime') - JULIANDAY(MAX(t.created_at)) AS INTEGER)
        ELSE
          CAST(JULIANDAY('now', 'localtime') - JULIANDAY(p.created_at) AS INTEGER)
      END as days_inactive,
      CASE
        WHEN MAX(t.created_at) IS NULL THEN 1
        ELSE 0
      END as never_sold
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN transaction_items ti ON p.id = ti.product_id
    LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.status = 'completed'
    WHERE p.stock > 0 AND p.active = 1
    GROUP BY p.id
    HAVING days_inactive > ?
    ORDER BY days_inactive DESC, p.stock DESC
    LIMIT ?`,
    [inactiveDays, limit]
  );
}

// Top Products with expandable limit
function getTopProductsExpanded(dateFrom, dateTo, limit = 10) {
  return all(
    `SELECT
      ti.product_id,
      ti.product_name,
      SUM(ti.quantity) as qty,
      COUNT(DISTINCT ti.transaction_id) as frequency,
      SUM(ti.subtotal) as total,
      SUM(ti.subtotal) - SUM(ti.quantity * COALESCE(p.cost, 0)) as profit
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.status='completed'
      AND date(t.created_at) >= ? AND date(t.created_at) <= ?
    GROUP BY ti.product_id, ti.product_name
    ORDER BY qty DESC
    LIMIT ?`,
    [dateFrom, dateTo, limit]
  );
}

function getTransactionLog(dateFrom, dateTo) {
  const transactions = all(
    `SELECT t.*, u.name as cashier_name
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.status='completed'
      AND date(t.created_at) >= ? AND date(t.created_at) <= ?
    ORDER BY t.created_at DESC LIMIT 500`,
    [dateFrom, dateTo]
  );
  for (const tx of transactions) {
    tx.items = all(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [tx.id]
    );
  }
  return transactions;
}

function getComprehensiveReport(dateFrom, dateTo) {
  return {
    sales: getSalesReport(dateFrom, dateTo),
    profit: getProfitReport(dateFrom, dateTo),
    hourly: getHourlySalesPattern(dateFrom, dateTo),
    bottomProducts: getBottomProducts(dateFrom, dateTo),
    transactionLog: getTransactionLog(dateFrom, dateTo)
  };
}

// ─── Database Management ────────────────────────────────
function getDatabaseStats() {
  const tables = ['users', 'categories', 'products', 'transactions', 'transaction_items', 'settings'];
  const counts = {};
  for (const table of tables) {
    const row = get(`SELECT COUNT(*) as count FROM ${table}`);
    counts[table] = row ? row.count : 0;
  }

  let fileSize = 0;
  try {
    if (fs.existsSync(dbPath)) {
      fileSize = fs.statSync(dbPath).size;
    }
  } catch {}

  const settings = getSettings();
  const oldestTx = get("SELECT MIN(created_at) as oldest FROM transactions");
  const newestTx = get("SELECT MAX(created_at) as newest FROM transactions");
  const voidedCount = get("SELECT COUNT(*) as count FROM transactions WHERE status = 'voided'");

  return {
    counts,
    fileSize,
    lastBackupDate: settings.last_backup_date || null,
    lastBackupPath: settings.last_backup_path || null,
    autoBackupDir: settings.auto_backup_dir || null,
    oldestTransaction: oldestTx?.oldest || null,
    newestTransaction: newestTx?.newest || null,
    voidedTransactions: voidedCount?.count || 0
  };
}

function checkDatabaseIntegrity() {
  try {
    const result = db.exec('PRAGMA integrity_check');
    const value = result[0]?.values[0]?.[0] || 'unknown';
    return { ok: value === 'ok', result: value };
  } catch (e) {
    return { ok: false, result: e.message };
  }
}

function vacuumDatabase() {
  saveDatabase();
  let sizeBefore = 0;
  try { sizeBefore = fs.statSync(dbPath).size; } catch {}

  try {
    db.run('VACUUM');
    saveDatabase();
    let sizeAfter = 0;
    try { sizeAfter = fs.statSync(dbPath).size; } catch {}
    return { success: true, sizeBefore, sizeAfter, saved: sizeAfter - sizeBefore };
  } catch (e) {
    return { success: false, error: e.message, sizeBefore, sizeAfter: sizeBefore, saved: 0 };
  }
}

function clearVoidedTransactions() {
  const countRow = get("SELECT COUNT(*) as count FROM transactions WHERE status = 'voided'");
  const count = countRow?.count || 0;
  if (count === 0) return { success: true, deleted: 0 };

  const voidedIds = all("SELECT id FROM transactions WHERE status = 'voided'");
  const ids = voidedIds.map(r => r.id);
  for (const id of ids) {
    db.run('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
  }
  db.run("DELETE FROM transactions WHERE status = 'voided'");
  saveDatabase();
  return { success: true, deleted: count };
}

function getArchivableTransactions(monthsOld) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsOld);
  const cutoffStr = getLocalDateString(cutoff);
  const row = get("SELECT COUNT(*) as count FROM transactions WHERE date(created_at) < ?", [cutoffStr]);
  return { count: row?.count || 0, cutoffDate: cutoffStr };
}

function deleteOldTransactions(monthsOld) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsOld);
  const cutoffStr = getLocalDateString(cutoff);

  const oldTxIds = all("SELECT id FROM transactions WHERE date(created_at) < ?", [cutoffStr]);
  const ids = oldTxIds.map(r => r.id);
  for (const id of ids) {
    db.run('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
  }
  db.run("DELETE FROM transactions WHERE date(created_at) < ?", [cutoffStr]);
  saveDatabase();
  return { success: true, deleted: ids.length, cutoffDate: cutoffStr };
}

function getAllTransactionsWithItems(filters = {}) {
  let query = `SELECT t.*, u.name as cashier_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1`;
  const params = [];

  if (filters.date_from) {
    query += ` AND t.created_at >= ?`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND t.created_at <= ?`;
    params.push(filters.date_to + ' 23:59:59');
  }
  if (filters.status) {
    query += ` AND t.status = ?`;
    params.push(filters.status);
  }
  query += ` ORDER BY t.created_at DESC`;

  const transactions = all(query, params);
  for (const tx of transactions) {
    tx.items = all('SELECT * FROM transaction_items WHERE transaction_id = ?', [tx.id]);
  }
  return transactions;
}

function resetSettings() {
  db.run('DELETE FROM settings');
  seedSettings();
  return { success: true };
}

function hardResetDatabase() {
  const tables = ['transaction_items', 'transactions', 'products', 'categories', 'users', 'settings'];
  for (const table of tables) {
    db.run(`DROP TABLE IF EXISTS ${table}`);
  }
  createTables();
  seedSettings();
  const auth = require('./auth');
  auth.seedDefaultAdmin();
  saveDatabase();
  return { success: true };
}

function getDatabasePath() {
  return dbPath;
}

function getBackupDir() {
  const settings = getSettings();
  if (settings.auto_backup_dir) return settings.auto_backup_dir;
  const defaultDir = path.join(app.getPath('userData'), 'backups');
  if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
  return defaultDir;
}

function getBackupHistory() {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('pos-cashier-backup-') && f.endsWith('.db'))
    .map(f => {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      return {
        filename: f,
        path: fullPath,
        size: stat.size,
        date: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return files;
}

function createAutoBackup() {
  saveDatabase();
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') + '-' +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  const backupName = `pos-cashier-backup-${timestamp}.db`;
  const backupPath = path.join(dir, backupName);
  fs.copyFileSync(dbPath, backupPath);

  // Update settings
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_date', ?)", [now.toISOString()]);
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_path', ?)", [backupPath]);
  saveDatabase();

  // Cleanup old backups (keep 30)
  const backups = getBackupHistory();
  if (backups.length > 30) {
    for (let i = 30; i < backups.length; i++) {
      try { fs.unlinkSync(backups[i].path); } catch {}
    }
  }

  return { success: true, path: backupPath, filename: backupName };
}

function deleteBackupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File tidak ditemukan' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function validateBackupFile(filePath) {
  if (!fs.existsSync(filePath)) return { valid: false, error: 'File tidak ditemukan' };
  const stat = fs.statSync(filePath);
  if (stat.size < 100) return { valid: false, error: 'File terlalu kecil' };

  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);
    const magic = header.toString('ascii', 0, 15);
    if (magic !== 'SQLite format 3') return { valid: false, error: 'Bukan file database SQLite' };
  } catch (e) {
    return { valid: false, error: e.message };
  }

  return { valid: true, size: stat.size };
}

function restoreDatabase(backupPath) {
  const validation = validateBackupFile(backupPath);
  if (!validation.valid) return { success: false, error: validation.error };

  // Create safety backup first
  createAutoBackup();

  try {
    fs.copyFileSync(backupPath, dbPath);
    return { success: true, requiresRestart: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── Payment History & Debt Management ──────────────────
function getPaymentHistory(transactionId) {
  return all(`
    SELECT ph.*, u.name as receiver_name
    FROM payment_history ph
    LEFT JOIN users u ON ph.received_by = u.id
    WHERE ph.transaction_id = ?
    ORDER BY ph.payment_date ASC
  `, [transactionId]);
}

function addPayment(transactionId, amount, paymentMethod, userId, notes) {
  const tx = get('SELECT * FROM transactions WHERE id = ?', [transactionId]);
  if (!tx) return { success: false, error: 'Transaksi tidak ditemukan' };
  if (tx.status === 'voided') return { success: false, error: 'Transaksi sudah di-void' };
  if (tx.payment_status === 'lunas') return { success: false, error: 'Transaksi sudah lunas' };
  if (amount <= 0) return { success: false, error: 'Jumlah pembayaran harus lebih dari 0' };
  if (amount > tx.remaining_balance) return { success: false, error: 'Jumlah pembayaran melebihi sisa tagihan' };

  // Insert payment history record
  db.run(
    `INSERT INTO payment_history (transaction_id, amount, payment_method, received_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [transactionId, amount, paymentMethod, userId, notes || null]
  );

  // Update transaction totals
  const newTotalPaid = tx.total_paid + amount;
  const newRemainingBalance = tx.total - newTotalPaid;
  const newStatus = newRemainingBalance <= 0 ? 'lunas' : tx.payment_status;

  db.run(
    `UPDATE transactions SET total_paid = ?, remaining_balance = ?, payment_status = ? WHERE id = ?`,
    [newTotalPaid, Math.max(0, newRemainingBalance), newStatus, transactionId]
  );

  saveDatabase();

  return {
    success: true,
    transaction: getTransactionById(transactionId),
    new_status: newStatus,
    is_fully_paid: newRemainingBalance <= 0
  };
}

function getOutstandingDebts(filters = {}) {
  let query = `
    SELECT t.*, u.name as cashier_name
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.status = 'completed'
      AND t.payment_status IN ('pending', 'hutang', 'cicilan')
      AND t.remaining_balance > 0
  `;
  const params = [];

  if (filters.payment_status) {
    query += ` AND t.payment_status = ?`;
    params.push(filters.payment_status);
  }
  if (filters.customer_search) {
    query += ` AND (t.customer_name LIKE ? OR t.customer_address LIKE ?)`;
    const searchTerm = `%${filters.customer_search}%`;
    params.push(searchTerm, searchTerm);
  }
  if (filters.overdue_only) {
    query += ` AND t.due_date IS NOT NULL AND date(t.due_date) < date('now', 'localtime')`;
  }

  query += ` ORDER BY t.due_date ASC, t.created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(filters.limit);
  }

  return all(query, params);
}

function getDebtSummary() {
  const today = getLocalDateString();

  // Total outstanding by status
  const byStatus = all(`
    SELECT payment_status, COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as total
    FROM transactions
    WHERE status = 'completed'
      AND payment_status IN ('pending', 'hutang', 'cicilan')
      AND remaining_balance > 0
    GROUP BY payment_status
  `);

  // Overdue count and total
  const overdue = get(`
    SELECT COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as total
    FROM transactions
    WHERE status = 'completed'
      AND payment_status IN ('pending', 'hutang', 'cicilan')
      AND remaining_balance > 0
      AND due_date IS NOT NULL
      AND date(due_date) < date('now', 'localtime')
  `) || { count: 0, total: 0 };

  // Total overall
  const overall = get(`
    SELECT COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as total
    FROM transactions
    WHERE status = 'completed'
      AND payment_status IN ('pending', 'hutang', 'cicilan')
      AND remaining_balance > 0
  `) || { count: 0, total: 0 };

  return {
    by_status: byStatus,
    overdue_count: overdue.count,
    overdue_total: overdue.total,
    total_count: overall.count,
    total_outstanding: overall.total
  };
}

function getOverdueTransactions() {
  return all(`
    SELECT t.*, u.name as cashier_name,
           julianday('now', 'localtime') - julianday(t.due_date) as days_overdue
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.status = 'completed'
      AND t.payment_status IN ('pending', 'hutang', 'cicilan')
      AND t.remaining_balance > 0
      AND t.due_date IS NOT NULL
      AND date(t.due_date) < date('now', 'localtime')
    ORDER BY t.due_date ASC
  `);
}

function closeDatabase() {
  if (saveTimer) clearInterval(saveTimer);
  saveDatabase();
  if (db) db.close();
}

module.exports = {
  initDatabase, closeDatabase, saveDatabase,
  getUsers, getUserById, getUserByUsername, createUser, updateUser, deleteUser, updateUserLastLogin,
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getProducts, getProductById, getProductByBarcode, searchProducts, getProductByName, createProduct, updateProduct, deleteProduct, bulkUpsertProducts, bulkDeleteProducts, bulkUpdateField, generateProductBarcode, generateMultipleBarcodes,
  // Stock Audit Log
  createStockAuditLog, getStockAuditLogByProduct, getStockAuditLog, getStockAuditLogSummary, cleanupOldAuditLogs,
  createTransaction, getTransactionById, getTransactions, voidTransaction, generateInvoiceNumber,
  // Payment & Debt Management
  getPaymentHistory, addPayment, getOutstandingDebts, getDebtSummary, getOverdueTransactions,
  getSettings, updateSetting, updateSettings,
  getDashboardStats, getEnhancedDashboardStats,
  getSalesReport, getProfitReport, getPeriodComparison,
  getHourlySalesPattern, getBottomProducts, getTransactionLog, getComprehensiveReport,
  getSlowMovingProducts, getTopProductsExpanded,
  // Database Management
  getDatabaseStats, checkDatabaseIntegrity, vacuumDatabase,
  clearVoidedTransactions, getArchivableTransactions, deleteOldTransactions,
  getAllTransactionsWithItems, resetSettings, hardResetDatabase,
  getDatabasePath, getBackupDir, getBackupHistory,
  createAutoBackup, deleteBackupFile, validateBackupFile, restoreDatabase,
  createTables, seedSettings
};
