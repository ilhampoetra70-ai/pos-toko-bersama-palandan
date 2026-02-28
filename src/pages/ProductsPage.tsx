import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    useProducts,
    useCategories,
    useSettings,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useBulkDeleteProducts,
    useStockTrailByProduct,
    useCreateCategory,
    useDeleteCategory
} from '@/lib/queries';
import { formatCurrency } from '../utils/format';
import ExcelManager from '../components/ExcelManager';
import BarcodePreviewModal from '../components/BarcodePreviewModal';
import BatchBarcodeModal from '../components/BatchBarcodeModal';
import { Plus, FileSpreadsheet, Search, Filter, Download, Edit, Barcode, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, AlertCircle, LayoutGrid, Settings2, Check } from 'lucide-react';
import { RetroBox, RetroTrash, RetroHistory, RetroRefresh } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = [
    { text: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary/10 dark:bg-primary/20' },
    { text: 'text-orange-800 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-400/10' },
    { text: 'text-purple-800 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-400/10' },
    { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-400/10' },
    { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-400/10' },
    { text: 'text-cyan-800 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-400/10' },
];

// Format number with dot separator (1000 → 1.000)
const formatNumberLocal = (value: any) => {
    const num = String(value).replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('id-ID');
};

// Parse formatted number back to raw digits
const parseNumberLocal = (formatted: any) => {
    return String(formatted).replace(/\D/g, '');
};

export default function ProductsPage() {
    const { hasRole, user } = useAuth();
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [showCatForm, setShowCatForm] = useState(false);
    const [showExcel, setShowExcel] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ barcode: '', name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
    const [catForm, setCatForm] = useState({ name: '', description: '' });
    const [newCatName, setNewCatName] = useState('');
    const [error, setError] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
    const [stockHistory, setStockHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [barcodePreviewProduct, setBarcodePreviewProduct] = useState<any>(null);
    const [showBatchBarcode, setShowBatchBarcode] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [catToDelete, setCatToDelete] = useState<any>(null);
    const [catError, setCatError] = useState('');
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    // --- Queries ---
    const { data: productsData, isLoading: loadingProducts } = useProducts({
        search,
        category_id: filterCategory === 'all' ? undefined : filterCategory,
        active: 1,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
    });

    const products = productsData?.data || (Array.isArray(productsData) ? productsData : []);
    const totalProducts = productsData?.total || (Array.isArray(productsData) ? productsData.length : 0);

    const { data: categories = [] } = useCategories();
    const { data: settings } = useSettings();
    const defaultMarginFromSettings = settings?.default_margin_percent ? parseFloat(settings.default_margin_percent) : 10.5;

    // Clear selection when products change
    useEffect(() => {
        setSelectedProducts([]);
    }, [products]);

    // Reset page when search or filter changes
    useEffect(() => {
        setPage(1);
    }, [search, filterCategory]);

    // --- Mutations ---
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const bulkDeleteMutation = useBulkDeleteProducts();
    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const requestSort = (key: string) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setPage(1);
    };

    const [isManualCost, setIsManualCost] = useState(false);
    const [defaultMargin, setDefaultMargin] = useState(10.5);

    useEffect(() => {
        if (defaultMarginFromSettings) setDefaultMargin(defaultMarginFromSettings);
    }, [defaultMarginFromSettings]);

    const resetForm = () => {
        setForm({ barcode: '', name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
        setEditing(null);
        setShowForm(false);
        setIsManualCost(false);
        setNewCatName('');
        setError('');
    };

    const handleAddNew = async () => {
        const barcode = await window.api.generateBarcode();
        setForm({ barcode, name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
        setEditing(null);
        setIsManualCost(false);
        setNewCatName('');
        setError('');
        setShowForm(true);
    };

    const handleEdit = (product: any) => {
        setEditing(product);
        setForm({
            barcode: product.barcode || '',
            name: product.name,
            category_id: product.category_id || '',
            price: String(product.price),
            cost: String(product.cost),
            stock: String(product.stock),
            unit: product.unit
        });

        if (product.margin_mode === 'manual') {
            setIsManualCost(true);
        } else if (product.margin_mode === 'auto') {
            setIsManualCost(false);
        } else {
            const price = parseInt(product.price) || 0;
            const currentCost = parseInt(product.cost) || 0;
            const multiplier = 1 - (defaultMargin / 100);
            const calculatedCost = Math.round(price * multiplier);
            const isStandard = Math.abs(currentCost - calculatedCost) <= 100;
            setIsManualCost(!isStandard);
        }

        const cat = categories.find(c => c.id === product.category_id);
        setNewCatName(cat ? cat.name : '');
        setShowForm(true);
    };

    const handleNumberChange = (field: string, value: string) => {
        const raw = parseNumberLocal(value);

        if (field === 'price') {
            const priceVal = parseInt(raw) || 0;
            const updates = { [field]: raw } as any;

            if (!isManualCost) {
                const multiplier = 1 - (defaultMargin / 100);
                updates.cost = String(Math.round(priceVal * multiplier));
            }

            setForm(f => ({ ...f, ...updates }));
        } else {
            setForm(f => ({ ...f, [field]: raw }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            let categoryId = null;

            if (newCatName.trim()) {
                const existing = categories.find((c: any) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
                if (existing) {
                    categoryId = existing.id;
                } else {
                    // We don't want to await here if we want optimistic updates, but for categories it's safer to just let the user save.
                    // Actually, the original code awaited.
                    const cat = await window.api.createCategory(newCatName.trim(), '');
                    categoryId = cat.data ? cat.data.id : null;
                }
            }

            const data = {
                ...form,
                price: parseInt(form.price) || 0,
                cost: parseInt(form.cost) || 0,
                stock: parseInt(form.stock) || 0,
                category_id: categoryId,
                margin_mode: isManualCost ? 'manual' : 'auto',
                userId: user?.id,
                userName: user?.name || user?.username || 'System'
            };

            if (editing) {
                const stockChanged = editing.stock !== data.stock;
                // Standardize barcode: pad numeric codes < 12 digits
                if (data.barcode && /^\d+$/.test(data.barcode) && data.barcode.length < 12) {
                    data.barcode = data.barcode.padStart(12, '0');
                }

                if (stockChanged) {
                    const auditUser = user || { id: null, name: 'System', username: 'system' };
                    updateProductMutation.mutate({
                        id: editing.id,
                        data,
                        auditInfo: {
                            userId: auditUser.id,
                            userName: auditUser.name || auditUser.username || 'System',
                            source: 'manual'
                        }
                    }, {
                        onSuccess: () => {
                            resetForm();
                        }
                    });
                } else {
                    updateProductMutation.mutate({ id: editing.id, data }, {
                        onSuccess: () => {
                            resetForm();
                        }
                    });
                }
            } else {
                // Standardize barcode for new product
                if (data.barcode && /^\d+$/.test(data.barcode) && data.barcode.length < 12) {
                    data.barcode = data.barcode.padStart(12, '0');
                }
                createProductMutation.mutate(data, {
                    onSuccess: () => {
                        resetForm();
                    }
                });
            }
        } catch (err: any) {
            setError('Gagal menyimpan: ' + (err.message || 'Error'));
        }
    };

    const handleDelete = (product: any) => {
        setProductToDelete(product);
    };

    const confirmDeleteProduct = () => {
        if (!productToDelete) return;
        const product = productToDelete;
        setProductToDelete(null);
        deleteProductMutation.mutate(product.id, {
            onSuccess: () => {
                if (expandedProduct === product.id) {
                    setExpandedProduct(null);
                }
            }
        });
    };

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCatError('');
        createCategoryMutation.mutate(catForm.name, {
            onSuccess: () => {
                setCatForm({ name: '', description: '' });
            },
            onError: (err: any) => {
                setCatError('Gagal: ' + err.message);
            }
        });
    };

    const handleDeleteCategory = (cat: any) => {
        setCatToDelete(cat);
    };

    const confirmDeleteCategory = () => {
        if (!catToDelete) return;
        const cat = catToDelete;
        setCatToDelete(null);
        deleteCategoryMutation.mutate(cat.id);
    };

    const handleRegenerateBarcode = async () => {
        const barcode = await window.api.generateBarcode();
        setForm(f => ({ ...f, barcode }));
    };

    const toggleSelectAll = useCallback(() => {
        setSelectedProducts(prev =>
            prev.length === products.length ? [] : products.map(p => p.id)
        );
    }, [products]);

    const toggleSelectProduct = useCallback((id: number) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }, []);

    const handleBulkDelete = () => {
        if (selectedProducts.length === 0) return;
        setShowBulkDeleteDialog(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteDialog(false);
        bulkDeleteMutation.mutate(selectedProducts);
    };

    const toggleStockHistory = async (productId: number) => {
        if (expandedProduct === productId) {
            setExpandedProduct(null);
        } else {
            setExpandedProduct(productId);
        }
    };

    const canEdit = hasRole('admin', 'supervisor', 'cashier');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">Produk</h2>
                    <p className="text-sm text-muted-foreground font-medium">Kelola inventaris dan katalog produk</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canEdit && (
                        <>
                            <Button variant="outline" onClick={() => setShowExcel(true)} className="gap-2 h-11 px-4 shadow-sm">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                <span className="hidden sm:inline">Excel</span>
                            </Button>
                            <Button variant="outline" onClick={() => setShowCatForm(true)} className="gap-2 h-11 px-4 shadow-sm">
                                <LayoutGrid className="w-4 h-4 text-primary-600" />
                                <span className="hidden sm:inline">Kategori</span>
                            </Button>
                            <Button onClick={handleAddNew} className="gap-2 h-11 px-4 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20">
                                <Plus className="w-5 h-5" />
                                <span>Tambah Produk</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-3" />
                            <Input
                                className="pl-10 h-11 bg-background/50 border-none shadow-inner"
                                placeholder="Cari produk berdasarkan nama atau barcode..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="h-11 bg-background/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Semua Kategori" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedProducts.length > 0 && canEdit && (
                <div className="bg-primary-600 text-white rounded-2xl p-4 shadow-lg shadow-primary-600/20 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center font-bold">
                                {selectedProducts.length}
                            </div>
                            <p className="font-bold">Produk dipilih</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setShowBatchBarcode(true)} className="font-bold gap-2">
                                <Barcode className="w-4 h-4" />
                                Print Labels
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="font-bold gap-2">
                                <RetroTrash className="w-4 h-4" />
                                Hapus
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])} className="text-white hover:bg-card/10 decoration-white">
                                Batal
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                    <Table className="zebra-rows">
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-b border-border">
                                {canEdit && (
                                    <TableHead className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded-md border-border text-primary-600 focus:ring-primary-500"
                                            checked={products.length > 0 && selectedProducts.length === products.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('barcode')}>
                                    Barcode {sortConfig.key === 'barcode' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('name')}>
                                    Nama Produk {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('category_name')}>
                                    Kategori {sortConfig.key === 'category_name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </TableHead>
                                {hasRole('admin', 'supervisor') && (
                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('cost')}>
                                        Modal {sortConfig.key === 'cost' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                    </TableHead>
                                )}
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('price')}>
                                    Harga {sortConfig.key === 'price' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground cursor-pointer hover:text-primary-600" onClick={() => requestSort('stock')}>
                                    Stok {sortConfig.key === 'stock' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">Unit</TableHead>
                                {canEdit && <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-20 text-muted-foreground">
                                        <RetroBox className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                        <p className="font-bold text-lg">Tidak ada produk ditemukan</p>
                                        <p className="text-sm">Silakan tambah produk baru atau sesuaikan filter</p>
                                    </TableCell>
                                </TableRow>
                            ) : products.map(p => (
                                <React.Fragment key={p.id}>
                                    <TableRow className={cn(
                                        "hover:bg-muted/30 transition-colors border-b border-border",
                                        selectedProducts.includes(p.id) && "bg-primary-50 dark:bg-primary-900/10",
                                        expandedProduct === p.id && "bg-primary/50 dark:bg-primary/10"
                                    )}>
                                        {canEdit && (
                                            <TableCell className="text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded-md border-border text-primary-600 focus:ring-primary-500"
                                                    checked={selectedProducts.includes(p.id)}
                                                    onChange={() => toggleSelectProduct(p.id)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="font-sans text-xs text-muted-foreground">{p.barcode || '-'}</TableCell>
                                        <TableCell className="font-bold text-foreground dark:text-foreground">{p.name}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                CATEGORY_COLORS[(p.category_id || 0) % CATEGORY_COLORS.length].bg,
                                                CATEGORY_COLORS[(p.category_id || 0) % CATEGORY_COLORS.length].text
                                            )}>
                                                {p.category_name || 'Tanpa Kategori'}
                                            </span>
                                        </TableCell>
                                        {hasRole('admin', 'supervisor') && (
                                            <TableCell className="text-right text-muted-foreground font-medium">{formatCurrency(p.cost)}</TableCell>
                                        )}
                                        <TableCell className="text-right font-black text-primary-700 dark:text-primary-400">{formatCurrency(p.price)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleStockHistory(p.id)}
                                                className={cn("font-black gap-1.5 h-7", p.stock <= 5 ? "text-red-800 bg-red-50 hover:bg-red-100" : "text-foreground")}
                                            >
                                                {p.stock}
                                                <RetroHistory className={cn("w-3 h-3 transition-transform", expandedProduct === p.id && "rotate-180")} />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-bold">{p.unit}</Badge>
                                        </TableCell>
                                        {canEdit && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        {p.barcode && (
                                                            <DropdownMenuItem onClick={() => setBarcodePreviewProduct(p)} className="gap-2">
                                                                <Barcode className="w-4 h-4" /> Labelling
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleEdit(p)} className="gap-2">
                                                            <Edit className="w-4 h-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(p)} className="gap-2 text-red-800 focus:text-red-600 focus:bg-red-50">
                                                            <RetroTrash className="w-4 h-4" /> Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                    {expandedProduct === p.id && (
                                        <TableRow className="bg-primary/30 dark:bg-primary/5">
                                            <TableCell colSpan={10} className="p-0 border-b">
                                                <StockHistoryPanelWrapper
                                                    productId={p.id}
                                                    productName={p.name}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card dark:bg-background rounded-2xl shadow-sm border border-transparent">
                <div className="text-sm font-bold text-muted-foreground">
                    Showing <span className="text-foreground">{Math.min(products.length, pageSize)}</span> of <span className="text-foreground">{totalProducts}</span> items
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-10 w-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {(() => {
                            const totalPages = Math.ceil(totalProducts / pageSize);
                            if (totalPages <= 1) return null;

                            const pages = [];
                            let startPage = Math.max(1, page - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            if (endPage - startPage < 2) startPage = Math.max(1, endPage - 2);

                            for (let i = startPage; i <= endPage; i++) pages.push(i);

                            return pages.map(pageNum => (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPage(pageNum)}
                                    className={cn("h-10 w-10 font-black", page === pageNum && "shadow-lg shadow-primary-600/20")}
                                >
                                    {pageNum}
                                </Button>
                            ));
                        })()}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => Math.min(Math.ceil(totalProducts / pageSize), p + 1))}
                        disabled={page >= Math.ceil(totalProducts / pageSize) || totalProducts === 0}
                        className="h-10 w-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">Rows:</span>
                    <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setPage(1); }}>
                        <SelectTrigger className="w-20 h-10 font-bold border-none bg-muted/50 data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={resetForm}>
                <DialogContent className="sm:max-w-lg h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-card dark:bg-background">
                    <DialogHeader className="p-6 pb-4 border-b shrink-0">
                        <DialogTitle className="text-xl font-black">{editing ? 'Edit Produk' : 'Produk Baru'}</DialogTitle>
                        <DialogDescription>Isi detail produk dengan lengkap</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 bg-card dark:bg-background">
                        <form id="product-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="alert-adaptive-error">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="prod-name">Nama Produk <span className="text-red-500">*</span></Label>
                                <Input id="prod-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="h-11" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="prod-cat">Kategori</Label>
                                <Input
                                    id="prod-cat"
                                    list="category-suggestions"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="Ketik kategori..."
                                    className="h-11 font-medium"
                                />
                                <datalist id="category-suggestions">
                                    {categories.map(c => <option key={c.id} value={c.name} />)}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {hasRole('admin', 'supervisor') && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label>Harga Modal</Label>
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded w-3 h-3 text-primary-600"
                                                    checked={isManualCost}
                                                    onChange={e => setIsManualCost(e.target.checked)}
                                                />
                                                MANUAL
                                            </label>
                                        </div>
                                        <Input
                                            type="text"
                                            className={cn("h-11 font-bold", !isManualCost && "bg-muted text-muted-foreground cursor-not-allowed")}
                                            value={formatNumberLocal(form.cost)}
                                            onChange={e => handleNumberChange('cost', e.target.value)}
                                            readOnly={!isManualCost}
                                        />
                                        {!isManualCost && <p className="text-[9px] font-bold text-muted-foreground">OTOMATIS (MARGIN {defaultMargin}%)</p>}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label>Harga Jual <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="text"
                                        className="h-11 font-black text-primary-700"
                                        value={formatNumberLocal(form.price)}
                                        onChange={e => handleNumberChange('price', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Stok Awal</Label>
                                    <Input
                                        type="text"
                                        className="h-11 font-bold"
                                        value={formatNumberLocal(form.stock)}
                                        onChange={e => handleNumberChange('stock', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Satuan</Label>
                                    <Input className="h-11 font-medium" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                                </div>
                            </div>
                            <div className="h-4"></div> {/* Spacer */}
                        </form>
                    </div>

                    <DialogFooter className="p-6 border-t bg-background/50 shrink-0 gap-2">
                        <Button type="button" variant="ghost" onClick={resetForm} className="h-12 font-bold flex-1">Batal</Button>
                        <Button type="submit" form="product-form" className="h-12 font-bold flex-1 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20">Simpan Produk</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCatForm} onOpenChange={() => setShowCatForm(false)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col bg-card dark:bg-background">
                    <DialogHeader className="p-6 border-b shrink-0">
                        <DialogTitle className="text-xl font-black">Kelola Kategori</DialogTitle>
                        <DialogDescription>Tambah atau hapus kategori produk</DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <form onSubmit={handleCatSubmit} className="flex gap-2">
                            <Input className="flex-1 h-11" placeholder="Nama kategori baru..." value={catForm.name} onChange={e => { setCatForm(f => ({ ...f, name: e.target.value })); setCatError(''); }} required />
                            <Button type="submit" className="h-11 font-bold bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/10">
                                <Plus className="w-4 h-4 mr-2" /> Tambah
                            </Button>
                        </form>
                        {catError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-bold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{catError}</span>
                            </div>
                        )}

                        <ScrollArea className="h-64 border rounded-2xl p-3 bg-background/30">
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3.5 bg-card dark:bg-background rounded-xl border border-border dark:border-border shadow-sm group">
                                        <span className="text-sm font-bold text-muted-foreground dark:text-muted-foreground">{cat.name}</span>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat)} className="h-8 w-8 text-red-400 hover:text-red-800 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                            <RetroTrash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground italic text-sm font-medium">Belum ada kategori</div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="p-4 border-t bg-background/50 shrink-0">
                        <Button variant="ghost" onClick={() => setShowCatForm(false)} className="w-full font-bold h-11">Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showExcel && <ExcelManager onClose={() => setShowExcel(false)} />}
            {barcodePreviewProduct && <BarcodePreviewModal product={barcodePreviewProduct} onClose={() => setBarcodePreviewProduct(null)} />}
            {showBatchBarcode && <BatchBarcodeModal products={products.filter(p => selectedProducts.includes(p.id))} onClose={() => setShowBatchBarcode(false)} />}

            <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-black">Hapus Produk</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus produk <strong>{productToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setProductToDelete(null)} className="font-bold">Batal</Button>
                        <Button onClick={confirmDeleteProduct} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!catToDelete} onOpenChange={() => setCatToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-black">Hapus Kategori</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus kategori <strong>{catToDelete?.name}</strong>? Produk dalam kategori ini tidak akan ikut terhapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setCatToDelete(null)} className="font-bold">Batal</Button>
                        <Button onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-black">Hapus Massal</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus <strong>{selectedProducts.length} produk</strong> yang dipilih? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} className="font-bold">Batal</Button>
                        <Button onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus {selectedProducts.length} Produk</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StockHistoryPanelWrapper({ productId, productName }: any) {
    const { data: history = [], isLoading } = useStockTrailByProduct(productId, 20);
    return <StockHistoryPanel history={history} loading={isLoading} productName={productName} />;
}

const StockHistoryPanel = React.memo(function StockHistoryPanel({ history, loading, productName }: any) {
    const [showSales, setShowSales] = useState(false);
    const displayedHistory = showSales ? history : history.filter((h: any) => h.event_type !== 'sale');

    return (
        <div className="p-6 bg-card dark:bg-background animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary-700 dark:text-primary-400"><RetroHistory className="w-5 h-5" /></div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground dark:text-foreground">Riwayat Perubahan Stok</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{productName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-black text-muted-foreground cursor-pointer bg-muted px-3 py-1.5 rounded-full hover:bg-muted transition-colors">
                        <input type="checkbox" className="rounded w-3.5 h-3.5" checked={showSales} onChange={e => setShowSales(e.target.checked)} />
                        TAMPILKAN PENJUALAN
                    </label>
                </div>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-sm">
                <Table className="zebra-rows">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="border-b border-border">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">WAKTU</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">AKSI</TableHead>
                            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-3 text-primary">AWAL</TableHead>
                            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-3 text-orange-600">PERUBAHAN</TableHead>
                            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-3 text-green-600">AKHIR</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">USER/SUMBER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10"><RetroRefresh className="w-5 h-5 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                        ) : displayedHistory.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-medium italic">Tidak ada catatan riwayat</TableCell></TableRow>
                        ) : displayedHistory.map((h: any, i: number) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors border-b border-border">
                                <TableCell className="text-xs font-medium text-muted-foreground">{new Date(h.created_at).toLocaleString('id-ID')}</TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        "font-bold text-[9px] uppercase tracking-tighter px-1.5 h-5",
                                        h.event_type === 'sale' ? "bg-purple-100 text-purple-800 hover:bg-purple-100 shadow-none" : "bg-primary text-primary-foreground hover:bg-primary shadow-none"
                                    )}>
                                        {h.event_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-xs text-muted-foreground">{h.quantity_before}</TableCell>
                                <TableCell className={cn("text-right font-black text-xs", h.quantity_change > 0 ? "text-green-600" : "text-red-600")}>
                                    {h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}
                                </TableCell>
                                <TableCell className="text-right font-black text-xs text-foreground dark:text-foreground">{h.quantity_after}</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-medium">
                                    {h.user_name || 'System'} <span className="opacity-50">— {h.reference_id || 'manual'}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});
