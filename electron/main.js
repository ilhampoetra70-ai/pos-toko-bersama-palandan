const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const database = require('./database');
const auth = require('./auth');
const printer = require('./printer');
const apiServer = require('./api-server');

// ─── Low-Spec Optimizations ─────────────────────────────
// Reduce memory usage for low-spec devices
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
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
    title: 'POS Cashier',
    autoHideMenuBar: true,
    show: false,
    // Performance optimizations
    backgroundColor: '#f3f4f6',
  });

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

function scheduleAutoBackup() {
  const checkAndBackup = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const settings = database.getSettings();
      const lastBackup = settings.last_backup_date;
      if (!lastBackup || lastBackup.slice(0, 10) !== today) {
        database.createAutoBackup();
        console.log('[AutoBackup] Daily backup created for', today);
      }
    } catch (e) {
      console.error('[AutoBackup] Error:', e.message);
    }
  };

  // First check after 30 seconds, then every 60 minutes
  setTimeout(() => {
    checkAndBackup();
    setInterval(checkAndBackup, 60 * 60 * 1000);
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
  await database.initDatabase();
  auth.seedDefaultAdmin();
  registerIpcHandlers();
  createWindow();
  scheduleAutoBackup();
  scheduleAuditCleanup();

  // Set window title from store name
  const settings = database.getSettings();
  if (settings.store_name) {
    mainWindow.setTitle(settings.store_name + ' - POS Cashier');
  }

  // Start API server for Price Checker
  try {
    const serverInfo = await apiServer.startServer(database, 3001);
    console.log('[POS] API server ready for Price Checker connections');
  } catch (err) {
    console.error('[POS] Failed to start API server:', err.message);
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

  // ─── Users ──────────────────────────────────────────
  ipcMain.handle('users:getAll', () => JSON.parse(JSON.stringify(database.getUsers())));

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
  ipcMain.handle('categories:getAll', () => JSON.parse(JSON.stringify(database.getCategories())));
  ipcMain.handle('categories:create', (_, name, desc) => JSON.parse(JSON.stringify(database.createCategory(name, desc))));
  ipcMain.handle('categories:update', (_, id, name, desc) => JSON.parse(JSON.stringify(database.updateCategory(id, name, desc))));
  ipcMain.handle('categories:delete', (_, id) => database.deleteCategory(id));

  // ─── Products ───────────────────────────────────────
  ipcMain.handle('products:getAll', (_, filters) => JSON.parse(JSON.stringify(database.getProducts(filters))));
  ipcMain.handle('products:getById', (_, id) => JSON.parse(JSON.stringify(database.getProductById(id))));
  ipcMain.handle('products:getByBarcode', (_, barcode) => {
    const result = database.getProductByBarcode(barcode);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  });
  ipcMain.handle('products:create', (_, data) => JSON.parse(JSON.stringify(database.createProduct(data))));
  ipcMain.handle('products:update', (_, id, data) => JSON.parse(JSON.stringify(database.updateProduct(id, data))));
  ipcMain.handle('products:delete', (_, id) => database.deleteProduct(id));
  ipcMain.handle('products:bulkUpsert', (_, products) => database.bulkUpsertProducts(products));
  ipcMain.handle('products:bulkDelete', (_, ids) => database.bulkDeleteProducts(ids));
  ipcMain.handle('products:bulkUpdateField', (_, ids, field, value) => database.bulkUpdateField(ids, field, value));

  // Product update with audit
  ipcMain.handle('products:updateWithAudit', (_, id, data, auditInfo) => {
    return JSON.parse(JSON.stringify(database.updateProduct(id, data, auditInfo)));
  });

  // ─── Stock Audit Log ─────────────────────────────────
  ipcMain.handle('stockAudit:getByProduct', (_, productId, limit) => {
    return JSON.parse(JSON.stringify(database.getStockAuditLogByProduct(productId, limit)));
  });

  ipcMain.handle('stockAudit:getAll', (_, filters) => {
    return JSON.parse(JSON.stringify(database.getStockAuditLog(filters)));
  });

  ipcMain.handle('stockAudit:getSummary', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getStockAuditLogSummary(dateFrom, dateTo)));
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
      return JSON.parse(JSON.stringify(result));
    } catch (err) {
      console.error('[IPC transactions:create] ERROR:', err.message, err.stack);
      throw err;
    }
  });
  ipcMain.handle('transactions:getAll', (_, filters) => {
    const result = database.getTransactions(filters);
    return JSON.parse(JSON.stringify(result));
  });
  ipcMain.handle('transactions:getById', (_, id) => {
    const result = database.getTransactionById(id);
    console.log('[transactions:getById] id:', id, 'result:', result ? `found, items: ${result.items?.length ?? 0}` : 'null');
    return result ? JSON.parse(JSON.stringify(result)) : null;
  });
  ipcMain.handle('transactions:void', (_, id) => {
    const result = database.voidTransaction(id);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  });

  ipcMain.handle('transactions:addPayment', (_, txId, amount, method, userId, notes) => {
    return JSON.parse(JSON.stringify(database.addPayment(txId, amount, method, userId, notes)));
  });

  ipcMain.handle('transactions:getPaymentHistory', (_, txId) => {
    return JSON.parse(JSON.stringify(database.getPaymentHistory(txId)));
  });

  // ─── Debt Management ──────────────────────────────────
  ipcMain.handle('debts:getOutstanding', (_, filters) => {
    return JSON.parse(JSON.stringify(database.getOutstandingDebts(filters)));
  });

  ipcMain.handle('debts:getSummary', () => {
    return JSON.parse(JSON.stringify(database.getDebtSummary()));
  });

  ipcMain.handle('debts:getOverdue', () => {
    return JSON.parse(JSON.stringify(database.getOverdueTransactions()));
  });

  // ─── Settings ───────────────────────────────────────
  ipcMain.handle('settings:getAll', () => JSON.parse(JSON.stringify(database.getSettings())));
  ipcMain.handle('settings:update', (_, settings) => JSON.parse(JSON.stringify(database.updateSettings(settings))));

  // ─── API Server (Price Checker) ────────────────────
  ipcMain.handle('api:getServerInfo', () => {
    return apiServer.getServerInfo();
  });

  // ─── Dashboard ──────────────────────────────────────
  ipcMain.handle('dashboard:stats', () => {
    const result = database.getDashboardStats();
    return JSON.parse(JSON.stringify(result));
  });

  ipcMain.handle('dashboard:enhancedStats', () => {
    return JSON.parse(JSON.stringify(database.getEnhancedDashboardStats()));
  });

  // ─── Reports ───────────────────────────────────────
  ipcMain.handle('reports:sales', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getSalesReport(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:profit', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getProfitReport(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:comparison', (_, df1, dt1, df2, dt2) => {
    return JSON.parse(JSON.stringify(database.getPeriodComparison(df1, dt1, df2, dt2)));
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
    return JSON.parse(JSON.stringify(database.getHourlySalesPattern(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:bottomProducts', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getBottomProducts(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:transactionLog', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getTransactionLog(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:comprehensive', (_, dateFrom, dateTo) => {
    return JSON.parse(JSON.stringify(database.getComprehensiveReport(dateFrom, dateTo)));
  });

  ipcMain.handle('reports:slowMoving', (_, inactiveDays, limit) => {
    return JSON.parse(JSON.stringify(database.getSlowMovingProducts(inactiveDays, limit)));
  });

  ipcMain.handle('reports:topProductsExpanded', (_, dateFrom, dateTo, limit) => {
    return JSON.parse(JSON.stringify(database.getTopProductsExpanded(dateFrom, dateTo, limit)));
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
      </style></head><body><pre>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;

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
      const rows = XLSX.utils.sheet_to_json(ws);

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

      rows.forEach((row, index) => {
        const barcode = String(row.Barcode || row.barcode || '').trim();
        const name = (row.Nama || row.Name || row.name || '').trim();
        const category = row.Kategori || row.Category || '';
        const price = parseInt(row.Harga || row.Price || row.price || 0);
        const cost = parseInt(row['Harga Modal'] || row.Cost || row.cost || 0);
        const stock = parseInt(row.Stok || row.Stock || row.stock || 0);
        const unit = row.Satuan || row.Unit || row.unit || 'pcs';

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
}
