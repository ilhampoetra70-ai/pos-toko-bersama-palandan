/**
 * REST API Server for Price Checker
 * Runs alongside Electron app, shares the same database
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
const { requireAuth } = require('./auth');

let server = null;
let db = null;
let htmlCache = null;

// ─── Simple API Response Cache ──────────────────────────
// ─── Simple API Response Cache ──────────────────────────
const apiCache = new Map();
const MAX_API_CACHE_SIZE = 300;

// Tiered Cache TTL
const CACHE_TTL_SHORT = 5000;    // 5s — real-time data (prices, stock)
const CACHE_TTL_MEDIUM = 30000;  // 30s — frequently accessed lists
const CACHE_TTL_LONG = 300000;   // 5min — static data (settings, categories)

function getCached(key) {
  const entry = apiCache.get(key);
  if (!entry) return null;

  if (Date.now() < entry.expiry) {
    // Refresh insertion order so Map behaves like LRU.
    apiCache.delete(key);
    apiCache.set(key, entry);
    return entry.data;
  }

  apiCache.delete(key);
  return null;
}

function setCache(key, data, ttl = CACHE_TTL_SHORT) {
  apiCache.set(key, { data, expiry: Date.now() + ttl });
  while (apiCache.size > MAX_API_CACHE_SIZE) {
    const oldestKey = apiCache.keys().next().value;
    if (!oldestKey) break;
    apiCache.delete(oldestKey);
  }
}

function purgeExpiredApiCache() {
  const now = Date.now();
  for (const [key, entry] of apiCache.entries()) {
    if (now >= entry.expiry) apiCache.delete(key);
  }
}

function invalidateCache(prefix) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) apiCache.delete(key);
  }
}

// ─── In-Memory Rate Limiter ──────────────────────────────────
/**
 * Factory yang menghasilkan Express middleware rate limiter.
 * Tidak butuh dependensi eksternal — pakai Map di memori.
 * @param {object} opts
 * @param {number} opts.maxAttempts  Maks request per window (default 5)
 * @param {number} opts.windowMs     Durasi window dalam ms (default 60000)
 * @param {string} opts.message      Pesan error saat rate limited
 */
function createRateLimiter({ maxAttempts = 5, windowMs = 60 * 1000, message = 'Terlalu banyak percobaan. Coba lagi nanti.' } = {}) {
  const store = new Map(); // key: IP → { count, resetAt }

  // Bersihkan entry kadaluarsa setiap 5 menit agar Map tidak membengkak
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
  cleanup.unref(); // Tidak menghalangi proses Node.js keluar

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message, retryAfter });
    }

    entry.count++;
    next();
  };
}

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
  const REPORTS_CACHE_TTL = 15000; // 15s

  // Bersihkan cache kadaluarsa berkala agar penggunaan memori stabil.
  const cacheCleanup = setInterval(() => purgeExpiredApiCache(), 60 * 1000);
  cacheCleanup.unref();

  // Percaya pada X-Forwarded-For dari reverse proxy (Cloudflare tunnel, Nginx, dll)
  // agar req.ip mengembalikan IP client asli, bukan IP proxy.
  // Penting untuk rate limiter bekerja per-user, bukan per-proxy.
  app.set('trust proxy', 1);

  // ─── Simple In-Memory Rate Limiter ───────────────────────
  // Membatasi request per IP untuk mencegah brute force pada endpoint login PWA
  const rateLimitStore = new Map(); // { ip: { count, resetAt } }
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 menit
  const RATE_LIMIT_MAX = 100; // max 100 request per 15 menit per IP

  function rateLimit(req, res, next) {
    // Hanya rate-limit endpoint login
    if (req.path !== '/auth/login') return next();

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${retryAfter} detik.`
      });
    }

    next();
  }

  // Bersihkan store setiap jam agar tidak memory leak
  const rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(ip);
    }
  }, 60 * 60 * 1000);
  rateLimitCleanup.unref();

  // Middleware
  app.use(rateLimit);
  app.use(cors({
    origin: '*', // Allow all origins for local network
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'Authorization'],
    credentials: false,
    maxAge: 86400 // Cache preflight for 24 hours
  }));
  app.use(express.json());

  // Biarkan keep-alive default Node.js aktif untuk menurunkan overhead koneksi berulang.

  // Request logging with client tracking
  let activeConnections = 0;
  app.use((req, res, next) => {
    activeConnections++;
    const clientIP = req.ip || req.socket.remoteAddress;
    // console.log(`[API] ${req.method} ${req.path} from ${clientIP} (${activeConnections} active)`);

    let decremented = false;
    const decrement = () => {
      if (!decremented) {
        activeConnections--;
        decremented = true;
      }
    };

    res.on('finish', decrement);
    res.on('close', decrement);

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

  // ─── Serve POS Admin (Full Version) ──────────────────────────
  // 1. Try bundled dist (Production/Portable)
  let posAdminPath = path.join(__dirname, '..', '..', 'mobile-admin-dist');

  // 2. Try sibling directory (Dev environment: pos-app/../pos-admin/dist)
  if (!fs.existsSync(posAdminPath)) {
    posAdminPath = path.join(__dirname, '..', '..', 'pos-admin', 'dist');
  }

  // 3. Fallback to nested mobile-admin-dist if structure differs
  if (!fs.existsSync(posAdminPath)) {
    posAdminPath = path.join(__dirname, '..', 'mobile-admin-dist');
  }

  // 4. Try asar unpacked (Production electron)
  if (!fs.existsSync(posAdminPath) || !fs.existsSync(path.join(posAdminPath, 'index.html'))) {
    posAdminPath = path.join(__dirname, '..', '..', 'app.asar.unpacked', 'mobile-admin-dist');
  }
  console.log('[API] POS Admin path:', posAdminPath);

  // ─── Dynamic Manifest for PWA ──────────────────────────────
  const handleManifest = (req, res) => {
    try {
      const settings = db.getSettings();
      const manifest = {
        name: settings.app_name || 'POS Cashier',
        short_name: settings.app_name || 'POS Admin',
        description: settings.tagline || 'Mobile admin untuk POS Cashier',
        start_url: './',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#10b981',
        orientation: 'portrait',
        icons: settings.app_logo ? [
          {
            src: settings.app_logo,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: settings.app_logo,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ] : [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      };
      res.json(manifest);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  app.get('/manifest.json', handleManifest);
  app.get('/admin/manifest.json', handleManifest);

  const handleFavicon = (req, res) => {
    try {
      const settings = db.getSettings();
      if (settings.app_logo && settings.app_logo.startsWith('data:image')) {
        const parts = settings.app_logo.split(';');
        const mimetype = parts[0].split(':')[1];
        const data = parts[1].split(',')[1];
        const img = Buffer.from(data, 'base64');
        res.set('Content-Type', mimetype);
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(img);
      }

      // When no custom logo, serve SVG
      const defaultIcon = path.join(posAdminPath, 'icons', 'icon.svg');
      if (fs.existsSync(defaultIcon)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.sendFile(defaultIcon);
      }

      res.status(204).end();
    } catch (e) {
      res.status(204).end();
    }
  };

  app.get('/favicon.ico', handleFavicon);
  app.get('/admin/favicon.ico', handleFavicon);

  app.get('/icons/icon.svg', (req, res) => {
    const defaultIcon = path.join(posAdminPath, 'icons', 'icon.svg');
    if (fs.existsSync(defaultIcon)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.sendFile(defaultIcon);
    }
    res.status(404).end();
  });

  app.use('/admin', express.static(posAdminPath, { index: false })); // Disable default index.html serving

  // Handle SPA routing for Admin (fallback to index.html for non-file requests)
  // Express 5 requires Regex literals for patterns containing special characters like (*)
  app.get(/\/admin(?:\/(.*))?$/, (req, res, next) => {
    if (path.extname(req.path)) {
      return next(); // Let express.static or 404 handler take it
    }
    const indexPath = path.join(posAdminPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      fs.readFile(indexPath, 'utf8', (err, htmlContent) => {
        if (err) {
          console.error('[API] Error reading index.html:', err);
          return res.sendFile(indexPath);
        }

        try {
          const settings = db.getSettings();
          const appName = settings.app_name || 'POS Admin';
          const appLogo = settings.app_logo || '/icons/icon.svg';

          // Inject Dynamic Title — escape untuk mencegah HTML injection
          let html = htmlContent.replace(/<title>.*?<\/title>/, `<title>${escHtml(appName)}</title>`);

          // Inject Dynamic Favicon/Icon — escape attribute values
          const safeIconType = escHtml(
            appLogo && appLogo.startsWith('data:image/svg') ? 'image/svg+xml' :
              appLogo && appLogo.startsWith('data:image/png') ? 'image/png' :
                appLogo && appLogo.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
          );
          const safeAppLogo = escHtml(appLogo);

          html = html.replace(/<link rel="icon".*?>/g, `<link rel="icon" type="${safeIconType}" href="${safeAppLogo}">`);
          html = html.replace(/<link rel="apple-touch-icon".*?>/g, `<link rel="apple-touch-icon" href="${safeAppLogo}">`);

          // Inject Global Config Script
          const configScript = `
            <script>
              window.APP_CONFIG = {
                name: ${JSON.stringify(appName)},
                logo: ${JSON.stringify(appLogo)},
                tagline: ${JSON.stringify(settings.tagline || '')}
              };
            </script>
          `;
          html = html.replace('</head>', `${configScript}</head>`);
          res.send(html);
        } catch (err) {
          console.error('[API] Error injecting HTML:', err);
          res.sendFile(indexPath);
        }
      });
    } else {
      next();
    }
  });

  // Redirect root to appropriate PWA based on domain
  app.get('/', (req, res) => {
    const host = req.hostname.toLowerCase();
    // If it's the admin domain, go to admin
    if (host.includes('admin')) {
      return res.redirect('/admin');
    }
    res.redirect('/price-checker');
  });

  // Create API Router to support both /api and /api/v2
  const apiRouter = express.Router();

  // ─── Rate Limiter: Login ──────────────────────────────────
  // Maks 5 percobaan login per IP per menit. Mencegah brute-force password.
  const loginRateLimiter = createRateLimiter({
    maxAttempts: 5,
    windowMs: 60 * 1000,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.'
  });

  // ─── Auth Middleware — semua route di bawah ini butuh JWT ─
  // Public paths (/health, /auth/login, /store, /product/:barcode) di-handle
  // di dalam requireAuth sendiri, tidak perlu router terpisah.
  apiRouter.use(requireAuth);

  // ─── Health Check ─────────────────────────────────────────
  apiRouter.get('/health', (req, res) => {
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
  apiRouter.get('/dashboard/stats', (req, res) => {
    try {
      const cached = getCached('dashboard');
      if (cached) return res.json(cached);

      const stats = db.getDashboardStats();
      const enhanced = db.getEnhancedDashboardStats();
      const debtSummary = db.getDebtSummary();
      const slowMoving = db.getSlowMovingProducts(120, 30);

      const result = {
        success: true,
        ...stats,
        ...enhanced,
        totalDebt: debtSummary.totalOutstanding || 0,
        overdueCount: debtSummary.overdueCount || 0,
        slowMovingProducts: slowMoving
      };
      setCache('dashboard', result, CACHE_TTL_MEDIUM); // 30s — data dashboard aman stale sejenak
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Laporan Analitik Mendalam (PWA) ───────────────────────
  apiRouter.get('/reports/advanced', (req, res) => {
    const t0 = Date.now();
    try {
      // Support both naming conventions: start_date/end_date (frontend) and date_from/date_to
      const startDate = req.query.start_date || req.query.date_from;
      const endDate = req.query.end_date || req.query.date_to;
      
      // Default: 7 days back if no dates provided
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const dateFrom = startDate || sevenDaysAgo;
      const dateTo = endDate || today;

      // Cache key ikut timezone setting untuk mencegah mismatch grouping date/hour.
      const timezoneOffset = db.getSettings?.().timezone_offset || 'auto';
      const cacheKey = `reports:advanced:${dateFrom}:${dateTo}:tz:${timezoneOffset}`;
      const cached = getCached(cacheKey);
      if (cached) {
        const durationMs = Date.now() - t0;
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Server-Timing', `cache;dur=${durationMs};desc="reports_advanced_cache_hit"`);
        res.setHeader('X-Reports-Duration-Ms', String(durationMs));
        return res.json(cached);
      }
      
      const data = db.getAdvancedReport(dateFrom, dateTo);
      const payload = {
        success: true,
        period: { start: dateFrom, end: dateTo },
        data: data
      };
      setCache(cacheKey, payload, REPORTS_CACHE_TTL);
      const durationMs = Date.now() - t0;
      // Telemetry additive; tidak mengubah body response.
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Server-Timing', `db;dur=${durationMs};desc="reports_advanced_total"`);
      res.setHeader('X-Reports-Duration-Ms', String(durationMs));
      res.json(payload);
    } catch (err) {
      const durationMs = Date.now() - t0;
      res.setHeader('Server-Timing', `db;dur=${durationMs};desc="reports_advanced_total_error"`);
      res.setHeader('X-Reports-Duration-Ms', String(durationMs));
      console.error('[API] /reports/advanced Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ─── Products CRUD ──────────────────────────────────────────
  apiRouter.get('/products', (req, res) => {
    try {
      const { search, category_id, low_stock, sort_by, sort_order, limit, offset } = req.query;
      const hasFilters = search || category_id || low_stock || sort_by || sort_order || limit || offset;

      // Cache hanya untuk request tanpa filter (tampilan "semua produk")
      if (!hasFilters) {
        const cached = getCached('products:all');
        if (cached) return res.json(cached);
        const result = db.getProducts({});
        const response = { success: true, ...result };
        setCache('products:all', response, CACHE_TTL_MEDIUM); // 30s
        return res.json(response);
      }

      const filters = {};
      if (search) filters.search = search;
      if (category_id) filters.category_id = parseInt(category_id);
      if (low_stock === 'true') filters.low_stock = true;
      if (sort_by) filters.sortBy = sort_by;
      if (sort_order) filters.sortOrder = sort_order;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const result = db.getProducts(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/products/slow-moving', (req, res) => {
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
  apiRouter.get('/products/generate-barcode', (req, res) => {
    try {
      const barcode = db.generateProductBarcode();
      res.json({ success: true, barcode });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Search Products (MUST be before /api/products/:id) ────
  apiRouter.get('/products/search', (req, res) => {
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

  apiRouter.get('/products/:id', (req, res) => {
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

  apiRouter.post('/products', (req, res) => {
    try {
      console.log('[API] Creating product:', JSON.stringify(req.body));
      const product = db.createProduct(req.body);
      invalidateCache('products');
      invalidateCache('dashboard');
      res.json({ success: true, id: product.id, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.put('/products/:id', (req, res) => {
    try {
      const { userId, userName, ...productData } = req.body;
      const auditInfo = {};

      if (userId) {
        auditInfo.userId = userId;
        // Try to fetch user if name not provided
        if (!userName) {
          const u = db.getUserById(userId);
          auditInfo.userName = u ? (u.name || u.username) : 'Unknown';
        } else {
          auditInfo.userName = userName;
        }
      }

      db.updateProduct(parseInt(req.params.id), productData, auditInfo);
      invalidateCache('products');
      invalidateCache('dashboard');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.put('/products/:id/restore', (req, res) => {
    try {
      const product = db.restoreProduct(parseInt(req.params.id));
      invalidateCache('products');
      invalidateCache('dashboard');
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  apiRouter.delete('/products/:id', (req, res) => {
    try {
      db.deleteProduct(parseInt(req.params.id));
      invalidateCache('products');
      invalidateCache('dashboard');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Quick Stock Update ─────────────────────────────────────
  apiRouter.post('/products/:id/stock', (req, res) => {
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

      invalidateCache('products');
      invalidateCache('dashboard');
      res.json({ success: true, product: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Stock History ──────────────────────────────────────────
  apiRouter.get('/stock-history', (req, res) => {
    try {
      const { productId, limit } = req.query;
      let history;
      if (productId) {
        history = db.getStockTrailByProduct(parseInt(productId), parseInt(limit) || 50);
      } else {
        history = db.getStockTrailAll({ limit: parseInt(limit) || 100 });
      }
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Transactions ───────────────────────────────────────────
  apiRouter.get('/transactions', (req, res) => {
    try {
      const { status, date_from, date_to, search, limit, offset } = req.query;
      const filters = {};
      if (status && status !== 'all') filters.payment_status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const result = db.getTransactions({ ...filters, customer_search: search });
      const transactions = result.data || result.transactions || [];
      res.json({ success: true, transactions, total: result.total || transactions.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/transactions/:id', (req, res) => {
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

  apiRouter.post('/transactions/:id/void', (req, res) => {
    try {
      db.voidTransaction(parseInt(req.params.id));
      invalidateCache('dashboard');
      invalidateCache('reports:advanced:');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.post('/transactions/:id/payment', (req, res) => {
    try {
      const { amount, method, userId, notes } = req.body;
      const result = db.addPayment(parseInt(req.params.id), amount, method, userId, notes);
      invalidateCache('dashboard');
      invalidateCache('debts:summary');
      invalidateCache('reports:advanced:');
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/transactions/:id/payments', (req, res) => {
    try {
      const payments = db.getPaymentHistory(parseInt(req.params.id));
      res.json({ success: true, payments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Debts ──────────────────────────────────────────────────
  apiRouter.get('/debts', (req, res) => {
    try {
      const { status, overdue, search } = req.query;
      const filters = {};
      if (status && status !== 'all') filters.payment_status = status;

      let debts = db.getOutstandingDebts({ ...filters, customer_search: search, overdue_only: overdue === 'true' });
      res.json({ success: true, debts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/debts/summary', (req, res) => {
    try {
      const cached = getCached('debts:summary');
      if (cached) return res.json(cached);
      const summary = db.getDebtSummary();
      const result = { success: true, ...summary };
      setCache('debts:summary', result, CACHE_TTL_MEDIUM); // 30s
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/settings', (req, res) => {
    try {
      const cached = getCached('settings');
      if (cached) return res.json(cached);
      const settings = db.getSettings();
      const result = { success: true, settings };
      setCache('settings', result, CACHE_TTL_LONG); // 5min cache
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.post('/settings', (req, res) => {
    try {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid settings data' });
      }

      if (settings.key && settings.value !== undefined) {
        db.updateSetting(settings.key, settings.value);
      } else {
        db.updateSettings(settings);
      }

      invalidateCache('settings');
      res.json({ success: true, settings: db.getSettings() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Auth (Simple) ──────────────────────────────────────────
  apiRouter.get('/users', (req, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin yang dapat melihat daftar pengguna.' });
    }
    try {
      const users = db.getUsers().map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        role: u.role,
        lastLogin: u.last_login
      }));
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  apiRouter.get('/users/:id', (req, res) => {
    try {
      const user = db.getUserById(parseInt(req.params.id));
      if (user) {
        res.json({
          success: true, user: {
            id: user.id,
            username: user.username,
            full_name: user.name,
            role: user.role,
            last_login: user.last_login
          }
        });
      } else {
        res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Store Info ───────────────────────────────────────
  apiRouter.get('/store', (req, res) => {
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
  apiRouter.get('/product/:barcode', (req, res) => {
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

  // ─── Get Categories ───────────────────────────────────────
  apiRouter.get('/categories', (req, res) => {
    try {
      const cached = getCached('categories');
      if (cached) return res.json(cached);
      const categories = db.getCategories();
      const result = {
        success: true,
        categories: categories.map(c => ({ id: c.id, name: c.name }))
      };
      setCache('categories', result, CACHE_TTL_LONG);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Create Category ────────────────────────────────────────
  apiRouter.post('/categories', (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
      }
      const categoryName = name.trim().toUpperCase();
      const category = db.createCategory(categoryName);
      invalidateCache('categories');
      res.json({ success: true, id: category.id, name: category.name });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ─── Get Products by Category ─────────────────────────────
  apiRouter.get('/products/category/:id', (req, res) => {
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

  // ─── Auth Login ────────────────────────────────────────────
  apiRouter.post('/auth/login', loginRateLimiter, (req, res) => {
    try {
      const { username, password, device_id, device_name } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
      }

      const auth = require('./auth');
      const result = auth.login(username, password, device_id, device_name || null);

      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          user: {
            id: result.user.id,
            username: result.user.username,
            full_name: result.user.name,
            role: result.user.role
          }
        });
      } else {
        res.status(401).json({ success: false, message: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get active device sessions for a user
  apiRouter.get('/users/:id/sessions', (req, res) => {
    try {
      const sessions = db.getDeviceSessions(parseInt(req.params.id));
      res.json({ success: true, sessions });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Revoke a specific device session (admin only)
  apiRouter.delete('/users/:id/sessions/:sessionId', (req, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin yang dapat mencabut akses perangkat.' });
    }
    try {
      const userId = parseInt(req.params.id);
      const sessionId = parseInt(req.params.sessionId);
      // Verify the session belongs to this user before deleting
      const sessions = db.getDeviceSessions(userId);
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session tidak ditemukan atau bukan milik user ini' });
      }
      db.deleteDeviceSessionById(sessionId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Mount API routers
  app.use('/api', apiRouter);
  app.use('/api/v2', apiRouter);

  // ─── 404 Handler ──────────────────────────────────────────
  app.use((req, res) => {
    // If it's a file request (has extension), don't return JSON
    if (path.extname(req.path)) {
      return res.status(404).send('Not Found');
    }

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
