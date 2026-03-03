import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Query Keys ---
export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: any) => [...productKeys.lists(), filters] as const,
    detail: (id: number) => [...productKeys.all, 'detail', id] as const,
    byBarcode: (code: string) => [...productKeys.all, 'barcode', code] as const,
    lowStock: (threshold: number) => [...productKeys.all, 'low-stock', threshold] as const,
};

export const categoryKeys = {
    all: ['categories'] as const,
    list: () => [...categoryKeys.all, 'list'] as const,
};

export const dashboardKeys = {
    all: ['dashboard'] as const,
    enhancedStats: () => [...dashboardKeys.all, 'enhancedStats'] as const,
    slowMoving: (days: number, limit: number) => [...dashboardKeys.all, 'slowMoving', days, limit] as const,
};

export const transactionKeys = {
    all: ['transactions'] as const,
    lists: () => [...transactionKeys.all, 'list'] as const,
    list: (filters: any) => [...transactionKeys.lists(), filters] as const,
    detail: (id: number) => [...transactionKeys.all, 'detail', id] as const,
};

export const settingsKeys = {
    all: ['settings'] as const,
    detail: () => [...settingsKeys.all, 'detail'] as const,
};

export const reportKeys = {
    all: ['reports'] as const,
    sales: (filters: any) => [...reportKeys.all, 'sales', filters] as const,
    profit: (filters: any) => [...reportKeys.all, 'profit', filters] as const,
    comparison: (filters: any) => [...reportKeys.all, 'comparison', filters] as const,
    comprehensive: (filters: any) => [...reportKeys.all, 'comprehensive', filters] as const,
};

export const debtKeys = {
    all: ['debts'] as const,
    outstanding: (filters: any) => [...debtKeys.all, 'outstanding', filters] as const,
    summary: () => [...debtKeys.all, 'summary'] as const,
};

export const stockTrailKeys = {
    all: ['stockTrail'] as const,
    byProduct: (id: number, limit: number) => [...stockTrailKeys.all, 'product', id, limit] as const,
    allList: (filters: any) => [...stockTrailKeys.all, 'list', filters] as const,
};

export const aiKeys = {
    all: ['ai'] as const,
    status: () => [...aiKeys.all, 'status'] as const,
    cache: () => [...aiKeys.all, 'cache'] as const,
};

// --- AI Insight Hooks ---
export const useAiStatus = () =>
    useQuery({
        queryKey: aiKeys.status(),
        queryFn: () => window.api.getAiStatus(),
        refetchInterval: (query) => {
            const data = query.state.data as any;
            return data?.state === 'downloading' ? 2000 : false;
        },
        refetchOnWindowFocus: false,
    });

export const useAiInsight = () =>
    useMutation({
        mutationFn: ({ forceRefresh, days }: { forceRefresh: boolean; days: number }) =>
            window.api.generateAiInsight(forceRefresh, days),
    });

// --- API Fetchers ---
export const productApi = {
    getAll: (filters?: any) => window.api.getProducts(filters),
    getById: (id: number) => window.api.getProductById(id),
    getByBarcode: (code: string) => window.api.getProductByBarcode(code),
    create: (data: any) => window.api.createProduct(data),
    update: ({ id, data }: any) => window.api.updateProduct(id, data),
    updateWithAudit: ({ id, data, auditInfo }: any) => window.api.updateProductWithAudit(id, data, auditInfo),
    delete: (id: number) => window.api.deleteProduct(id),
    restore: (id: number) => window.api.restoreProduct(id),
    bulkDelete: (ids: number[]) => window.api.bulkDeleteProducts(ids),
};

export const categoryApi = {
    getAll: async () => {
        const res = await window.api.getCategories();
        if (Array.isArray(res)) return res;
        return res.success ? (res.data || []) : [];
    },
    create: (name: string) => window.api.createCategory(name),
    delete: (id: number) => window.api.deleteCategory(id),
};

export const dashboardApi = {
    getStats: () => window.api.getEnhancedDashboardStats(),
    getSlowMoving: (days: number, limit: number) => window.api.getSlowMovingProducts(days, limit),
};

export const transactionApi = {
    getAll: (filters: any) => window.api.getTransactions(filters),
    getById: (id: number) => window.api.getTransactionById(id),
    create: (data: any) => window.api.createTransaction(data),
    void: (id: number) => window.api.voidTransaction(id),
    addPayment: ({ txId, amount, method, userId, notes }: any) => window.api.addPayment(txId, amount, method, userId, notes),
};

export const settingsApi = {
    get: () => window.api.getSettings(),
    update: (data: any) => window.api.updateSettings(data),
};

// --- Custom Hooks ---

// Users
export const useUsers = () =>
    useQuery({
        queryKey: ['users', 'list'],
        queryFn: async () => {
            const res = await window.api.getUsers();
            if (Array.isArray(res)) return res;
            return (res as any)?.data || [];
        },
        staleTime: 300000, // 5 menit
    });

// Products
export const useProducts = (filters?: any) =>
    useQuery({
        queryKey: productKeys.list(filters),
        queryFn: async () => {
            const res = await productApi.getAll(filters);
            if (Array.isArray(res)) return { data: res, total: res.length };
            return { data: res.data || [], total: res.total || 0 };
        }
    });

export const useProductByBarcode = (code: string) =>
    useQuery({ queryKey: productKeys.byBarcode(code), queryFn: () => productApi.getByBarcode(code), enabled: !!code });

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.update,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            if (variables.id) queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        },
    });
};

export const useUpdateProductWithAudit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.updateWithAudit,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            if (variables.id) queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        },
    });
};

export const useLowStockProducts = (threshold: number) =>
    useQuery({
        queryKey: productKeys.lowStock(threshold),
        queryFn: async () => {
            const res = await window.api.getLowStockProducts(threshold);
            return Array.isArray(res) ? res : (res.success ? (res.data || []) : []);
        }
    });

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        }
    });
};

export const useRestoreProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.restore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        }
    });
};

export const useBulkDeleteProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productApi.bulkDelete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    });
};

// Categories
export const useCategories = () =>
    useQuery({ queryKey: categoryKeys.list(), queryFn: categoryApi.getAll, staleTime: 300000 });

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => categoryApi.create(name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: categoryApi.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    });
};

// Dashboard
export const useDashboardStats = () =>
    useQuery({ queryKey: dashboardKeys.enhancedStats(), queryFn: dashboardApi.getStats, refetchInterval: 30000 });

export const useSlowMovingProducts = (days: number, limit: number) =>
    useQuery({
        queryKey: dashboardKeys.slowMoving(days, limit),
        queryFn: async () => {
            const res = await dashboardApi.getSlowMoving(days, limit);
            if (Array.isArray(res)) return res;
            return res.success ? (res.data || []) : [];
        },
        staleTime: 60000
    });

// Transactions
export const useTransactions = (filters: any) => {
    return useQuery({
        queryKey: transactionKeys.list(filters),
        queryFn: async (): Promise<{ data: any[]; total: number }> => {
            const response = await transactionApi.getAll(filters);

            // 1. If response itself is an array (Legacy)
            if (Array.isArray(response)) {
                return { data: response, total: response.length };
            }

            // 2. If response is { data, total } (actual backend format)
            if (response && Array.isArray(response.data)) {
                return { data: response.data, total: response.total ?? response.data.length };
            }

            // 3. If response is { success, data, total } (wrapped format)
            if (response && response.success) {
                const data = response.data;
                if (Array.isArray(data)) {
                    return { data, total: response.total || data.length };
                }
                if (data && typeof data === 'object' && 'transactions' in data) {
                    const d = data as { transactions: any[], total: number };
                    return { data: d.transactions, total: d.total || response.total || d.transactions.length };
                }
            }

            return { data: [], total: 0 };
        },
    });
};

// Reports
export const useStockTrail = (filters: any) => {
    return useQuery({
        queryKey: stockTrailKeys.allList(filters),
        queryFn: () => window.api.getStockTrailAll(filters),
    });
};

export const useSalesReport = (filters: any, enabled = true) => {
    return useQuery({
        queryKey: reportKeys.sales(filters),
        queryFn: () => window.api.getSalesReport(filters.date_from, filters.date_to),
        enabled,
    });
};

export const useProfitReport = (filters: any, enabled = true) => {
    return useQuery({
        queryKey: reportKeys.profit(filters),
        queryFn: () => window.api.getProfitReport(filters.date_from, filters.date_to),
        enabled,
    });
};

export const useComparisonReport = (filters: any, enabled = true) => {
    return useQuery({
        queryKey: reportKeys.comparison(filters),
        queryFn: () => window.api.getPeriodComparison(filters.date_from, filters.date_to, filters.date_from_2, filters.date_to_2),
        enabled: enabled && !!(filters.date_from && filters.date_to && filters.date_from_2 && filters.date_to_2),
    });
};

export const useComprehensiveReport = (filters: any, enabled = true) => {
    return useQuery({
        queryKey: reportKeys.comprehensive(filters),
        queryFn: () => window.api.getComprehensiveReport(filters.date_from, filters.date_to),
        enabled,
    });
};

export const useStockAuditSummary = (filters: any) => {
    return useQuery({
        queryKey: ['reports', 'stockAudit', filters],
        queryFn: () => window.api.getStockAuditSummary(filters.date_from, filters.date_to),
    });
};

export const useStockTrailReport = (filters: any) => {
    return useQuery({
        queryKey: ['reports', 'stockTrail', { ...filters, exclude_sale: true, limit: 200 }],
        queryFn: () => window.api.getStockTrailAll({
            date_from: filters.date_from,
            date_to: filters.date_to,
            exclude_sale: true,
            limit: 200,
        }),
    });
};

export const useTransactionDetail = (id: number | null) => {
    return useQuery({
        queryKey: transactionKeys.detail(id!),
        queryFn: async () => {
            const res = await transactionApi.getById(id!);
            // Backend main.js mengembalikan objek transaksi secara langsung tanpa dibungkus
            // { success: true, data: ... }. Penanganan ini disesuaikan untuk meng-handle
            // baik apabila dibungkus maupun diekspor langsung.
            if (!res) return null;
            if (res.success !== undefined) return res.success ? res.data : null;
            return res; // Objek transaksi langsung
        },
        enabled: !!id,
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: transactionApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        },
    });
};

export const useVoidTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: transactionApi.void,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        },
    });
};

// Settings
export const useSettings = () =>
    useQuery({ queryKey: settingsKeys.detail(), queryFn: settingsApi.get, staleTime: 300000 });

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: settingsApi.update,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
    });
};

// Database
export const useDbStats = () =>
    useQuery({ queryKey: ['database', 'stats'], queryFn: () => window.api.getDbStats() });

export const useBackupHistory = () =>
    useQuery({ queryKey: ['database', 'backup-history'], queryFn: () => window.api.dbGetBackupHistory() });

export const useArchivableCount = (months: number) =>
    useQuery({ queryKey: ['database', 'archivable-count', months], queryFn: () => window.api.dbGetArchivableCount(months), enabled: !!months });

export const useDatabaseMutation = () => {
    const queryClient = useQueryClient();
    return {
        vacuum: useMutation({
            mutationFn: () => window.api.dbVacuum(),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database'] }),
        }),
        clearVoided: useMutation({
            mutationFn: () => window.api.dbClearVoided(),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database'] }),
        }),
        archive: useMutation({
            mutationFn: (months: number) => window.api.dbArchiveTransactions(months),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database'] }),
        }),
        resetSettings: useMutation({
            mutationFn: () => window.api.dbResetSettings(),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['database'] });
                queryClient.invalidateQueries({ queryKey: ['settings'] });
            },
        }),
        createBackup: useMutation({
            mutationFn: () => window.api.dbCreateBackup(),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database'] }),
        }),
        deleteBackup: useMutation({
            mutationFn: (path: string) => window.api.dbDeleteBackup(path),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['database'] }),
        }),
    };
};

// Debts
export const useOutstandingDebts = (filters: any) =>
    useQuery({
        queryKey: debtKeys.outstanding(filters),
        queryFn: async () => {
            const res = await window.api.getOutstandingDebts(filters);
            return res.success ? (res.data || []) : [];
        }
    });

export const useDebtSummary = () =>
    useQuery({ queryKey: debtKeys.summary(), queryFn: () => window.api.getDebtSummary() });

export const useAddTransactionPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => transactionApi.addPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: debtKeys.all });
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
};

// Stock Trail
export const useStockTrailByProduct = (id: number, limit: number) =>
    useQuery({ queryKey: stockTrailKeys.byProduct(id, limit), queryFn: () => window.api.getStockTrailAll({ product_id: id, limit }), enabled: !!id });
