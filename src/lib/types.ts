export type UserRole = 'admin' | 'supervisor' | 'cashier';

export interface User {
    id: number;
    username: string;
    name: string;
    role: UserRole;
    active: boolean | number;
}

export interface Product {
    id: number;
    barcode: string;
    name: string;
    buy_price: number;
    sell_price: number;
    stock: number;
    category_id?: number;
    category_name?: string;
    unit?: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Transaction {
    id: number;
    invoice_number: string;
    invoice_no?: string; // Legacy support
    total: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    amount_paid: number;
    change_amount: number;
    payment_method: string;
    payment_status: 'paid' | 'unpaid' | 'partial' | 'debt';
    customer_name?: string;
    customer_address?: string; // Added for completeness
    remaining_balance?: number; // Added for completeness
    created_at: string;
    items?: TransactionItem[];
    // Legacy fields being phased out but kept for compatibility if needed
    total_amount?: number;
    payment_amount?: number;
}

export interface TransactionItem {
    id: number;
    transaction_id: number;
    product_id: number;
    product_name: string;
    barcode: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface Settings {
    store_name: string;
    store_address?: string;
    store_phone?: string;
    receipt_footer?: string;
    low_stock_threshold: number;
    auto_backup: boolean | number;
    timezone?: string;
    font_family?: string;
}

export interface WindowApi {
    // Auth
    login(username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }>;
    verifyToken(token: string): Promise<{ success: boolean; data?: any }>;

    // Products
    getProducts(filters?: any): Promise<{ success: boolean; data: Product[]; total?: number }>;
    getProductById(id: number): Promise<{ success: boolean; data: Product }>;
    getProductByBarcode(barcode: string): Promise<{ success: boolean; data: Product | null }>;
    createProduct(data: Partial<Product>): Promise<{ success: boolean; data: Product }>;
    updateProduct(id: number, data: Partial<Product>): Promise<{ success: boolean }>;
    updateProductWithAudit(id: number, data: Partial<Product>, auditInfo: any): Promise<{ success: boolean }>;
    deleteProduct(id: number): Promise<{ success: boolean }>;
    bulkDeleteProducts(ids: number[]): Promise<{ success: boolean }>;
    getLowStockProducts(threshold: number): Promise<{ success: boolean; data: Product[] }>;

    // Categories
    getCategories(): Promise<{ success: boolean; data: Category[] }>;
    createCategory(name: string): Promise<{ success: boolean; data: Category }>;
    deleteCategory(id: number): Promise<{ success: boolean }>;

    // Transactions
    getTransactions(filters: any): Promise<{ success: boolean; data: Transaction[] | { transactions: Transaction[], total: number }; total?: number }>;
    getTransactionById(id: number): Promise<{ success: boolean; data: Transaction }>;
    createTransaction(data: any): Promise<{ success: boolean; data: Transaction }>;
    voidTransaction(id: number): Promise<{ success: boolean }>;
    addPayment(txId: number, amount: number, method: string, userId: number, notes?: string): Promise<{ success: boolean }>;

    // Settings
    getSettings(): Promise<Record<string, string>>;
    updateSettings(data: Record<string, string>): Promise<{ success: boolean }>;

    // Reports
    getSalesReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getProfitReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getPeriodComparison(df1: string, dt1: string, df2: string, dt2: string): Promise<{ success: boolean; data: any }>;
    getComprehensiveReport(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getStockAuditSummary(dateFrom: string, dateTo: string): Promise<{ success: boolean; data: any }>;
    getStockTrailAll(filters: any): Promise<{ success: boolean; data: any[] }>;
    getStockTrail(filters: any): Promise<{ success: boolean; data: any[] }>;

    // Dashboard
    getEnhancedDashboardStats(): Promise<{ success: boolean; data: any }>;
    getSlowMovingProducts(days: number, limit: number): Promise<{ success: boolean; data: any[] }>;

    // Debts
    getOutstandingDebts(filters: any): Promise<{ success: boolean; data: any[] }>;
    getDebtSummary(): Promise<{ success: boolean; data: any }>;

    // Database management
    getDbStats(): Promise<any>;
    dbGetBackupHistory(): Promise<any>;
    dbGetArchivableCount(months: number): Promise<any>;
    dbVacuum(): Promise<{ success: boolean }>;
    dbClearVoided(): Promise<{ success: boolean }>;
    dbArchiveTransactions(months: number): Promise<{ success: boolean }>;
    dbResetSettings(): Promise<{ success: boolean }>;
    dbCreateBackup(): Promise<{ success: boolean }>;
    dbDeleteBackup(path: string): Promise<{ success: boolean }>;

    // Print & Export
    exportReportPdf(html: string): Promise<{ success: boolean; path?: string; error?: string }>;
    printPlainText(text: string, options: { action: 'save' | 'print'; printer?: string }): Promise<{ success: boolean; path?: string; error?: string }>;
}

// Extend Window interface
declare global {
    interface Window {
        api: WindowApi;
    }
}
