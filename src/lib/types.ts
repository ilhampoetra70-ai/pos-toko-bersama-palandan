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
    status: 'completed' | 'voided';
    total: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    amount_paid: number;
    total_paid?: number; // Added for detailing cumulative payments
    change_amount: number;
    payment_method: string;
    payment_status: 'lunas' | 'pending' | 'hutang' | 'cicilan' | 'paid' | 'unpaid' | 'partial' | 'debt';
    payment_notes?: string;
    customer_name?: string;
    customer_address?: string;
    cashier_name?: string;
    remaining_balance: number;
    due_date?: string;
    created_at: string;
    updated_at?: string;
    items?: TransactionItem[];
    payment_history?: Array<{
        amount: number;
        payment_method: string;
        payment_date: string;
        notes?: string;
    }>;
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

// WindowApi and Window augmentation moved to src/types/api.d.ts
