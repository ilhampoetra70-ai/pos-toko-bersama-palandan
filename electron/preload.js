const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  verifyToken: (token) => ipcRenderer.invoke('auth:verify', token),

  // Users
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (data) => ipcRenderer.invoke('users:create', data),
  updateUser: (id, data) => ipcRenderer.invoke('users:update', id, data),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (name, description) => ipcRenderer.invoke('categories:create', name, description),
  updateCategory: (id, name, description) => ipcRenderer.invoke('categories:update', id, name, description),
  deleteCategory: (id) => ipcRenderer.invoke('categories:delete', id),

  // Products
  getProducts: (filters) => ipcRenderer.invoke('products:getAll', filters),
  getProductById: (id) => ipcRenderer.invoke('products:getById', id),
  getProductByBarcode: (barcode) => ipcRenderer.invoke('products:getByBarcode', barcode),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  bulkUpsertProducts: (products) => ipcRenderer.invoke('products:bulkUpsert', products),
  bulkDeleteProducts: (ids) => ipcRenderer.invoke('products:bulkDelete', ids),
  bulkUpdateField: (ids, field, value) => ipcRenderer.invoke('products:bulkUpdateField', ids, field, value),
  updateProductWithAudit: (id, data, auditInfo) => ipcRenderer.invoke('products:updateWithAudit', id, data, auditInfo),

  // Stock Audit Log
  getStockAuditByProduct: (productId, limit) => ipcRenderer.invoke('stockAudit:getByProduct', productId, limit),
  getStockAuditLog: (filters) => ipcRenderer.invoke('stockAudit:getAll', filters),
  getStockAuditSummary: (dateFrom, dateTo) => ipcRenderer.invoke('stockAudit:getSummary', dateFrom, dateTo),

  // Transactions
  createTransaction: (data) => ipcRenderer.invoke('transactions:create', data),
  getTransactions: (filters) => ipcRenderer.invoke('transactions:getAll', filters),
  getTransactionById: (id) => ipcRenderer.invoke('transactions:getById', id),
  voidTransaction: (id) => ipcRenderer.invoke('transactions:void', id),
  addPayment: (txId, amount, method, userId, notes) => ipcRenderer.invoke('transactions:addPayment', txId, amount, method, userId, notes),
  getPaymentHistory: (txId) => ipcRenderer.invoke('transactions:getPaymentHistory', txId),

  // Debt Management
  getOutstandingDebts: (filters) => ipcRenderer.invoke('debts:getOutstanding', filters),
  getDebtSummary: () => ipcRenderer.invoke('debts:getSummary'),
  getOverdueDebts: () => ipcRenderer.invoke('debts:getOverdue'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),

  // API Server (Price Checker)
  getApiServerInfo: () => ipcRenderer.invoke('api:getServerInfo'),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:stats'),
  getEnhancedDashboardStats: () => ipcRenderer.invoke('dashboard:enhancedStats'),

  // Reports
  getSalesReport: (from, to) => ipcRenderer.invoke('reports:sales', from, to),
  getProfitReport: (from, to) => ipcRenderer.invoke('reports:profit', from, to),
  getPeriodComparison: (df1, dt1, df2, dt2) => ipcRenderer.invoke('reports:comparison', df1, dt1, df2, dt2),
  exportReportPdf: (html) => ipcRenderer.invoke('reports:exportPdf', html),
  getHourlySalesPattern: (from, to) => ipcRenderer.invoke('reports:hourly', from, to),
  getBottomProducts: (from, to) => ipcRenderer.invoke('reports:bottomProducts', from, to),
  getTransactionLog: (from, to) => ipcRenderer.invoke('reports:transactionLog', from, to),
  getComprehensiveReport: (from, to) => ipcRenderer.invoke('reports:comprehensive', from, to),
  getSlowMovingProducts: (inactiveDays, limit) => ipcRenderer.invoke('reports:slowMoving', inactiveDays, limit),
  getTopProductsExpanded: (from, to, limit) => ipcRenderer.invoke('reports:topProductsExpanded', from, to, limit),
  printPlainText: (text, options) => ipcRenderer.invoke('reports:printPlainText', text, options),
  printReportHtml: (html) => ipcRenderer.invoke('reports:printHtml', html),

  // Printing
  printReceipt: (transaction) => ipcRenderer.invoke('print:receipt', transaction),
  getReceiptHTML: (transaction) => ipcRenderer.invoke('print:preview', transaction),
  getReceiptHTMLWithSettings: (transaction, settings) => ipcRenderer.invoke('print:previewWithSettings', transaction, settings),
  getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
  openCashDrawer: () => ipcRenderer.invoke('print:openDrawer'),
  uploadLogo: () => ipcRenderer.invoke('settings:uploadLogo'),

  // Excel
  exportProducts: () => ipcRenderer.invoke('excel:exportProducts'),
  importProducts: () => ipcRenderer.invoke('excel:importProducts'),
  previewImport: () => ipcRenderer.invoke('excel:previewImport'),
  confirmImport: (data) => ipcRenderer.invoke('excel:confirmImport', data),
  exportTemplate: () => ipcRenderer.invoke('excel:exportTemplate'),

  // Products - barcode generation
  generateBarcode: () => ipcRenderer.invoke('products:generateBarcode'),

  // System
  getAppVersion: () => ipcRenderer.invoke('system:version'),
  setWindowTitle: (title) => ipcRenderer.invoke('system:setWindowTitle', title),

  // Database Management
  getDbStats: () => ipcRenderer.invoke('db:getStats'),
  dbIntegrityCheck: () => ipcRenderer.invoke('db:integrityCheck'),
  dbVacuum: () => ipcRenderer.invoke('db:vacuum'),
  dbClearVoided: () => ipcRenderer.invoke('db:clearVoided'),
  dbGetArchivableCount: (months) => ipcRenderer.invoke('db:getArchivableCount', months),
  dbArchiveTransactions: (months) => ipcRenderer.invoke('db:archiveTransactions', months),
  dbResetSettings: () => ipcRenderer.invoke('db:resetSettings'),
  dbHardReset: () => ipcRenderer.invoke('db:hardReset'),
  dbGetBackupHistory: () => ipcRenderer.invoke('db:getBackupHistory'),
  dbCreateBackup: () => ipcRenderer.invoke('db:createBackup'),
  dbDeleteBackup: (filePath) => ipcRenderer.invoke('db:deleteBackup', filePath),
  dbManualBackup: () => ipcRenderer.invoke('db:manualBackup'),
  dbRestoreBackup: () => ipcRenderer.invoke('db:restoreBackup'),
  dbRestoreFromHistory: (filePath) => ipcRenderer.invoke('db:restoreFromHistory', filePath),
  dbSetBackupDir: () => ipcRenderer.invoke('db:setBackupDir'),
  dbExportTransactions: (filters) => ipcRenderer.invoke('db:exportTransactionsExcel', filters),
  dbExportSummaryPdf: () => ipcRenderer.invoke('db:exportSummaryPdf'),
});
