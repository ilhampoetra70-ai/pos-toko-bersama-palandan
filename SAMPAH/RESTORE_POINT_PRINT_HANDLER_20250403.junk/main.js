const { app, BrowserWindow, ipcMain, dialog, nativeImage, net } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const database = require('./database');
const auth = require('./auth');
const printer = require('./printer');
const { printHtml, validatePrinter } = require('./print-handler');
const apiServer = require('./api-server');
const aiDownload = require('./ai-download');
const aiAggregator = require('./ai-aggregator');
const aiService = require('./ai-service');
const aiApiService = require('./ai-api-service');
const ExcelJS = require('exceljs');
const workerManager = require('./worker-manager');

// ─── Low-Spec Optimizations ─────────────────────────────
// Reduce memory usage for low-spec devices
const totalRamMB = Math.floor(require('os').totalmem() / 1024 / 1024);
const v8HeapMB = totalRamMB >= 4096 ? 512 : 256;
app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${v8HeapMB}`);
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
// Disable features not needed for POS app
app.commandLine.appendSwitch('disable-features', 'TranslateUI,BlinkGenPropertyTrees');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-component-extensions-with-background-pages');
// Reduce disk cache
app.commandLine.appendSwitch('disk-cache-size', '10485760'); // 10MB

let mainWindow;
const isDev = !app.isPackaged;

function createWindow() {
  // Deteksi ukuran layar monitor
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Kalkulasi ukuran window optimal berdasarkan monitor
  // Target aspect ratio 16:10 untuk POS
  let windowWidth = 1280;
  let windowHeight = 800;

  // Jika monitor kecil (laptop 1366x768), kurangi ukuran
  if (screenWidth <= 1366) {
    windowWidth = Math.min(1200, screenWidth - 40);
    windowHeight = Math.min(720, screenHeight - 60);
  }
  // Jika monitor besar (Full HD atau lebih), gunakan ukuran lebih besar
  else if (screenWidth >= 1920) {
    windowWidth = 1400;
    windowHeight = 900;
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1024,
    minHeight: 700,
    fullscreen: false,  // Non-fullscreen agar bisa disesuaikan
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Low-spec optimizations
      backgroundThrottling: false,
      enableWebSQL: false,
      spellcheck: false,
      v8CacheOptions: 'bypassHeatCheck',
    },
    title: 'POS Kasir',
    autoHideMenuBar: true,
    show: false,
    // Performance optimizations
    backgroundColor: '#f3f4f6',
  });

  // Apply branding
  const settings = database.getSettings();
  if (settings.app_logo) {
    try {
      const img = nativeImage.createFromDataURL(settings.app_logo);
      mainWindow.setIcon(img);
    } catch (e) {
      console.error('Failed to set icon:', e);
    }
  }
  if (settings.app_name) {
    mainWindow.setTitle(settings.app_name);
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:6173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Set zoom factor berdasarkan ukuran layar untuk konsistensi UI
    const { screen } = require('electron');
    const display = screen.getPrimaryDisplay();
    const dpiScale = display.scaleFactor;

    // Jika DPI scale tinggi (HiDPI/Retina), sesuaikan zoom
    if (dpiScale >= 1.5) {
      mainWindow.webContents.setZoomFactor(0.9);
    } else if (dpiScale <= 1.0 && display.workAreaSize.width <= 1366) {
      // Monitor kecil dengan DPI normal, sedikit zoom out
      mainWindow.webContents.setZoomFactor(0.95);
    }
  });

  // Handler resize window untuk maintain aspect ratio
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    // Minimum aspect ratio check
    if (width < 1024) {
      mainWindow.setSize(1024, height);
    }
    if (height < 700) {
      mainWindow.setSize(width, 700);
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

const AUTO_BACKUP_INTERVAL_DAYS = 4;

// ─── AI Auto-Generate: Penjadwalan otomatis ──────────────
function getStartOfCurrentWeek() {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysBack = dow === 0 ? 6 : dow - 1; // mundur ke Senin
  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getStartOfCurrentQuarter() {
  const now = new Date();
  const qMonth = Math.floor(now.getMonth() / 3) * 3; // 0, 3, 6, atau 9
  return new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
}

// Cache dianggap "perlu diperbarui" jika dibuat sebelum awal periode saat ini
function isScheduleDue(cache, scheduleType) {
  if (!cache?.created_at) return true;
  const cacheTime = new Date(cache.created_at).getTime();
  let periodStart;
  if (scheduleType === 'weekly') periodStart = getStartOfCurrentWeek();
  else if (scheduleType === 'monthly') periodStart = getStartOfCurrentMonth();
  else if (scheduleType === 'quarterly') periodStart = getStartOfCurrentQuarter();
  else return false;
  return cacheTime < periodStart.getTime();
}

let autoGenerateRunning = false;

// Logika generate yang dipakai bersama oleh IPC handler dan auto-generate
async function performAiGenerate(forceRefresh = false, days = 30) {
  try {
    const aggregated = aiAggregator.aggregate(days);
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(aggregated)).digest('hex');

    if (!forceRefresh) {
      const cached = database.getAiInsightCache(days);
      if (cached) {
        try {
          return { success: true, data: JSON.parse(cached.insight_json), created_at: cached.created_at, from_cache: true };
        } catch { /* corrupt cache — regenerate */ }
      }
    }

    const settings = database.getSettings();
    const aiMode = settings.ai_mode || 'local';

    let result;
    if (aiMode === 'api') {
      console.log(`[AI] Using API mode (days=${days})`);
      const provider = settings.ai_api_provider || 'groq';
      let apiKeys = {};
      try { if (settings.ai_api_keys) apiKeys = JSON.parse(settings.ai_api_keys); } catch (e) { }

      result = await aiApiService.generateInsightViaApi(aggregated, {
        provider: provider,
        apiKey: apiKeys[provider] || settings.ai_api_key || '',
        model: settings.ai_api_model || '',
        baseUrl: settings.ai_api_base_url || '',
      });
    } else {
      console.log(`[AI] Using local model mode (days=${days})`);
      if (!aiDownload.isModelReady()) {
        return { success: false, status: 'not_ready', error: 'Model lokal belum didownload' };
      }
      result = await aiService.generateInsight(aggregated);
    }

    if (result.success) {
      database.saveAiInsightCache(JSON.stringify(result.data), dataHash, days);
    }
    return result;
  } catch (err) {
    console.error('[AI] Error in performAiGenerate:', err.message);
    return { success: false, error: err.message, status: 'unexpected_error' };
  }
}

// Jalankan auto-generate untuk periode yang sudah jatuh tempo
async function runAutoGenerate() {
  if (autoGenerateRunning) { console.log('[AI Auto] Already running, skip'); return; }

  const schedules = [
    { days: 7, type: 'weekly', label: '7-hari (mingguan)' },
    { days: 30, type: 'monthly', label: '30-hari (bulanan)' },
    { days: 90, type: 'quarterly', label: '90-hari (triwulan)' },
  ];

  const dueTasks = schedules.filter(s => isScheduleDue(database.getAiInsightCache(s.days), s.type));
  if (dueTasks.length === 0) { console.log('[AI Auto] Semua insight masih up-to-date'); return; }

  autoGenerateRunning = true;
  console.log(`[AI Auto] Generate: ${dueTasks.map(t => t.label).join(', ')}`);

  for (const task of dueTasks) {
    mainWindow?.webContents.send('ai:autoGenerating', { days: task.days });
    const result = await performAiGenerate(false, task.days);
    mainWindow?.webContents.send('ai:autoGenerateDone', { days: task.days, success: result.success });
    if (result.success && !result.from_cache) console.log(`[AI Auto] ${task.label}: selesai`);
    else if (!result.success) console.warn(`[AI Auto] ${task.label}: gagal —`, result.error);
  }

  autoGenerateRunning = false;
  console.log('[AI Auto] Selesai');
}

function scheduleAutoBackup() {
  const checkAndBackup = () => {
    try {
      const settings = database.getSettings();
      // Hanya jalankan backup otomatis jika storage path sudah dikonfigurasi
      if (!settings.auto_backup_dir) return;

      const lastBackup = settings.last_backup_date;
      const intervalMs = AUTO_BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
      const shouldBackup = !lastBackup || (Date.now() - new Date(lastBackup).getTime() >= intervalMs);

      if (shouldBackup) {
        database.createAutoBackup();
        console.log(`[AutoBackup] Backup otomatis dibuat (interval ${AUTO_BACKUP_INTERVAL_DAYS} hari)`);
      }
    } catch (e) {
      console.error('[AutoBackup] Error:', e.message);
    }
  };

  // Cek pertama setelah 30 detik, lalu setiap 6 jam
  setTimeout(() => {
    checkAndBackup();
    setInterval(checkAndBackup, 6 * 60 * 60 * 1000);
  }, 30000);
}

// Daily cleanup of old audit logs (> 1 month)
function scheduleAuditCleanup() {
  const RETENTION_DAYS = 30; // 1 month
  let lastCleanupDate = null;

  const runCleanup = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Only run once per day
      if (lastCleanupDate === today) return;

      const result = database.cleanupOldAuditLogs(RETENTION_DAYS);
      lastCleanupDate = today;

      if (result.deleted > 0) {
        console.log(`[AuditCleanup] Cleaned up ${result.deleted} old audit logs (before ${result.cutoffDate})`);
      }

      // [PERF] Run ANALYZE daily to keep index statistics up to date
      const analyzeResult = database.analyzeDatabase();
      if (analyzeResult && analyzeResult.success) {
        console.log(`[Database] Daily ANALYZE completed successfully`);
      }
    } catch (e) {
      console.error('[AuditCleanup] Error:', e.message);
    }
  };

  // First cleanup after 1 minute, then every 24 hours
  setTimeout(() => {
    runCleanup();
    setInterval(runCleanup, 24 * 60 * 60 * 1000); // 24 hours
  }, 60000); // 1 minute delay on startup
}

// Hourly cleanup of old AI insight cache (> 24 hours)
function scheduleAiCacheCleanup() {
  const runCleanup = () => {
    try {
      database.purgeExpiredAiInsightCache();
    } catch (e) {
      console.error('[AiCacheCleanup] Error:', e.message);
    }
  };

  // Run initial cleanup after 2 minutes, then run every 1 hour
  setTimeout(() => {
    runCleanup();
    setInterval(runCleanup, 60 * 60 * 1000); // 1 hour
  }, 120000);
}

app.whenReady().then(async () => {
  console.log('[POS] App ready, initializing...');
  await database.initDatabase();
  // Pass saved custom model path (if any) so aiDownload resolves the right file on startup
  const aiSettings = database.getSettings();
  aiDownload.init(aiSettings.ai_custom_model_path || null);
  console.log('[POS] Database initialized');
  auth.seedDefaultAdmin();
  auth.seedMasterKey();
  console.log('[POS] Auth seeded');
  registerIpcHandlers();
  console.log('[POS] IPC handlers registered');
  createWindow();
  console.log('[POS] Window created');
  
  // ─── Validasi Printer Settings ────────────────────────
  // Cek apakah printer yang tersimpan masih tersedia di sistem
  setTimeout(async () => {
    try {
      const settings = database.getSettings();
      const savedPrinter = settings.printer_name;
      
      if (savedPrinter && mainWindow) {
        const validation = await validatePrinter(mainWindow.webContents, savedPrinter);
        
        if (!validation.valid) {
          console.warn('[POS] Printer validation failed:', savedPrinter);
          // Simpan error untuk ditampilkan di UI
          database.updateSetting('printer_validation_error', JSON.stringify({
            saved: savedPrinter,
            available: validation.available,
            timestamp: Date.now()
          }));
        } else {
          // Clear error jika sebelumnya ada
          database.updateSetting('printer_validation_error', '');
        }
      }
    } catch (err) {
      console.error('[POS] Printer validation error:', err.message);
    }
  }, 3000); // Delay 3 detik agar window sudah siap
  
  scheduleAutoBackup();
  scheduleAuditCleanup();
  scheduleAiCacheCleanup();
  // Auto-generate AI insight jika jadwal jatuh tempo (delay 8 detik agar UI selesai load)
  setTimeout(() => { runAutoGenerate().catch(err => console.error('[AI Auto] Error:', err)); }, 8000);
  console.log('[POS] Scheduled tasks set');

  // Set window title from store name or app name
  const settings = database.getSettings();
  const baseTitle = settings.app_name || 'POS Kasir';
  mainWindow.setTitle(settings.store_name || baseTitle);

  // Enforce Auto-Start if enabled in DB
  if (settings.auto_start === 'true') {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: ['--process-start-args', `"--hidden"`]
    });
    console.log('[POS] Enforced auto-start logic from DB');
  }
  console.log('[POS] Settings loaded');

  // Start API server for Price Checker
  console.log('[POS] Starting API server...');
  try {
    const serverInfo = await apiServer.startServer(database, 3001);
    console.log('[POS] API server ready for Price Checker connections');
  } catch (err) {
    console.error('[POS] Failed to start API server:', err.message);
    console.error('[POS] Stack:', err.stack);
  }
});

app.on('window-all-closed', async () => {
  await apiServer.stopServer();
  database.closeDatabase();
  app.quit();
});

app.on('before-quit', () => {
  database.saveDatabase();
});

function registerIpcHandlers() {
  // ─── Auth ───────────────────────────────────────────
  ipcMain.handle('auth:login', (_, username, password) => {
    return auth.login(username, password);
  });

  ipcMain.handle('auth:verify', (_, token) => {
    const decoded = auth.verifyToken(token);
    if (!decoded) return { success: false };
    return { success: true, user: decoded };
  });

  ipcMain.handle('auth:resetPasswordWithMasterKey', (_, username, masterKey, newPassword) => {
    return auth.resetPasswordWithMasterKey(username, masterKey, newPassword);
  });

  ipcMain.handle('auth:changeMasterKey', (_, oldMasterKey, newMasterKey) => {
    return auth.changeMasterKey(oldMasterKey, newMasterKey);
  });

  ipcMain.handle('auth:logout', (_, userId) => {
    auth.invalidateToken(userId);
    return { success: true };
  });

  // TOTP (Google Authenticator) handlers
  ipcMain.handle('totp:isAvailable', () => {
    return auth.isTOTPAvailable();
  });

  ipcMain.handle('totp:getStatus', async (_, userId) => {
    // Jika tidak ada userId, gunakan dari current session
    if (!userId && mainWindow?.webContents) {
      // Coba dapatkan dari session storage
      try {
        const token = await mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pos_token")');
        if (token) {
          const decoded = auth.verifyToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (e) {
        return { success: false, error: 'Tidak dapat mengambil status TOTP.' };
      }
    }
    if (!userId) {
      return { success: false, error: 'User tidak terautentikasi.' };
    }
    return auth.getTOTPStatus(userId);
  });

  ipcMain.handle('totp:generateSetup', async (_, userId) => {
    if (!userId && mainWindow?.webContents) {
      try {
        const token = await mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pos_token")');
        if (token) {
          const decoded = auth.verifyToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (e) {
        return { success: false, error: 'Tidak dapat menggenerate setup TOTP.' };
      }
    }
    if (!userId) {
      return { success: false, error: 'User tidak terautentikasi.' };
    }
    return auth.generateTOTPSetup(userId);
  });

  ipcMain.handle('totp:verifyAndEnable', async (_, token, userId) => {
    if (!userId && mainWindow?.webContents) {
      try {
        const token = await mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pos_token")');
        if (token) {
          const decoded = auth.verifyToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (e) {
        return { success: false, error: 'Tidak dapat mengaktifkan TOTP.' };
      }
    }
    if (!userId) {
      return { success: false, error: 'User tidak terautentikasi.' };
    }
    return auth.verifyAndEnableTOTP(userId, token);
  });

  ipcMain.handle('totp:disable', async (_, password, userId) => {
    if (!userId && mainWindow?.webContents) {
      try {
        const token = await mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pos_token")');
        if (token) {
          const decoded = auth.verifyToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (e) {
        return { success: false, error: 'Tidak dapat menonaktifkan TOTP.' };
      }
    }
    if (!userId) {
      return { success: false, error: 'User tidak terautentikasi.' };
    }
    return auth.disableTOTP(userId, password);
  });

  ipcMain.handle('totp:resetPassword', (_, username, totpCode, newPassword) => {
    return auth.resetPasswordWithTOTP(username, totpCode, newPassword);
  });

  ipcMain.handle('totp:regenerateBackupCodes', async (_, password, userId) => {
    if (!userId && mainWindow?.webContents) {
      try {
        const token = await mainWindow.webContents.executeJavaScript('sessionStorage.getItem("pos_token")');
        if (token) {
          const decoded = auth.verifyToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (e) {
        return { success: false, error: 'Tidak dapat meregenerate backup codes.' };
      }
    }
    if (!userId) {
      return { success: false, error: 'User tidak terautentikasi.' };
    }
    return auth.regenerateBackupCodes(userId, password);
  });

  // ─── Users ──────────────────────────────────────────
  ipcMain.handle('users:getAll', () => database.getUsers());

  ipcMain.handle('users:create', (_, data) => {
    data.password_hash = auth.hashPassword(data.password);
    delete data.password;
    return database.createUser(data);
  });

  ipcMain.handle('users:update', (_, id, data) => {
    try {
      if (data.password) {
        data.password_hash = auth.hashPassword(data.password);
        delete data.password;
      }
      const user = database.updateUser(id, data);
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:markPasswordChanged', (_, userId) => {
    try {
      database.run('UPDATE users SET password_changed = 1 WHERE id = ?', [userId]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:delete', (_, id) => database.deleteUser(id));

  // ─── Categories ─────────────────────────────────────
  ipcMain.handle('categories:getAll', () => database.getCategories());
  ipcMain.handle('categories:create', (_, name, desc) => database.createCategory(name, desc));
  ipcMain.handle('categories:update', (_, id, name, desc) => database.updateCategory(id, name, desc));
  ipcMain.handle('categories:delete', (_, id) => database.deleteCategory(id));

  // ─── Products ───────────────────────────────────────
  ipcMain.handle('products:getAll', (_, filters) => database.getProducts(filters));
  ipcMain.handle('products:getById', (_, id) => database.getProductById(id));
  ipcMain.handle('products:getByBarcode', (_, barcode) => {
    const result = database.getProductByBarcode(barcode);
    return result || null;
  });
  ipcMain.handle('products:create', (_, data) => database.createProduct(data));
  ipcMain.handle('products:update', (_, id, data) => database.updateProduct(id, data));
  ipcMain.handle('products:delete', (_, id) => database.deleteProduct(id));
  ipcMain.handle('products:restore', (_, id) => {
    return database.restoreProduct(id);
  });
  // [PERF] Jalankan bulkUpsert di Worker Thread agar UI tidak freeze saat import Excel besar
  ipcMain.handle('products:bulkUpsert', async (_, products) => {
    try {
      const dbPath = database.getDatabasePath();
      const { success, results, error } = await workerManager.runBulkUpsertWorker(
        dbPath,
        products,
        (processed, total) => {
          // Forward progress ke renderer jika mainWindow masih ada
          mainWindow?.webContents.send('products:bulkUpsertProgress', { processed, total });
        }
      );

      if (!success) {
        console.error('[IPC products:bulkUpsert] Worker failed:', error);
        // Fallback ke implementasi sync jika worker gagal
        return database.bulkUpsertProducts(products);
      }

      // Invalidate caches in main process after worker writes to DB
      database.invalidateCaches();
      return results;
    } catch (err) {
      console.error('[IPC products:bulkUpsert] Unexpected error:', err.message);
      return database.bulkUpsertProducts(products);
    }
  });
  ipcMain.handle('products:bulkDelete', (_, ids) => database.bulkDeleteProducts(ids));
  ipcMain.handle('products:bulkUpdateField', (_, ids, field, value) => database.bulkUpdateField(ids, field, value));
  ipcMain.handle('products:getLowStock', (_, threshold) => database.getLowStockProducts(threshold));

  // Product update with audit
  ipcMain.handle('products:updateWithAudit', (_, id, data, auditInfo) => {
    return database.updateProduct(id, data, auditInfo);
  });

  // ─── Stock Audit Log ─────────────────────────────────
  ipcMain.handle('stockAudit:getByProduct', (_, productId, limit) => {
    return database.getStockAuditLogByProduct(productId, limit);
  });

  ipcMain.handle('stockAudit:getAll', (_, filters) => {
    return database.getStockAuditLog(filters);
  });

  ipcMain.handle('stockAudit:getSummary', (_, dateFrom, dateTo) => {
    return database.getStockAuditLogSummary(dateFrom, dateTo);
  });

  ipcMain.handle('stockAudit:create', (_, log) => {
    database.createStockAuditLog(log);
    return { success: true };
  });

  // ─── Stock Trail (New Audit System) ─────────────────────
  ipcMain.handle('stockTrail:create', (_, data) => {
    database.createStockTrail(data);
    return { success: true };
  });

  ipcMain.handle('stockTrail:getByProduct', (_, productId, limit) => {
    return database.getStockTrailByProduct(productId, limit);
  });

  ipcMain.handle('stockTrail:getAll', (_, filters) => {
    return database.getStockTrailAll(filters);
  });

  ipcMain.handle('stockTrail:count', (_, filters) => {
    return database.getStockTrailCount(filters);
  });

  // ─── Transactions ───────────────────────────────────
  ipcMain.handle('transactions:create', (_, data) => {
    try {
      const result = database.createTransaction(data);
      return result;
    } catch (err) {
      console.error('[IPC transactions:create] ERROR:', err.message, err.stack);
      throw err;
    }
  });
  ipcMain.handle('transactions:getAll', (_, filters) => {
    try {
      return database.getTransactions(filters);
    } catch (err) {
      console.error('[IPC transactions:getAll]', err.message);
      throw err;
    }
  });
  ipcMain.handle('transactions:getById', (_, id) => {
    try {
      return database.getTransactionById(id) || null;
    } catch (err) {
      console.error('[IPC transactions:getById]', err.message);
      throw err;
    }
  });
  ipcMain.handle('transactions:void', (_, id) => {
    try {
      return database.voidTransaction(id) || null;
    } catch (err) {
      console.error('[IPC transactions:void]', err.message);
      throw err;
    }
  });

  ipcMain.handle('transactions:addPayment', (_, txId, amount, method, userId, notes) => {
    try {
      return database.addPayment(txId, amount, method, userId, notes);
    } catch (err) {
      console.error('[IPC transactions:addPayment]', err.message);
      throw err;
    }
  });

  ipcMain.handle('transactions:getPaymentHistory', (_, txId) => {
    try {
      return database.getPaymentHistory(txId);
    } catch (err) {
      console.error('[IPC transactions:getPaymentHistory]', err.message);
      throw err;
    }
  });

  // ─── Debt Management ──────────────────────────────────
  ipcMain.handle('debts:getOutstanding', (_, filters) => {
    try {
      const data = database.getOutstandingDebts(filters);
      return { success: true, data };
    } catch (err) {
      console.error('[IPC debts:getOutstanding]', err.message);
      return { success: false, data: [] };
    }
  });

  ipcMain.handle('debts:getSummary', () => {
    try {
      return database.getDebtSummary();
    } catch (err) {
      console.error('[IPC debts:getSummary]', err.message);
      throw err;
    }
  });

  ipcMain.handle('debts:getOverdue', () => {
    try {
      return database.getOverdueTransactions();
    } catch (err) {
      console.error('[IPC debts:getOverdue]', err.message);
      throw err;
    }
  });

  // ─── Settings ───────────────────────────────────────
  ipcMain.handle('settings:getAll', () => database.getSettings());

  // Membaca master key plaintext yang di-generate saat instalasi pertama
  // Hanya tersedia jika belum pernah di-clear oleh admin
  ipcMain.handle('settings:getMasterKeyDisplay', () => {
    const settings = database.getSettings();
    return { key: settings.master_key_display || null };
  });

  // Hapus plaintext master key dari DB setelah admin melihat dan mencatatnya
  ipcMain.handle('settings:clearMasterKeyDisplay', () => {
    database.updateSetting('master_key_display', '');
    return { success: true };
  });

  ipcMain.handle('settings:update', (_, settings) => {
    const result = database.updateSettings(settings);

    // Live update window title/icon
    if (mainWindow) {
      if (settings.app_name || settings.store_name) {
        const fullSettings = database.getSettings(); // Get merged settings
        const baseTitle = fullSettings.app_name || 'POS Kasir';
        mainWindow.setTitle(fullSettings.store_name || baseTitle);
      }

      if (settings.app_logo) {
        try {
          const img = nativeImage.createFromDataURL(settings.app_logo);
          mainWindow.setIcon(img);
        } catch (e) { console.error('Failed to update icon:', e); }
      }
    }

    return result;
  });

  ipcMain.handle('settings:uploadAppLogo', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico'] }],
        properties: ['openFile']
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Cancelled' };
      }
      const filePath = result.filePaths[0];
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const mime = ext === 'png' ? 'image/png' : (ext === 'ico' ? 'image/x-icon' : 'image/jpeg');
      const fileData = fs.readFileSync(filePath);
      const base64 = `data:${mime};base64,${fileData.toString('base64')}`;

      database.updateSetting('app_logo', base64);

      // Update icon immediately
      if (mainWindow) {
        const img = nativeImage.createFromDataURL(base64);
        mainWindow.setIcon(img);
      }

      return { success: true, logo: base64 };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Margin Settings
  ipcMain.handle('settings:getMarginStats', () => {
    return database.getMarginImpactStats();
  });

  ipcMain.handle('settings:updateMargin', (_, percent, mode) => {
    return database.updateMarginSettings(percent, mode);
  });

  // ─── API Server (Price Checker) ────────────────────
  ipcMain.handle('api:getServerInfo', () => {
    return apiServer.getServerInfo();
  });

  // ─── App Control ──────────────────────────────────────
  ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.quit(); // app.quit() agar before-quit + window-all-closed terpanggil → DB flush + server stop
  });

  // ─── Dashboard ──────────────────────────────────────
  ipcMain.handle('dashboard:stats', () => {
    try {
      return database.getDashboardStats();
    } catch (err) {
      console.error('[IPC dashboard:stats]', err.message);
      throw err;
    }
  });

  ipcMain.handle('dashboard:enhancedStats', () => {
    try {
      return database.getEnhancedDashboardStats();
    } catch (err) {
      console.error('[IPC dashboard:enhancedStats]', err.message);
      throw err;
    }
  });

  // ─── Reports ───────────────────────────────────────
  ipcMain.handle('reports:sales', (_, dateFrom, dateTo) => {
    try {
      return database.getSalesReport(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:sales]', err.message);
      throw err;
    }
  });

  ipcMain.handle('reports:profit', (_, dateFrom, dateTo) => {
    try {
      return database.getProfitReport(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:profit]', err.message);
      throw err;
    }
  });

  ipcMain.handle('reports:comparison', (_, df1, dt1, df2, dt2) => {
    try {
      return database.getPeriodComparison(df1, dt1, df2, dt2);
    } catch (err) {
      console.error('[IPC reports:comparison]', err.message);
      throw err;
    }
  });

  ipcMain.handle('reports:exportPdf', async (_, htmlContent) => {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: { nodeIntegration: false }
      });

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      const pdfData = await printWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      });

      printWindow.destroy(); // Gunakan destroy() untuk hidden window

      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'laporan.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' };
      }

      fs.writeFileSync(result.filePath, pdfData);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:printHtml', async (_, htmlContent) => {
    try {
      // Gunakan print handler untuk konsistensi dan error handling
      const result = await printHtml({
        html: htmlContent,
        deviceName: null, // Gunakan default printer
        printerType: 'a4',
        silent: false, // Tampilkan dialog print untuk laporan
        windowTitle: 'Report Print'
      });

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:hourly', (_, dateFrom, dateTo) => {
    try {
      return database.getHourlySalesPattern(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:hourly]', err.message);
      throw err;
    }
  });

  ipcMain.handle('reports:bottomProducts', (_, dateFrom, dateTo) => {
    try {
      return database.getBottomProducts(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:bottomProducts]', err.message);
      throw err;
    }
  });

  ipcMain.handle('reports:transactionLog', (_, dateFrom, dateTo) => {
    try {
      return database.getTransactionLog(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:transactionLog]', err.message);
      throw err;
    }
  });

  // [PERF] Jalankan getComprehensiveReport di Worker Thread agar main thread tidak freeze
  ipcMain.handle('reports:comprehensive', async (_, dateFrom, dateTo) => {
    try {
      const dbPath = database.getDatabasePath();
      const result = await workerManager.runReportWorker(dbPath, dateFrom, dateTo);

      if (result) return result;

      // Fallback ke implementasi sync jika worker gagal
      console.warn('[IPC reports:comprehensive] Worker returned null, falling back to sync');
      return database.getComprehensiveReport(dateFrom, dateTo);
    } catch (err) {
      console.error('[IPC reports:comprehensive] Unexpected error:', err.message);
      return database.getComprehensiveReport(dateFrom, dateTo);
    }
  });

  ipcMain.handle('reports:slowMoving', (_, inactiveDays, limit) => {
    return database.getSlowMovingProducts(inactiveDays, limit);
  });

  ipcMain.handle('reports:topProductsExpanded', (_, dateFrom, dateTo, limit) => {
    return database.getTopProductsExpanded(dateFrom, dateTo, limit);
  });

  ipcMain.handle('reports:printPlainText', async (_, text, options) => {
    try {
      if (options && options.action === 'save') {
        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: 'laporan.txt',
          filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Cancelled' };
        }
        fs.writeFileSync(result.filePath, text, 'utf-8');
        return { success: true, path: result.filePath };
      }

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{margin:0;padding:10mm}pre{font-family:'Courier New',monospace;font-size:10pt;line-height:1.4;white-space:pre;margin:0}
        @media print{body{padding:5mm}pre{font-size:9pt}}
      </style></head><body><pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;

      const printerName = options && options.printer;
      
      // Gunakan print handler dengan pageSize eksplisit
      const result = await printHtml({
        html,
        deviceName: printerName,
        printerType: 'a4', // Laporan pakai A4
        silent: true,
        windowTitle: 'Report Print'
      });

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── Printing ───────────────────────────────────────
  ipcMain.handle('print:receipt', async (_, transaction) => {
    try {
      const settings = database.getSettings();
      let tx = transaction;
      if (transaction.id) {
        const fresh = database.getTransactionById(transaction.id);
        if (fresh) tx = fresh;
      }
      const result = await printer.printReceipt(tx, settings);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('print:preview', (_, transaction) => {
    const settings = database.getSettings();
    let tx = transaction;
    if (transaction.id) {
      const fresh = database.getTransactionById(transaction.id);
      if (fresh) tx = fresh;
    }
    return printer.generateReceiptHTML(tx, settings);
  });

  ipcMain.handle('print:getTemplates', () => {
    return printer.getReceiptTemplates();
  });

  ipcMain.handle('print:getPrinters', async () => {
    if (!mainWindow) return [];
    return await printer.getPrinters(mainWindow);
  });
  
  ipcMain.handle('print:validate', async (_, deviceName) => {
    if (!mainWindow) return { valid: false, error: 'Window not ready' };
    return await validatePrinter(mainWindow.webContents, deviceName);
  });
  
  ipcMain.handle('print:getValidationError', () => {
    const settings = database.getSettings();
    try {
      return JSON.parse(settings.printer_validation_error || '{}');
    } catch {
      return null;
    }
  });

  ipcMain.handle('print:openDrawer', () => {
    const settings = database.getSettings();
    return printer.openCashDrawer(settings.printer_name);
  });

  ipcMain.handle('settings:uploadLogo', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
        properties: ['openFile']
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Cancelled' };
      }
      const filePath = result.filePaths[0];
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileData = fs.readFileSync(filePath);
      const base64 = `data:${mime};base64,${fileData.toString('base64')}`;
      database.updateSetting('receipt_logo', base64);
      return { success: true, logo: base64 };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('print:previewWithSettings', (_, transaction, customSettings) => {
    return printer.generateReceiptHTMLWithSettings(transaction, customSettings);
  });

  // ─── Cloudflare Tunnel Automation ────────────────────
  ipcMain.handle('cloudflared:install-service', async () => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      // Execute command to install service
      const isPackaged = app.isPackaged;
      const cloudflaredPath = isPackaged
        ? path.join(process.resourcesPath, 'cloudflare', 'cloudflared.exe')
        : path.join(app.getAppPath(), 'cloudflared.exe');

      const command = `"${cloudflaredPath}" service install`;

      const { stdout, stderr } = await execPromise(command);
      console.log('[Cloudflare] Service install stdout:', stdout);
      if (stderr) console.error('[Cloudflare] Service install stderr:', stderr);

      return { success: true, message: stdout };
    } catch (error) {
      console.error('[Cloudflare] Service install error:', error);
      return { success: false, error: error.message };
    }
  });

  // ─── Excel Import/Export ────────────────────────────
  ipcMain.handle('excel:exportProducts', async () => {
    try {
      const products = database.getProducts({ active: 1 });
      const categories = database.getCategories();
      const catMap = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

      const settings = database.getSettings();
      const storeName = (settings.store_name || 'Produk').replace(/[\\/:*?"<>|]/g, '_');
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const datePart = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
      const defaultName = `${storeName}_${datePart}_${timePart}.xlsx`;

      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      });
      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' };

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Products');

      ws.columns = [
        { header: 'Barcode', key: 'barcode', width: 15, hidden: true },
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'Kategori', key: 'kategori', width: 18 },
        { header: 'Harga', key: 'harga', width: 14 },
        { header: 'Harga Modal', key: 'harga_modal', width: 14, hidden: true },
        { header: 'Stok', key: 'stok', width: 10 },
        { header: 'Satuan', key: 'satuan', width: 10 },
        { header: 'Mode Harga', key: 'mode_harga', width: 12, hidden: true },
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.height = 22;
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF1E40AF' } } };
      });

      // Freeze header row
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      // Add data rows
      products.forEach(p => {
        ws.addRow({
          barcode: p.barcode || '',
          nama: p.name,
          kategori: catMap[p.category_id] || '',
          harga: p.price,
          harga_modal: p.cost,
          stok: p.stock,
          satuan: p.unit,
          mode_harga: p.margin_mode === 'manual' ? 'manual' : 'auto',
        });
      });

      await workbook.xlsx.writeFile(result.filePath);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Preview import - parse Excel and categorize products
  ipcMain.handle('excel:previewImport', async () => {
    try {
      const XLSX = require('xlsx');
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Cancelled' };
      }

      const filePath = result.filePaths[0];
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Use raw: false to get formatted strings matches Excel view
      // defval: '' ensures all columns appear in the object
      const rows = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

      // Map categories
      const categories = database.getCategories();
      const catMap = {};
      categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

      const preview = {
        filePath,
        fileName: require('path').basename(filePath),
        totalRows: rows.length,
        newProducts: [],      // Products to add
        existingProducts: [], // Products already in DB (will skip)
        needBarcode: [],      // Products without barcode (will auto-generate)
        invalidRows: []       // Rows with missing required data
      };

      // Robust number parser
      const parseNumber = (val) => {
        if (typeof val === 'number') return Math.round(val);
        if (typeof val === 'string') {
          // Handle "10.000,00" (ID) vs "10,000.00" (US)
          // Heuristic: if comma is present and near end (last 3 chars), assume it's decimal separator
          let clean = val;
          if (val.includes(',') && val.indexOf(',') > val.length - 4) {
            clean = val.split(',')[0]; // Remove decimal part for ID format
          } else if (val.includes('.') && val.indexOf('.') > val.length - 4 && !val.includes(',')) {
            // Possible US decimal, but could be ID thousands separator if only 3 digits follow?
            // Safest for integer prices: remove non-digits
          }

          // Simple approach: Remove non-digits
          clean = clean.replace(/[^\d]/g, '');
          return parseInt(clean) || 0;
        }
        return 0;
      };

      // Case-insensitive key finder
      const getValue = (row, keys) => {
        const rowKeys = Object.keys(row);
        for (const key of keys) {
          // Check exact match first
          if (row[key] !== undefined) return row[key];
          // Check case-insensitive
          const found = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
          if (found) return row[found];
        }
        return undefined;
      };

      rows.forEach((row, index) => {
        const barcode = String(getValue(row, ['Barcode', 'Kode', 'Code']) || '').trim();
        const nomeCandidates = ['Nama', 'Name', 'Nama Produk', 'Product Name', 'Item Name', 'Description', 'Deskripsi'];
        const name = (getValue(row, nomeCandidates) || '').trim();

        const category = getValue(row, ['Kategori', 'Category', 'Kategori Produk', 'Group', 'Kelompok']) || '';

        const priceVal = getValue(row, ['Harga', 'Price', 'Harga Jual', 'Jual', 'Sell Price', 'Sale Price']);
        const price = parseNumber(priceVal);

        const costVal = getValue(row, ['Harga Modal', 'Harga Beli', 'Modal', 'Cost', 'Buy Price', 'HPP', 'Harga Pokok', 'Purchase Price']);
        const cost = parseNumber(costVal);

        const stockVal = getValue(row, ['Stok', 'Stock', 'Qty', 'Quantity', 'Jumlah', 'Sisa']);
        const stock = parseNumber(stockVal);

        const unit = getValue(row, ['Satuan', 'Unit', 'UOM']) || 'pcs';

        // Skip header row or empty rows
        if (!name || name.toLowerCase() === 'nama' || name.toLowerCase() === 'name') {
          return;
        }

        // Validate required fields
        if (!name) {
          preview.invalidRows.push({ row: index + 2, reason: 'Nama produk kosong' });
          return;
        }

        // Check if product exists by barcode or name
        const existingByBarcode = barcode ? database.getProductByBarcode(barcode) : null;
        const existingByName = database.getProductByName(name);

        const productData = {
          row: index + 2,
          barcode,
          name,
          category,
          price,
          cost,
          stock,
          unit
        };

        if (existingByBarcode) {
          preview.existingProducts.push({
            ...productData,
            reason: `Barcode "${barcode}" sudah ada`,
            existingProduct: existingByBarcode.name
          });
        } else if (existingByName) {
          preview.existingProducts.push({
            ...productData,
            reason: `Produk "${name}" sudah ada`,
            existingProduct: existingByName.name
          });
        } else if (!barcode) {
          preview.needBarcode.push(productData);
        } else {
          preview.newProducts.push(productData);
        }
      });

      return { success: true, preview };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Confirm import - actually import the products
  ipcMain.handle('excel:confirmImport', async (_, data) => {
    try {
      const { newProducts, needBarcode } = data;

      // Map categories
      const categories = database.getCategories();
      const catMap = {};
      categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

      // Generate barcodes for products that need them
      const barcodes = database.generateMultipleBarcodes(needBarcode.length);

      // Prepare all products for import
      const allProducts = [];

      // Products with existing barcodes
      newProducts.forEach(p => {
        const catName = (p.category || '').toLowerCase();
        let catId = catMap[catName] || null;
        if (catName && !catId) {
          const newCat = database.createCategory(p.category);
          catId = newCat.id;
          catMap[catName] = catId;
        }
        allProducts.push({
          barcode: p.barcode,
          name: p.name,
          category_id: catId,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          unit: p.unit,
          margin_mode: 'auto',
          userId: null,
          userName: 'Import Excel'
        });
      });

      // Products with auto-generated barcodes
      needBarcode.forEach((p, i) => {
        const catName = (p.category || '').toLowerCase();
        let catId = catMap[catName] || null;
        if (catName && !catId) {
          const newCat = database.createCategory(p.category);
          catId = newCat.id;
          catMap[catName] = catId;
        }
        allProducts.push({
          barcode: barcodes[i],
          name: p.name,
          category_id: catId,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          unit: p.unit,
          margin_mode: 'auto',
          userId: null,
          userName: 'Import Excel'
        });
      });

      // Import all products
      let created = 0;
      const failedProducts = [];
      allProducts.forEach(product => {
        try {
          database.createProduct(product);
          created++;
        } catch (err) {
          console.error('[excel:confirmImport] Failed to create product:', product.name, err.message);
          failedProducts.push({ name: product.name, reason: err.message });
        }
      });

      return {
        success: true,
        created,
        failed: failedProducts.length,
        failedProducts,
        withBarcode: newProducts.length,
        autoBarcode: needBarcode.length
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Legacy import (kept for backwards compatibility)
  ipcMain.handle('excel:importProducts', async () => {
    try {
      const XLSX = require('xlsx');
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Cancelled' };
      }

      const wb = XLSX.readFile(result.filePaths[0]);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      // Map categories
      const categories = database.getCategories();
      const catMap = {};
      categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

      const products = rows.map(row => {
        const catName = (row.Kategori || row.Category || '').toLowerCase();
        let catId = catMap[catName] || null;
        if (catName && !catId) {
          const newCat = database.createCategory(row.Kategori || row.Category);
          catId = newCat.id;
          catMap[catName] = catId;
        }
        return {
          barcode: String(row.Barcode || row.barcode || ''),
          name: row.Nama || row.Name || row.name || 'Unknown',
          category_id: catId,
          price: parseInt(row.Harga || row.Price || row.price || 0),
          cost: parseInt(row['Harga Modal'] || row.Cost || row.cost || 0),
          stock: parseInt(row.Stok || row.Stock || row.stock || 0),
          unit: row.Satuan || row.Unit || row.unit || 'pcs'
        };
      });

      const count = database.bulkUpsertProducts(products);
      return { success: true, count };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── Excel Template Export ─────────────────────────
  ipcMain.handle('excel:exportTemplate', async () => {
    try {
      const XLSX = require('xlsx');

      const templateData = [
        {
          Barcode: '899900000001',
          Nama: 'Contoh Produk 1',
          Kategori: 'Makanan',
          Harga: 15000,
          'Harga Modal': 10000,
          Stok: 100,
          Satuan: 'pcs'
        },
        {
          Barcode: '899900000002',
          Nama: 'Contoh Produk 2',
          Kategori: 'Minuman',
          Harga: 8000,
          'Harga Modal': 5000,
          Stok: 50,
          Satuan: 'pcs'
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // Add instructions sheet
      const instrData = [
        { Petunjuk: 'PETUNJUK PENGISIAN TEMPLATE PRODUK' },
        { Petunjuk: '' },
        { Petunjuk: 'Kolom Barcode  : Kode barcode produk (12 digit angka). Wajib unik per produk.' },
        { Petunjuk: 'Kolom Nama     : Nama produk. Wajib diisi.' },
        { Petunjuk: 'Kolom Kategori : Nama kategori. Jika belum ada akan dibuat otomatis.' },
        { Petunjuk: 'Kolom Harga    : Harga jual dalam Rupiah (angka tanpa titik). Wajib.' },
        { Petunjuk: 'Kolom Harga Modal : Harga modal/beli (angka tanpa titik).' },
        { Petunjuk: 'Kolom Stok     : Jumlah stok awal (angka).' },
        { Petunjuk: 'Kolom Satuan   : Satuan produk (pcs, kg, ltr, box, dll). Default: pcs' },
        { Petunjuk: '' },
        { Petunjuk: 'CATATAN:' },
        { Petunjuk: '- Hapus 2 baris contoh di sheet "Products" lalu isi data Anda.' },
        { Petunjuk: '- Produk dengan Barcode/Nama yang sudah ada akan dilewati (tidak ditimpa).' },
        { Petunjuk: '- Simpan file sebagai .xlsx lalu gunakan menu Import di aplikasi.' },
      ];
      const wsInstr = XLSX.utils.json_to_sheet(instrData);
      wsInstr['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsInstr, 'Petunjuk');

      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'template-produk.xlsx',
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      });

      if (!result.canceled && result.filePath) {
        XLSX.writeFile(wb, result.filePath);
        return { success: true, path: result.filePath };
      }
      return { success: false, error: 'Cancelled' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── Generate Barcode ─────────────────────────────
  ipcMain.handle('products:generateBarcode', () => {
    return database.generateProductBarcode();
  });

  // ─── Window Title ─────────────────────────────────
  ipcMain.handle('system:setWindowTitle', (_, title) => {
    if (mainWindow) {
      mainWindow.setTitle(title ? title + ' - POS Cashier' : 'POS Cashier');
    }
  });

  // ─── System ─────────────────────────────────────────
  ipcMain.handle('system:version', () => app.getVersion());

  // ─── Database Management ───────────────────────────
  function requireAdminSession(userId) {
    if (!userId) return false;
    const user = database.get('SELECT id FROM users WHERE id = ? AND role = ? AND active = 1', [userId, 'admin']);
    return !!user;
  }

  ipcMain.handle('db:getStats', () => {
    return JSON.parse(JSON.stringify(database.getDatabaseStats()));
  });

  ipcMain.handle('db:integrityCheck', () => {
    return database.checkDatabaseIntegrity();
  });

  ipcMain.handle('db:vacuum', (_, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    return database.vacuumDatabase();
  });

  ipcMain.handle('db:clearVoided', (_, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    database.createAutoBackup();
    return database.clearVoidedTransactions();
  });

  ipcMain.handle('db:getArchivableCount', (_, months) => {
    return database.getArchivableTransactions(months);
  });

  ipcMain.handle('db:archiveTransactions', (_, months, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    database.createAutoBackup();
    return database.deleteOldTransactions(months);
  });

  ipcMain.handle('db:resetSettings', () => {
    database.createAutoBackup();
    return database.resetSettings();
  });

  ipcMain.handle('db:hardReset', (_, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    database.createAutoBackup();
    database.hardResetDatabase();
    app.relaunch();
    app.quit();
    return { success: true };
  });

  ipcMain.handle('db:getBackupHistory', () => {
    return JSON.parse(JSON.stringify(database.getBackupHistory()));
  });

  ipcMain.handle('db:createBackup', () => {
    return database.createAutoBackup();
  });

  ipcMain.handle('db:deleteBackup', (_, filePath, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    return database.deleteBackupFile(filePath);
  });

  ipcMain.handle('db:manualBackup', async () => {
    try {
      database.saveDatabase();
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `pos-cashier-backup-${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'Database', extensions: ['db'] }]
      });
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Dibatalkan' };
      }
      fs.copyFileSync(database.getDatabasePath(), result.filePath);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:restoreBackup', async (_, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Database', extensions: ['db'] }],
        properties: ['openFile']
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Dibatalkan' };
      }
      const restoreResult = database.restoreDatabase(result.filePaths[0]);
      if (restoreResult.success) {
        app.relaunch();
        app.quit();
      }
      return restoreResult;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:restoreFromHistory', (_, filePath, userId) => {
    if (!requireAdminSession(userId)) return { success: false, error: 'Akses ditolak.' };
    const result = database.restoreDatabase(filePath);
    if (result.success) {
      app.relaunch();
      app.quit();
    }
    return result;
  });

  ipcMain.handle('db:setBackupDir', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Dibatalkan' };
      }
      database.updateSetting('auto_backup_dir', result.filePaths[0]);
      return { success: true, path: result.filePaths[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:exportTransactionsExcel', async (_, filters) => {
    try {
      const XLSX = require('xlsx');
      const transactions = database.getAllTransactionsWithItems(filters);

      const txData = transactions.map(t => ({
        'No Invoice': t.invoice_number,
        'Tanggal': t.created_at,
        'Kasir': t.cashier_name || '-',
        'Subtotal': t.subtotal,
        'Pajak': t.tax_amount,
        'Diskon': t.discount_amount,
        'Total': t.total,
        'Metode Bayar': t.payment_method,
        'Dibayar': t.amount_paid,
        'Kembalian': t.change_amount,
        'Status': t.status
      }));

      const itemData = [];
      for (const t of transactions) {
        for (const item of (t.items || [])) {
          itemData.push({
            'No Invoice': t.invoice_number,
            'Tanggal': t.created_at,
            'Produk': item.product_name,
            'Harga': item.price,
            'Qty': item.quantity,
            'Diskon': item.discount || 0,
            'Subtotal': item.subtotal
          });
        }
      }

      const wb = XLSX.utils.book_new();
      const wsTx = XLSX.utils.json_to_sheet(txData);
      wsTx['!cols'] = [
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

      const wsItems = XLSX.utils.json_to_sheet(itemData);
      wsItems['!cols'] = [
        { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 12 },
        { wch: 6 }, { wch: 10 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsItems, 'Detail Item');

      const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `transaksi-${filters.date_from || 'semua'}-${filters.date_to || 'semua'}.xlsx`,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, error: 'Dibatalkan' };
      }

      XLSX.writeFile(wb, saveResult.filePath);
      return { success: true, path: saveResult.filePath, count: transactions.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:exportSummaryPdf', async () => {
    try {
      const stats = database.getDatabaseStats();
      const settings = database.getSettings();
      const integrity = database.checkDatabaseIntegrity();

      const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
      };

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
  th { background: #f5f5f5; }
  .info { font-size: 12px; color: #888; margin-top: 30px; }
  .status-ok { color: green; } .status-error { color: red; }
</style></head><body>
<h1>Ringkasan Database - ${settings.store_name || 'POS Cashier'}</h1>
<p style="font-size:12px;color:#666">Diekspor pada: ${new Date().toLocaleString('id-ID')}</p>

<h2>Statistik Tabel</h2>
<table>
  <tr><th>Tabel</th><th>Jumlah Record</th></tr>
  <tr><td>Pengguna</td><td>${stats.counts.users}</td></tr>
  <tr><td>Kategori</td><td>${stats.counts.categories}</td></tr>
  <tr><td>Produk</td><td>${stats.counts.products}</td></tr>
  <tr><td>Transaksi</td><td>${stats.counts.transactions}</td></tr>
  <tr><td>Item Transaksi</td><td>${stats.counts.transaction_items}</td></tr>
  <tr><td>Pengaturan</td><td>${stats.counts.settings}</td></tr>
</table>

<h2>Info Database</h2>
<table>
  <tr><td>Ukuran File</td><td>${formatSize(stats.fileSize)}</td></tr>
  <tr><td>Transaksi Void</td><td>${stats.voidedTransactions}</td></tr>
  <tr><td>Transaksi Pertama</td><td>${stats.oldestTransaction || '-'}</td></tr>
  <tr><td>Transaksi Terakhir</td><td>${stats.newestTransaction || '-'}</td></tr>
  <tr><td>Backup Terakhir</td><td>${stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString('id-ID') : '-'}</td></tr>
</table>

<h2>Integritas</h2>
<p class="${integrity.ok ? 'status-ok' : 'status-error'}">${integrity.ok ? 'OK - Database dalam kondisi baik' : 'ERROR: ' + integrity.result}</p>

<h2>Pengaturan Toko</h2>
<table>
  <tr><td>Nama Toko</td><td>${settings.store_name || '-'}</td></tr>
  <tr><td>Alamat</td><td>${settings.store_address || '-'}</td></tr>
  <tr><td>Telepon</td><td>${settings.store_phone || '-'}</td></tr>
  <tr><td>Pajak</td><td>${settings.tax_enabled === 'true' ? settings.tax_rate + '%' : 'Nonaktif'}</td></tr>
</table>

<p class="info">Dokumen ini dibuat otomatis oleh POS Cashier.</p>
</body></html>`;

      const printWindow = new BrowserWindow({
        show: false, width: 800, height: 1100,
        webPreferences: { nodeIntegration: false }
      });

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      const pdfData = await printWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      });

      printWindow.destroy(); // Gunakan destroy() untuk hidden window

      const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'ringkasan-database.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, error: 'Dibatalkan' };
      }

      fs.writeFileSync(saveResult.filePath, pdfData);
      return { success: true, path: saveResult.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ─── App Auto-Start ────────────────────────────────
  ipcMain.handle('system:setAutoStart', async (_, enabled) => {
    try {
      // 1. Update System Registry
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: [
          '--process-start-args', `"--hidden"` // Optional: Start hidden
        ]
      });

      // 2. Persist to Database
      database.updateSetting('auto_start', enabled.toString());

      return { success: true, enabled };
    } catch (error) {
      console.error('[System] Failed to set auto-start:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:getAutoStartStatus', async () => {
    try {
      // Prioritize DB setting for UI consistency
      const dbSettings = database.getSettings();
      const dbEnabled = dbSettings.auto_start === 'true';

      // Fallback/Verify against System (Optional debug info)
      const sysSettings = app.getLoginItemSettings();
      // console.log('[System] AutoStart DB:', dbEnabled, 'System:', sysSettings.openAtLogin);

      return { success: true, enabled: dbEnabled };
    } catch (error) {
      console.error('[System] Failed to get auto-start status:', error);
      return { success: false, error: error.message };
    }
  });

  // ─── AI Insight ────────────────────────────────────
  ipcMain.handle('ai:status', () => {
    return aiDownload.getDownloadStatus();
  });

  ipcMain.handle('ai:startDownload', async () => {
    try {
      aiDownload.startDownload((progress) => {
        mainWindow?.webContents.send('ai:downloadProgress', progress);
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:cancelDownload', () => {
    try {
      aiDownload.cancelDownload();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:generate', async (_, forceRefresh = false, days = 30) => {
    return performAiGenerate(forceRefresh, days);
  });

  // ── AI API Settings ──────────────────────────────────────
  ipcMain.handle('ai:getApiSettings', () => {
    try {
      const s = database.getSettings();
      let apiKeys = {};
      try {
        if (s.ai_api_keys) apiKeys = JSON.parse(s.ai_api_keys);
      } catch (e) { }

      // Fallback migration
      if (s.ai_api_provider && s.ai_api_key && !apiKeys[s.ai_api_provider]) {
        apiKeys[s.ai_api_provider] = s.ai_api_key;
      }

      return {
        success: true,
        mode: s.ai_mode || 'local',
        provider: s.ai_api_provider || 'groq',
        apiKeys: apiKeys,
        model: s.ai_api_model || '',
        baseUrl: s.ai_api_base_url || '',
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:saveApiSettings', (_, { mode, provider, apiKeys, model, baseUrl }) => {
    try {
      database.updateSetting('ai_mode', mode || 'local');
      database.updateSetting('ai_api_provider', provider || 'groq');
      database.updateSetting('ai_api_keys', JSON.stringify(apiKeys || {}));
      database.updateSetting('ai_api_model', model || '');
      database.updateSetting('ai_api_base_url', baseUrl || '');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:testApiConnection', async (_, { provider, apiKey, model, baseUrl }) => {
    try {
      return await aiApiService.testApiConnection({ provider, apiKey, model, baseUrl });
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:fetchOpenRouterModels', async (_, apiKey) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const res = await net.fetch('https://openrouter.ai/api/v1/models', { method: 'GET', headers });
      const body = await res.json();
      if (!res.ok) {
        const msg = body?.error?.message || body?.message || `HTTP ${res.status}`;
        return { success: false, error: msg };
      }
      const models = (body.data || [])
        .filter(m => m.id && m.id.endsWith(':free'))
        .map(m => m.id)
        .sort();
      return { success: true, models };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:fetchGroqModels', async (_, apiKey) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const res = await net.fetch('https://api.groq.com/openai/v1/models', { method: 'GET', headers });
      const body = await res.json();
      if (!res.ok) {
        const msg = body?.error?.message || body?.message || `HTTP ${res.status}`;
        return { success: false, error: msg };
      }
      const models = (body.data || [])
        .filter(m => m.id && !m.id.includes('whisper') && !m.id.includes('distil-whisper')) // exclude audio models
        .map(m => m.id)
        .sort();
      return { success: true, models };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:getCache', (_, days) => {
    try {
      // If days is undefined → return most recent cache regardless of range (for print report use)
      const cache = (days !== undefined && days !== null)
        ? database.getAiInsightCache(days)
        : database.getLatestAiInsightCache();
      if (!cache) return { success: false, status: 'no_cache' };
      try {
        return { success: true, data: JSON.parse(cache.insight_json), created_at: cache.created_at, days: cache.days };
      } catch (parseErr) {
        console.error('[AI] Corrupt cache data:', parseErr.message);
        return { success: false, status: 'no_cache' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:deleteCache', (_, days) => {
    try {
      database.deleteAiInsightCache(days);
      return { success: true };
    } catch (err) {
      console.error('[AI] Fail delete cache:', err.message);
      return { success: false, error: err.message };
    }
  });


  // ── AI LLM Preset ─────────────────────────────────────────
  ipcMain.handle('ai:getLlmPreset', () => {
    try {
      return database.getAiLlmPreset();
    } catch (err) {
      return 'seimbang';
    }
  });

  ipcMain.handle('ai:saveLlmPreset', async (_, preset) => {
    try {
      database.saveAiLlmPreset(preset);
      aiService.setPreset(preset);
      // Reset instance so new thread count takes effect on next inference
      await aiService.resetInstance().catch(() => { });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Browse and set a local model file (skips download)
  ipcMain.handle('ai:browseModelFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Pilih File Model AI (.gguf)',
        filters: [{ name: 'GGUF Model', extensions: ['gguf'] }],
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, status: 'cancelled' };
      }

      const filePath = result.filePaths[0];
      const setResult = aiDownload.setCustomModelPath(filePath);
      if (!setResult.success) {
        return { success: false, error: setResult.error };
      }

      // Reset LLM instance so the next generateInsight loads the new model
      await aiService.resetInstance().catch(e => console.warn('[AI] resetInstance on browse:', e.message));

      // Persist to settings so it survives app restart
      database.updateSetting('ai_custom_model_path', filePath);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Clear custom model path — revert to default download location
  ipcMain.handle('ai:clearCustomModelPath', async () => {
    try {
      aiDownload.setCustomModelPath(null);
      database.updateSetting('ai_custom_model_path', '');

      // Reset LLM instance so the next generateInsight loads the default model
      await aiService.resetInstance().catch(e => console.warn('[AI] resetInstance on clear:', e.message));

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}
