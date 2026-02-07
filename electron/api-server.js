/**
 * REST API Server for Price Checker
 * Runs alongside Electron app, shares the same database
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');

let server = null;
let db = null;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function createAPIServer(database, port = 3001) {
  db = database;
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*', // Allow all origins for local network
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'Authorization'],
    credentials: false,
    maxAge: 86400 // Cache preflight for 24 hours
  }));
  app.use(express.json());

  // Ensure connections don't hang
  app.use((req, res, next) => {
    res.set('Connection', 'close'); // Don't keep connections open
    next();
  });

  // Request logging with client tracking
  let activeConnections = 0;
  app.use((req, res, next) => {
    activeConnections++;
    const clientIP = req.ip || req.socket.remoteAddress;
    console.log(`[API] ${req.method} ${req.path} from ${clientIP} (${activeConnections} active)`);

    res.on('finish', () => {
      activeConnections--;
    });
    res.on('close', () => {
      activeConnections--;
    });

    next();
  });

  // ─── Serve Price Checker PWA ────────────────────────────────
  // Handle both development and production (asar unpacked) paths
  let priceCheckerPath = path.join(__dirname, '..', 'price-checker');

  // In production, check for asar.unpacked path
  if (!fs.existsSync(priceCheckerPath)) {
    // Try asar.unpacked location
    priceCheckerPath = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'price-checker');
  }

  console.log('[API] Price Checker path:', priceCheckerPath);
  console.log('[API] Price Checker exists:', fs.existsSync(priceCheckerPath));

  app.use('/price-checker', express.static(priceCheckerPath));

  // Redirect root to price-checker for convenience
  app.get('/', (req, res) => {
    res.redirect('/price-checker');
  });

  // ─── Health Check ─────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      success: true,
      serverName: 'POS Cashier Server',
      app: 'POS Cashier API',
      version: '1.0.0',
      port: port,
      time: new Date().toISOString()
    });
  });

  // ─── Dashboard Stats ────────────────────────────────────────
  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const stats = db.getDashboardStats();
      const enhanced = db.getEnhancedDashboardStats();
      const debtSummary = db.getDebtSummary();
      const slowMoving = db.getSlowMovingProducts(120, 30);

      res.json({
        success: true,
        ...stats,
        ...enhanced,
        totalDebt: debtSummary.totalOutstanding || 0,
        overdueCount: debtSummary.overdueCount || 0,
        slowMovingProducts: slowMoving
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Products CRUD ──────────────────────────────────────────
  app.get('/api/products', (req, res) => {
    try {
      const { search, category_id, low_stock, limit, offset } = req.query;
      const filters = {};
      if (search) filters.search = search;
      if (category_id) filters.category_id = parseInt(category_id);
      if (low_stock === 'true') filters.low_stock = true;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const result = db.getProducts(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/products/slow-moving', (req, res) => {
    try {
      const days = parseInt(req.query.days) || 120;
      const limit = parseInt(req.query.limit) || 30;
      const products = db.getSlowMovingProducts(days, limit);
      res.json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Generate Barcode ───────────────────────────────────────
  app.get('/api/products/generate-barcode', (req, res) => {
    try {
      const barcode = db.generateProductBarcode();
      res.json({ success: true, barcode });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      const product = db.getProductById(parseInt(req.params.id));
      if (product) {
        res.json({ success: true, product });
      } else {
        res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/products', (req, res) => {
    try {
      const result = db.createProduct(req.body);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      db.updateProduct(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      db.deleteProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Quick Stock Update ─────────────────────────────────────
  app.post('/api/products/:id/stock', (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { adjustment, userId = 1, notes = '' } = req.body;

      const product = db.getProductById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }

      const newStock = product.stock + adjustment;
      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'Stok tidak boleh negatif' });
      }

      const user = db.getUserById(userId);
      const updated = db.updateProduct(productId, { stock: newStock }, {
        userId,
        userName: user?.username || 'Admin',
        source: 'manual',
        notes: notes
      });

      res.json({ success: true, product: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Stock History ──────────────────────────────────────────
  app.get('/api/stock-history', (req, res) => {
    try {
      const { productId } = req.query;
      const history = productId
        ? db.getStockAuditLogByProduct(parseInt(productId))
        : db.getStockAuditLog({});
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Transactions ───────────────────────────────────────────
  app.get('/api/transactions', (req, res) => {
    try {
      const { status, date_from, date_to, search, limit, offset } = req.query;
      const filters = {};
      if (status && status !== 'all') filters.payment_status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const result = db.getTransactions(filters);

      // Filter by search if provided
      let transactions = result.transactions || result;
      if (search) {
        const s = search.toLowerCase();
        transactions = transactions.filter(tx =>
          (tx.invoice_number && tx.invoice_number.toLowerCase().includes(s)) ||
          (tx.customer_name && tx.customer_name.toLowerCase().includes(s))
        );
      }

      res.json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/transactions/:id', (req, res) => {
    try {
      const tx = db.getTransactionById(parseInt(req.params.id));
      if (tx) {
        const payments = db.getPaymentHistory(tx.id);
        res.json({ success: true, transaction: { ...tx, paymentHistory: payments } });
      } else {
        res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/transactions/:id/void', (req, res) => {
    try {
      db.voidTransaction(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/transactions/:id/payment', (req, res) => {
    try {
      const { amount, method, userId, notes } = req.body;
      const result = db.addPayment(parseInt(req.params.id), amount, method, userId, notes);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/transactions/:id/payments', (req, res) => {
    try {
      const payments = db.getPaymentHistory(parseInt(req.params.id));
      res.json({ success: true, payments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Debts ──────────────────────────────────────────────────
  app.get('/api/debts', (req, res) => {
    try {
      const { status, overdue, search } = req.query;
      const filters = {};
      if (status && status !== 'all') filters.payment_status = status;

      let debts = db.getOutstandingDebts(filters);

      if (overdue === 'true') {
        debts = debts.filter(d => d.is_overdue);
      }
      if (search) {
        const s = search.toLowerCase();
        debts = debts.filter(d =>
          (d.customer_name && d.customer_name.toLowerCase().includes(s)) ||
          (d.invoice_number && d.invoice_number.toLowerCase().includes(s))
        );
      }

      res.json({ success: true, debts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/debts/summary', (req, res) => {
    try {
      const summary = db.getDebtSummary();
      res.json({ success: true, ...summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Auth (Simple) ──────────────────────────────────────────
  app.get('/api/users', (req, res) => {
    try {
      const users = db.getUsers().map(u => ({
        id: u.id, username: u.username, fullName: u.full_name, role: u.role
      }));
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/users/:id', (req, res) => {
    try {
      const user = db.getUserById(parseInt(req.params.id));
      if (user) {
        res.json({ success: true, user: {
          id: user.id,
          username: user.username,
          full_name: user.name,
          role: user.role,
          last_login: user.last_login_at
        }});
      } else {
        res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Store Info ───────────────────────────────────────
  app.get('/api/store', (req, res) => {
    try {
      const settings = db.getSettings();
      res.json({
        success: true,
        store: {
          name: settings.store_name || 'POS Cashier',
          address: settings.store_address || '',
          phone: settings.store_phone || ''
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Product by Barcode ───────────────────────────────
  app.get('/api/product/:barcode', (req, res) => {
    try {
      const barcode = req.params.barcode;
      const product = db.getProductByBarcode(barcode);

      if (product) {
        // Get category name
        const category = db.getCategoryById(product.category_id);
        res.json({
          success: true,
          product: {
            id: product.id,
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            unit: product.unit,
            category: category ? category.name : null,
            stock: product.stock,
            image: product.image || null
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Produk tidak ditemukan'
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Search Products ──────────────────────────────────────
  app.get('/api/products/search', (req, res) => {
    try {
      const query = req.query.q || '';
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);

      if (query.length < 2) {
        return res.json({ success: true, products: [] });
      }

      const products = db.searchProducts(query, limit);

      // Get categories for products
      const categories = db.getCategories();
      const categoryMap = {};
      categories.forEach(c => categoryMap[c.id] = c.name);

      const results = products.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        price: p.price,
        unit: p.unit,
        category: categoryMap[p.category_id] || null,
        stock: p.stock
      }));

      res.json({ success: true, products: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Categories ───────────────────────────────────────
  app.get('/api/categories', (req, res) => {
    try {
      const categories = db.getCategories();
      res.json({
        success: true,
        categories: categories.map(c => ({ id: c.id, name: c.name }))
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Create Category ────────────────────────────────────────
  app.post('/api/categories', (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
      }
      const categoryName = name.trim().toUpperCase();
      const category = db.createCategory(categoryName);
      res.json({ success: true, id: category.id, name: category.name });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Products by Category ─────────────────────────────
  app.get('/api/products/category/:id', (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;

      const result = db.getProducts({ category_id: categoryId, limit, offset });

      res.json({
        success: true,
        products: result.products.map(p => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          price: p.price,
          unit: p.unit,
          stock: p.stock
        })),
        total: result.total
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── 404 Handler ──────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan'
    });
  });

  // ─── Error Handler ────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('[API Error]', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  });

  return app;
}

function startServer(database, port = 3001) {
  return new Promise((resolve, reject) => {
    try {
      const app = createAPIServer(database, port);
      const localIP = getLocalIP();

      server = app.listen(port, '0.0.0.0', () => {
        const info = {
          port,
          localUrl: `http://localhost:${port}`,
          networkUrl: `http://${localIP}:${port}`,
          localIP
        };
        console.log(`\n╔════════════════════════════════════════════╗`);
        console.log(`║  API Server Started                        ║`);
        console.log(`╠════════════════════════════════════════════╣`);
        console.log(`║  Local:   ${info.localUrl.padEnd(30)}║`);
        console.log(`║  Network: ${info.networkUrl.padEnd(30)}║`);
        console.log(`╚════════════════════════════════════════════╝\n`);
        resolve(info);
      });

      // ─── Multi-device connection settings ────────────────────
      server.maxConnections = 100; // Allow many simultaneous connections
      server.keepAliveTimeout = 5000; // 5 seconds keep-alive
      server.headersTimeout = 6000; // Slightly higher than keepAliveTimeout

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[API] Port ${port} in use, trying ${port + 1}...`);
          resolve(startServer(database, port + 1));
        } else {
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[API] Server stopped');
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function getServerInfo() {
  if (!server) return null;
  const address = server.address();
  const localIP = getLocalIP();
  return {
    port: address.port,
    localUrl: `http://localhost:${address.port}`,
    networkUrl: `http://${localIP}:${address.port}`,
    localIP
  };
}

module.exports = {
  startServer,
  stopServer,
  getServerInfo,
  getLocalIP
};
