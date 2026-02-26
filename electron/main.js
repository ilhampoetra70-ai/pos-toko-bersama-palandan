const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const database = require('./database');
const auth = require('./auth');
const printer = require('./printer');
const apiServer = require('./api-server');

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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
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
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

const AUTO_BACKUP_INTERVAL_DAYS = 4;

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

app.whenReady().then(async () => {
  console.log('[POS] App ready, initializing...');
  await database.initDatabase();
  console.log('[POS] Database initialized');
  auth.seedDefaultAdmin();
  auth.seedMasterKey();
  console.log('[POS] Auth seeded');
  registerIpcHandlers();
  console.log('[POS] IPC handlers registered');
  createWindow();
  console.log('[POS] Window created');
  scheduleAutoBackup();
  scheduleAuditCleanup();
  console.log('[POS] Scheduled tasks set');

  // Set window title from store name or app name
  const settings = database.getSettings();
  const baseTitle = settings.app_name || 'POS Kasir';
  if (settings.store_name) {
    mainWindow.setTitle(`${settings.store_name} - ${baseTitle}`);
  } else {
    mainWindow.setTitle(baseTitle);
  }

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
    console.log('[POS] Server Info:', JSON.stringify(serverInfo));
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

  // ─── Users ──────────────────────────────────────────
  ipcMain.handle('users:getAll', () => database.getUsers());

  ipcMain.handle('users:create', (_, data) => {
    data.password_hash = auth.hashPassword(data.password);
    delete data.password;
    return database.createUser(data);
  });

  ipcMain.handle('users:update', (_, id, data) => {
    if (data.password) {
      data.password_hash = auth.hashPassword(data.password);
      delete data.password;
    }
    return database.updateUser(id, data);
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
    return result ? result : null;
  });
  ipcMain.handle('products:create', (_, data) => database.createProduct(data));
  ipcMain.handle('products:update', (_, id, data) => database.updateProduct(id, data));
  ipcMain.handle('products:delete', (_, id) => database.deleteProduct(id));
  ipcMain.handle('products:bulkUpsert', (_, products) => database.bulkUpsertProducts(products));
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
      console.log('[IPC transactions:create] Received data keys:', Object.keys(data));
      console.log('[IPC transactions:create] Items received:', Array.isArray(data.items) ? data.items.length : 'NOT AN ARRAY', typeof data.items);
      if (Array.isArray(data.items) && data.items.length > 0) {
        console.log('[IPC transactions:create] Sample item:', JSON.stringify(data.items[0]));
      }
      const result = database.createTransaction(data);
      console.log('[IPC transactions:create] Result:', result ? `id=${result.id}, items=${result.items?.length ?? 0}` : 'null');
      return result;
    } catch (err) {
      console.error('[IPC transactions:create] ERROR:', err.message, err.stack);
      throw err;
    }
  });
  ipcMain.handle('transactions:getAll', (_, filters) => {
    const result = database.getTransactions(filters);
    return result;
  });
  ipcMain.handle('transactions:getById', (_, id) => {
    const result = database.getTransactionById(id);
    console.log('[transactions:getById] id:', id, 'result:', result ? `found, items: ${result.items?.length ?? 0}` : 'null');
    return result ? result : null;
  });
  ipcMain.handle('transactions:void', (_, id) => {
    const result = database.voidTransaction(id);
    return result ? result : null;
  });

  ipcMain.handle('transactions:addPayment', (_, txId, amount, method, userId, notes) => {
    return database.addPayment(txId, amount, method, userId, notes);
  });

  ipcMain.handle('transactions:getPaymentHistory', (_, txId) => {
    return database.getPaymentHistory(txId);
  });

  // ─── Debt Management ──────────────────────────────────
  ipcMain.handle('debts:getOutstanding', (_, filters) => {
    return database.getOutstandingDebts(filters);
  });

  ipcMain.handle('debts:getSummary', () => {
    return database.getDebtSummary();
  });

  ipcMain.handle('debts:getOverdue', () => {
    return database.getOverdueTransactions();
  });

  // ─── Settings ───────────────────────────────────────
  ipcMain.handle('settings:getAll', () => database.getSettings());

  ipcMain.handle('settings:update', (_, settings) => {
    const result = database.updateSettings(settings);

    // Live update window title/icon
    if (mainWindow) {
      if (settings.app_name || settings.store_name) {
        const fullSettings = database.getSettings(); // Get merged settings
        const baseTitle = fullSettings.app_name || 'POS Kasir';
        if (fullSettings.store_name) {
          mainWindow.setTitle(`${fullSettings.store_name} - ${baseTitle}`);
        } else {
          mainWindow.setTitle(baseTitle);
        }
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
    app.exit(0);
  });

  // ─── Dashboard ──────────────────────────────────────
  ipcMain.handle('dashboard:stats', () => {
    const result = database.getDashboardStats();
    return result;
  });

  ipcMain.handle('dashboard:enhancedStats', () => {
    return database.getEnhancedDashboardStats();
  });

  // ─── Reports ───────────────────────────────────────
  ipcMain.handle('reports:sales', (_, dateFrom, dateTo) => {
    return database.getSalesReport(dateFrom, dateTo);
  });

  ipcMain.handle('reports:profit', (_, dateFrom, dateTo) => {
    return database.getProfitReport(dateFrom, dateTo);
  });

  ipcMain.handle('reports:comparison', (_, df1, dt1, df2, dt2) => {
    return database.getPeriodComparison(df1, dt1, df2, dt2);
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

      printWindow.close();

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
      const printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: { nodeIntegration: false }
      });

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = await new Promise((resolve) => {
        printWindow.webContents.print({
          silent: false,
          printBackground: true,
          pageSize: 'A4',
          margins: { marginType: 'default' }
        }, (success, failureReason) => {
          printWindow.close();
          resolve(success);
        });
      });

      return { success };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:hourly', (_, dateFrom, dateTo) => {
    return database.getHourlySalesPattern(dateFrom, dateTo);
  });

  ipcMain.handle('reports:bottomProducts', (_, dateFrom, dateTo) => {
    return database.getBottomProducts(dateFrom, dateTo);
  });

  ipcMain.handle('reports:transactionLog', (_, dateFrom, dateTo) => {
    return database.getTransactionLog(dateFrom, dateTo);
  });

  ipcMain.handle('reports:comprehensive', (_, dateFrom, dateTo) => {
    try {
      console.log('[IPC reports:comprehensive] Request received:', dateFrom, dateTo);
      const result = database.getComprehensiveReport(dateFrom, dateTo);
      console.log('[IPC reports:comprehensive] Result:', result ? 'Data returned' : 'NULL returned');
      return result;
    } catch (err) {
      console.error('[IPC reports:comprehensive] Uncaught error:', err.message);
      return null;
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

      const printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 1100,
        webPreferences: { nodeIntegration: false }
      });

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{margin:0;padding:10mm}pre{font-family:'Courier New',monospace;font-size:10pt;line-height:1.4;white-space:pre;margin:0}
        @media print{body{padding:5mm}pre{font-size:9pt}}
      </style></head><body><pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

      const printerName = options && options.printer;
      const printOptions = printerName ? { silent: true, deviceName: printerName } : {};

      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, failureReason) => {
          printWindow.close();
          if (success) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: failureReason || 'Print failed' });
          }
        });
      });
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
      console.log('[print:preview] Fresh tx items count:', fresh?.items?.length ?? 0);
    }
    console.log('[print:preview] Final tx items count:', tx?.items?.length ?? 0);
    return printer.generateReceiptHTML(tx, settings);
  });

  ipcMain.handle('print:getTemplates', () => {
    return printer.getReceiptTemplates();
  });

  ipcMain.handle('print:getPrinters', async () => {
    if (!mainWindow) return [];
    return await printer.getPrinters(mainWindow);
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
      const XLSX = require('xlsx');
      const products = database.getProducts({ active: 1 });
      const categories = database.getCategories();
      const catMap = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

      const data = products.map(p => ({
        Barcode: p.barcode || '',
        Nama: p.name,
        Kategori: catMap[p.category_id] || '',
        Harga: p.price,
        'Harga Modal': p.cost,
        Stok: p.stock,
        Satuan: p.unit
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'products.xlsx',
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

      console.log('[excel] Previewing import. First row keys:', rows.length > 0 ? Object.keys(rows[0]) : 'empty');

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
          unit: p.unit
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
          unit: p.unit
        });
      });

      // Import all products
      let created = 0;
      allProducts.forEach(product => {
        try {
          database.createProduct(product);
          created++;
        } catch (err) {
          console.error('[excel:confirmImport] Failed to create product:', product.name, err.message);
        }
      });

      return {
        success: true,
        created,
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
        { Petunjuk: '- Produk dengan Barcode yang sudah ada akan otomatis di-update.' },
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
  ipcMain.handle('db:getStats', () => {
    return JSON.parse(JSON.stringify(database.getDatabaseStats()));
  });

  ipcMain.handle('db:integrityCheck', () => {
    return database.checkDatabaseIntegrity();
  });

  ipcMain.handle('db:vacuum', () => {
    return database.vacuumDatabase();
  });

  ipcMain.handle('db:clearVoided', () => {
    database.createAutoBackup();
    return database.clearVoidedTransactions();
  });

  ipcMain.handle('db:getArchivableCount', (_, months) => {
    return database.getArchivableTransactions(months);
  });

  ipcMain.handle('db:archiveTransactions', (_, months) => {
    database.createAutoBackup();
    return database.deleteOldTransactions(months);
  });

  ipcMain.handle('db:resetSettings', () => {
    database.createAutoBackup();
    return database.resetSettings();
  });

  ipcMain.handle('db:hardReset', () => {
    database.createAutoBackup();
    database.hardResetDatabase();
    app.relaunch();
    app.exit(0);
    return { success: true };
  });

  ipcMain.handle('db:getBackupHistory', () => {
    return JSON.parse(JSON.stringify(database.getBackupHistory()));
  });

  ipcMain.handle('db:createBackup', () => {
    return database.createAutoBackup();
  });

  ipcMain.handle('db:deleteBackup', (_, filePath) => {
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

  ipcMain.handle('db:restoreBackup', async () => {
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
        app.exit(0);
      }
      return restoreResult;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:restoreFromHistory', (_, filePath) => {
    const result = database.restoreDatabase(filePath);
    if (result.success) {
      app.relaunch();
      app.exit(0);
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

      printWindow.close();

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
}
