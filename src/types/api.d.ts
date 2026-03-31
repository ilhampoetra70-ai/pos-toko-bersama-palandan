// Type definitions for window.api (Electron contextBridge)
// Source: electron/preload.js + electron/main.js

// ─── Generic Result Wrapper ────────────────────────────────────────────────────

export interface ApiResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'supervisor' | 'cashier';

export interface UserInfo {
    id: number;
    username: string;
    name: string;
    role: UserRole;
    password_changed?: number;
}

export interface LoginResult {
    success: boolean;
    token?: string;
    user?: UserInfo;
    error?: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
    id: number;
    username: string;
    name: string;
    role: UserRole;
    active: boolean | number;
    last_login?: string | null;
    created_at?: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
    id: number;
    category_id?: number | null;
    category_name?: string;
    barcode?: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    unit?: string;
    active?: number;
    margin_mode?: string | null;
    created_at?: string;
    updated_at?: string;
    // Fields from getSlowMovingProducts
    last_sale_date?: string | null;
    days_inactive?: number;
}

export interface ProductsResponse {
    data: Product[];
    total: number;
}

export interface ProductFilters {
    search?: string;
    category_id?: number | string;
    active?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
    id: number;
    invoice_number: string;
    invoice_no?: string;
    user_id?: number;
    cashier_name?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    payment_method: string;
    amount_paid: number;
    change_amount: number;
    customer_name?: string | null;
    customer_address?: string | null;
    payment_status: 'lunas' | 'hutang' | 'cicilan' | 'pending' | 'paid' | 'unpaid' | 'partial' | 'debt';
    payment_notes?: string;
    due_date?: string | null;
    total_paid?: number;
    remaining_balance: number;
    status: 'completed' | 'voided';
    created_at: string;
    updated_at?: string;
    items?: TransactionItem[];
    payment_history?: Array<{
        amount: number;
        payment_method: string;
        payment_date: string;
        notes?: string;
    }>;
}

export interface TransactionItem {
    id: number;
    transaction_id: number;
    product_id: number;
    product_name: string;
    barcode?: string;
    price: number;
    original_cost?: number | null;
    quantity: number;
    discount?: number;
    subtotal: number;
}

export interface TransactionFilters {
    search?: string;
    status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface PaymentHistory {
    id: number;
    transaction_id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    received_by: number;
    receiver_name?: string;
    notes?: string | null;
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export interface StockTrail {
    id: number;
    product_id: number;
    product_name: string;
    event_type: 'initial' | 'sale' | 'restock' | 'adjustment' | 'return' | 'opname';
    quantity_before: number;
    quantity_change: number;
    quantity_after: number;
    user_id?: number | null;
    user_name?: string | null;
    notes?: string | null;
    reference_id?: number | string | null;
    created_at: string;
}

export interface StockTrailFilters {
    product_id?: number;
    event_type?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    limit?: number;
    offset?: number;
    exclude_sale?: boolean;
}

export interface StockAuditLog {
    id: number;
    product_id: number;
    product_name: string;
    old_stock: number;
    new_stock: number;
    difference: number;
    reason: string;
    user_id: number;
    user_name: string;
    created_at: string;
}

export interface StockAuditSummary {
    product_id: number;
    product_name: string;
    total_in: number;
    total_out: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
    today_revenue: number;
    today_transactions: number;
    today_items_sold: number;
    low_stock_count: number;
    monthly_revenue: number;
    monthly_transactions: number;
}

export interface EnhancedDashboardStats {
    today_sales_count: number;
    today_sales_total: number;
    yesterday_sales_count: number;
    yesterday_sales_total: number;
    today_profit: number;
    yesterday_profit: number;
    today_revenue: number;
    today_cost: number;
    this_week_total: number;
    last_week_total: number;
    top_products_today: Array<{ product_id: number; product_name: string; qty: number; total: number }>;
    debt_total_outstanding: number;
    debt_total_count: number;
    debt_overdue_count: number;
    debt_overdue_total: number;
    last_7_days: Array<{ date: string; total: number }>;
    last_30_days: Array<{ date: string; total: number }>;
    recent_transactions: Transaction[];
    last_backup_date: string | null;
    low_stock_count: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface HourlySalesData {
    hour: number;
    total: number;
    count: number;
}

export interface ProductStat {
    product_name: string;
    total: number;
    qty: number;
}

export interface SalesReport {
    summary: { count: number; revenue: number; average: number };
    paymentBreakdown: Array<{ payment_method: string; count: number; total: number }>;
    dailyBreakdown: Array<{ date: string; count: number; total: number }>;
    topProducts: ProductStat[];
    transactionLog: Transaction[];
    hourlyBreakdown: HourlySalesData[];
}

export interface ProfitReportProduct {
    product_name: string;
    revenue: number;
    total_cost: number;
    profit: number;
    qty: number;
}

export interface ProfitReport {
    products: ProfitReportProduct[];
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    transactionLog?: Transaction[];
}

export interface PeriodStats {
    revenue: number;
    count: number;
    average: number;
}

export interface PeriodComparison {
    periodA: PeriodStats;
    periodB: PeriodStats;
    delta: {
        revenue: number;
        count: number;
        average: number;
    };
}

export interface ComprehensiveReport {
    sales: SalesReport;
    profit: ProfitReport;
    hourly: HourlySalesData[];
    topProducts: ProductStat[];
    bottomProducts: ProductStat[];
    transactionLog: Transaction[];
    stockAudit: StockAuditSummary[];
    stockTrail: StockTrail[];
    periodComparison?: PeriodComparison;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface MarginStats {
    total: number;
    auto: number;
    manual: number;
}

// ─── Debt ─────────────────────────────────────────────────────────────────────

export interface DebtSummary {
    total_count: number;
    total_outstanding: number;
    overdue_count: number;
    overdue_total: number;
    by_status?: Array<{ payment_status: string; total: number; count: number }>;
}

// ─── Database / System ────────────────────────────────────────────────────────

export interface DbStats {
    counts: {
        users: number;
        categories: number;
        products: number;
        transactions: number;
        transaction_items: number;
        settings: number;
    };
    fileSize: number;
    lastBackupDate: string | null;
    voidedTransactions: number;
    oldestTransaction: string | null;
    newestTransaction?: string | null;
    autoBackupDir: string;
}

export interface BackupEntry {
    file_name: string;
    file_path: string;
    size_bytes: number;
    created_at: string;
}

export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options?: Record<string, string>;
}

// ─── AI Insight ───────────────────────────────────────────────────────────────

export interface AiInsightData {
    narrative: string;
    highlights: string[];
}

// ─── Window API Interface ──────────────────────────────────────────────────────

export interface WindowApi {
    // Auth
    login(username: string, password: string): Promise<LoginResult>;
    verifyToken(token: string): Promise<LoginResult>;
    resetPasswordWithMasterKey(username: string, masterKey: string, newPassword: string): Promise<ApiResult>;
    changeMasterKey(oldMasterKey: string, newMasterKey: string): Promise<ApiResult>;
    logoutUser(userId: number): Promise<ApiResult>;

    // Users
    getUsers(): Promise<User[]>;
    createUser(data: Partial<User> & { password: string }): Promise<ApiResult<User>>;
    updateUser(id: number, data: Partial<User> & { password?: string }): Promise<ApiResult>;
    markPasswordChanged(id: number): Promise<ApiResult>;
    deleteUser(id: number): Promise<ApiResult>;

    // Categories
    getCategories(): Promise<{ success: boolean; data: Category[] }>;
    createCategory(name: string, description?: string): Promise<{ success: boolean; data: Category }>;
    updateCategory(id: number, name: string, description?: string): Promise<ApiResult>;
    deleteCategory(id: number): Promise<ApiResult>;

    // Products
    getProducts(filters?: ProductFilters): Promise<Product[] | ProductsResponse>;
    getProductById(id: number): Promise<{ success: boolean; data: Product }>;
    getProductByBarcode(barcode: string): Promise<{ success: boolean; data: Product | null }>;
    createProduct(data: Omit<Product, 'id'>): Promise<{ success: boolean; data: Product }>;
    updateProduct(id: number, data: Partial<Product>): Promise<{ success: boolean; error?: string }>;
    updateProductWithAudit(id: number, data: Partial<Product>, auditInfo: { userId: number | null; userName: string; source: string }): Promise<{ success: boolean; error?: string }>;
    deleteProduct(id: number): Promise<{ success: boolean; error?: string }>;
    restoreProduct(id: number): Promise<{ success: boolean; error?: string }>;
    bulkUpsertProducts(products: Partial<Product>[]): Promise<ApiResult<{ created: number; updated: number }>>;
    bulkDeleteProducts(ids: number[]): Promise<{ success: boolean; error?: string }>;
    bulkUpdateField(ids: number[], field: string, value: unknown): Promise<{ success: boolean; error?: string }>;
    getLowStockProducts(threshold?: number): Promise<{ success: boolean; data: Product[] }>;
    generateBarcode(): Promise<string>;

    // Stock Trail
    createStockTrail(data: Omit<StockTrail, 'id' | 'created_at'>): Promise<ApiResult>;
    getStockTrailByProduct(productId: number, limit?: number): Promise<StockTrail[]>;
    getStockTrailAll(filters?: StockTrailFilters): Promise<StockTrail[]>;
    getStockTrailCount(filters?: Omit<StockTrailFilters, 'limit' | 'offset'>): Promise<number>;

    // Stock Audit Log
    getStockAuditByProduct(productId: number, limit?: number): Promise<StockAuditLog[]>;
    getStockAuditLog(filters?: Record<string, unknown>): Promise<StockAuditLog[]>;
    getStockAuditSummary(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: StockAuditSummary[] }>;
    createStockAuditLog(log: Omit<StockAuditLog, 'id' | 'created_at'>): Promise<ApiResult>;

    // Transactions
    createTransaction(data: unknown): Promise<{ success: boolean; data: Transaction; error?: string }>;
    getTransactions(filters?: TransactionFilters): Promise<{ success: boolean; data: Transaction[]; total?: number; error?: string }>;
    getTransactionById(id: number): Promise<{ success: boolean; data: Transaction }>;
    voidTransaction(id: number): Promise<{ success: boolean; error?: string }>;
    addPayment(txId: number, amount: number, method: string, userId: number, notes?: string): Promise<{ success: boolean; error?: string }>;
    getPaymentHistory(txId: number): Promise<PaymentHistory[]>;

    // Debt Management
    getOutstandingDebts(filters?: TransactionFilters): Promise<{ success: boolean; data: Transaction[]; error?: string }>;
    getDebtSummary(): Promise<DebtSummary>;
    getOverdueDebts(): Promise<Transaction[]>;

    // Settings
    getSettings(): Promise<Record<string, string>>;
    updateSettings(settings: Record<string, string>): Promise<{ success: boolean; error?: string }>;
    getMarginStats(): Promise<MarginStats>;
    updateMargin(percent: number, mode: string): Promise<ApiResult>;

    // API Server
    getApiServerInfo(): Promise<{ localUrl: string; networkUrl: string; port: number }>;

    // Dashboard
    getDashboardStats(): Promise<DashboardStats>;
    getEnhancedDashboardStats(): Promise<EnhancedDashboardStats>;

    // Reports
    getSalesReport(from: string, to: string): Promise<SalesReport>;
    getProfitReport(from: string, to: string): Promise<ProfitReport>;
    getPeriodComparison(df1: string, dt1: string, df2: string, dt2: string): Promise<PeriodComparison>;
    exportReportPdf(html: string): Promise<{ success: boolean; path?: string; error?: string }>;
    getHourlySalesPattern(from: string, to: string): Promise<HourlySalesData[]>;
    getBottomProducts(from: string, to: string): Promise<ProductStat[]>;
    getTransactionLog(from: string, to: string): Promise<Transaction[]>;
    getComprehensiveReport(from: string, to: string): Promise<ComprehensiveReport>;
    getSlowMovingProducts(inactiveDays: number, limit?: number): Promise<{ success: boolean; data: Product[] }>;
    getTopProductsExpanded(from: string, to: string, limit?: number): Promise<ProductStat[]>;
    printPlainText(text: string, options?: Record<string, unknown>): Promise<{ success: boolean; path?: string; error?: string }>;
    printReportHtml(html: string): Promise<{ success: boolean; error?: string }>;

    // Printing
    printReceipt(transaction: Transaction): Promise<{ success: boolean; error?: string }>;
    getReceiptHTML(transaction: Transaction): Promise<string>;
    getReceiptHTMLWithSettings(transaction: Transaction, settings: Record<string, string>): Promise<string>;
    getReceiptTemplates(): Promise<string[]>;
    getPrinters(): Promise<PrinterInfo[]>;
    openCashDrawer(): Promise<{ success: boolean; error?: string }>;
    uploadLogo(): Promise<{ success: boolean; logo?: string; error?: string }>;
    uploadAppLogo(): Promise<{ success: boolean; logo?: string; error?: string }>;

    // Excel
    exportProducts(): Promise<{ success: boolean; path?: string; error?: string }>;
    importProducts(): Promise<ApiResult>;
    previewImport(): Promise<{
        success: boolean;
        preview?: {
            filePath: string;
            fileName: string;
            totalRows: number;
            newProducts: Array<{ row: number; barcode: string; name: string; category: string; price: number; cost: number; stock: number; unit: string }>;
            existingProducts: Array<{ row: number; barcode: string; name: string; category: string; price: number; cost: number; stock: number; unit: string; reason: string; existingProduct: string }>;
            needBarcode: Array<{ row: number; barcode: string; name: string; category: string; price: number; cost: number; stock: number; unit: string }>;
            invalidRows: Array<{ row: number; reason: string }>;
        };
        error?: string;
    }>;
    confirmImport(data: unknown): Promise<{ success: boolean; created?: number; withBarcode?: number; autoBarcode?: number; error?: string }>;
    exportTemplate(): Promise<{ success: boolean; path?: string; error?: string }>;

    // System
    getAppVersion(): Promise<string>;
    setWindowTitle(title: string): Promise<void>;
    restartApp(): Promise<void>;
    setAutoStart(enabled: boolean): Promise<ApiResult>;
    getAutoStartStatus(): Promise<boolean>;
    installCloudflareService(): Promise<ApiResult>;

    // Database Management
    getDbStats(): Promise<DbStats>;
    dbIntegrityCheck(): Promise<{ ok: boolean; result: string }>;
    dbVacuum(userId: number): Promise<{ success: boolean; sizeBefore?: number; sizeAfter?: number; error?: string }>;
    dbClearVoided(userId: number): Promise<{ success: boolean; count?: number; error?: string }>;
    dbGetArchivableCount(months: number): Promise<{ count: number; cutoffDate: string; error?: string }>;
    dbArchiveTransactions(months: number, userId: number): Promise<{ success: boolean; count?: number; error?: string }>;
    dbResetSettings(): Promise<{ success: boolean; error?: string }>;
    dbHardReset(userId: number): Promise<{ success: boolean; error?: string }>;
    dbGetBackupHistory(): Promise<BackupEntry[]>;
    dbCreateBackup(): Promise<{ success: boolean; filename?: string; error?: string }>;
    dbDeleteBackup(filePath: string, userId: number): Promise<{ success: boolean; error?: string }>;
    dbManualBackup(): Promise<{ success: boolean; path?: string; error?: string }>;
    dbRestoreBackup(userId: number): Promise<{ success: boolean; error?: string }>;
    dbRestoreFromHistory(filePath: string, userId: number): Promise<{ success: boolean; error?: string }>;
    dbSetBackupDir(): Promise<{ success: boolean; path?: string; error?: string }>;
    dbExportTransactions(filters?: TransactionFilters): Promise<{ success: boolean; path?: string; count?: number; error?: string }>;
    dbExportSummaryPdf(): Promise<{ success: boolean; path?: string; error?: string }>;

    // AI Insight
    getAiStatus(): Promise<{ state: string; progressPercent: number; downloadedMB: number; totalMB: number; errorMsg: string | null; customModelPath: string | null }>;
    startAiDownload(): Promise<{ success: boolean; error?: string }>;
    cancelAiDownload(): Promise<{ success: boolean; error?: string }>;
    generateAiInsight(forceRefresh?: boolean, days?: number): Promise<{ success: boolean; data?: AiInsightData; from_cache?: boolean; created_at?: string; status?: string; error?: string }>;
    getAiInsightCache(days?: number): Promise<{ success: boolean; data?: AiInsightData; created_at?: string; status?: string }>;
    deleteAiInsightCache(days: number): Promise<{ success: boolean; error?: string }>;
    getLlmPreset(): Promise<string>;
    saveLlmPreset(preset: string): Promise<{ success: boolean; error?: string }>;
    browseAiModelFile(): Promise<{ success: boolean; filePath?: string; status?: string; error?: string }>;
    clearAiCustomModelPath(): Promise<{ success: boolean; error?: string }>;
    // AI API Settings
    getAiApiSettings(): Promise<{ success: boolean; mode: string; provider: string; apiKeys: Record<string, string>; model: string; baseUrl: string }>;
    saveAiApiSettings(settings: { mode: string; provider: string; apiKeys: Record<string, string>; model: string; baseUrl: string }): Promise<{ success: boolean; error?: string }>;
    testAiApiConnection(settings: { provider: string; apiKey: string; model: string; baseUrl: string }): Promise<{ success: boolean; error?: string }>;
    fetchOpenRouterModels(apiKey: string): Promise<{ success: boolean; models: string[]; error?: string }>;
    fetchGroqModels(apiKey: string): Promise<{ success: boolean; models: string[]; error?: string }>;
    onAiDownloadProgress(callback: (progress: { percent: number; downloadedMB: number; totalMB: number }) => void): () => void;
    onAiAutoGenerating?(callback: (data: { days: number }) => void): () => void;
    onAiAutoGenerateDone?(callback: (data: { days: number; success: boolean }) => void): () => void;

}

// ─── Global Window Augmentation ───────────────────────────────────────────────

declare global {
    interface Window {
        api: WindowApi;
    }
}
