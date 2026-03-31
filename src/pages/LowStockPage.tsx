import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import * as XLSX from 'xlsx';
import {
    useLowStockProducts,
    useSettings,
    useUpdateProductWithAudit
} from '@/lib/queries';
import { Download, Check, X, Layout } from 'lucide-react';
import { RetroBox, RetroRefresh, RetroAlert, RetroCart, RetroMoney } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function LowStockPage() {
    const { user } = useAuth();
    const [threshold, setThreshold] = useState(10);
    const [orderQty, setOrderQty] = useState<Record<number, number>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [updateResult, setUpdateResult] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Queries
    const { data: settings = {} as any } = useSettings();
    const { data: rawProducts = [], isLoading: isLoadingProducts, isError: isErrorProducts, refetch: refetchProducts } = useLowStockProducts(threshold);
    const updateProductMutation = useUpdateProductWithAudit();

    const products = useMemo(() => {
        const margin = parseFloat(settings.default_margin_percent || "10.5");
        const costMultiplier = 1 - (margin / 100);
        return rawProducts.map((p: any) => ({
            ...p,
            calculatedCost: (p.cost && p.cost > 0) ? p.cost : Math.round(p.price * costMultiplier)
        }));
    }, [rawProducts, settings.default_margin_percent]);

    const totalPages = Math.ceil(products.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return products.slice(startIndex, startIndex + itemsPerPage);
    }, [products, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [threshold]);

    const handleQtyChange = (productId: number, value: string) => {
        setOrderQty(prev => ({
            ...prev,
            [productId]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const productsToUpdate = useMemo(() => {
        return products.filter((p: any) => (orderQty[p.id] || 0) > 0).map((p: any) => ({
            id: p.id,
            name: p.name,
            currentStock: p.stock,
            addQty: orderQty[p.id],
            newStock: p.stock + orderQty[p.id],
            barcode: p.barcode,
            category_id: p.category_id,
            price: p.price,
            cost: p.cost || 0,
            unit: p.unit || 'pcs',
            margin_mode: p.margin_mode || 'manual'
        }));
    }, [products, orderQty]);

    const handleUpdateStock = async () => {
        if (productsToUpdate.length === 0) return;

        let successCount = 0;
        try {
            for (const item of productsToUpdate) {
                try {
                    await updateProductMutation.mutateAsync({
                        id: item.id,
                        data: {
                            name: item.name,
                            category_id: item.category_id,
                            barcode: item.barcode,
                            price: item.price,
                            cost: item.cost,
                            stock: item.newStock,
                            unit: item.unit,
                            margin_mode: item.margin_mode
                        },
                        auditInfo: {
                            userId: user?.id || null,
                            userName: user?.name || user?.username || 'System',
                            source: 'restock'
                        }
                    });
                    successCount++;
                } catch (itemErr) {
                    console.error(`Failed to update ${item.name}:`, itemErr);
                }
            }
            setShowConfirmDialog(false);
            setOrderQty({}); // Reset order quantities
            refetchProducts();

            if (successCount === productsToUpdate.length) {
                setUpdateResult(`✅ Berhasil update stok ${successCount} produk!`);
            } else {
                setUpdateResult(`⚠️ Update selesai: ${successCount}/${productsToUpdate.length} produk berhasil.`);
            }
        } catch (err: any) {
            console.error('Failed to update stock:', err);
            setUpdateResult('❌ Gagal update stok: ' + (err.message || 'Unknown error'));
        }
    };

    const exportToExcel = () => {
        const exportData = products.map((p, i) => ({
            'No': i + 1,
            'Nama Produk': p.name,
            'Kategori': p.category_name || '-',
            'Barcode': p.barcode || '-',
            'Stok Saat Ini': p.stock,
            'Satuan': p.unit || 'pcs',
            'Harga Jual': p.price,
            'Harga Modal': p.calculatedCost,
            'Tambah Stok': orderQty[p.id] || 0,
            'Stok Baru': p.stock + (orderQty[p.id] || 0),
            'Total Modal': (orderQty[p.id] || 0) * p.calculatedCost
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stok Rendah');

        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `purchase-request-${today}.xlsx`);
    };

    const totalOrderValue = products.reduce((sum, p) => sum + ((orderQty[p.id] || 0) * p.calculatedCost), 0);
    const updating = updateProductMutation.isPending;

    return (
        <div className="space-y-6">
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-2xl bg-card dark:bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Konfirmasi Update Stok</DialogTitle>
                        <DialogDescription>
                            Anda akan menambah stok untuk <strong>{productsToUpdate.length}</strong> produk berikut.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[40vh] overflow-y-auto border border-border rounded-xl mt-4">
                        <Table className="zebra-rows">
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="border-b border-border">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">PRODUK</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">LAMA</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">TAMBAH</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-3 text-muted-foreground">BARU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsToUpdate.map((item: any) => (
                                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold">{item.name}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{item.currentStock}</TableCell>
                                        <TableCell className="text-center text-green-600 font-bold">+{item.addQty}</TableCell>
                                        <TableCell className="text-center text-primary-600 font-black">{item.newStock}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-bold text-primary-700 dark:text-primary-400 uppercase tracking-widest">Total Nilai Pembelian</span>
                        <span className="text-xl font-black text-primary-600">{formatCurrency(totalOrderValue)}</span>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={updating} className="font-bold">Batal</Button>
                        <Button onClick={handleUpdateStock} disabled={updating} className="bg-primary-600 hover:bg-primary-700 font-black shadow-lg shadow-primary-600/20 gap-2 min-w-[140px]">
                            {updating ? <RetroRefresh className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {updating ? 'Menyimpan...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">Stok Rendah</h2>
                    <p className="text-sm text-muted-foreground font-medium">Monitoring stok produk di bawah ambang batas (≤ {threshold})</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Card className="border-none shadow-sm flex items-center h-11 px-3 bg-background dark:bg-card">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-3">Ambang Batas:</label>
                        <Select
                            value={threshold.toString()}
                            onValueChange={(v) => {
                                setThreshold(parseInt(v));
                                setOrderQty({});
                            }}
                        >
                            <SelectTrigger className="w-20 border-none bg-transparent font-black shadow-none h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 15, 20, 25, 50, 100].map(opt => (
                                    <SelectItem key={opt} value={opt.toString()}>≤ {opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Card>

                    <Button variant="outline" onClick={exportToExcel} disabled={products.length === 0} className="h-11 px-6 shadow-sm font-bold gap-2">
                        <Download className="w-4 h-4" /> Export CSV/Excel
                    </Button>

                    <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={productsToUpdate.length === 0}
                        className="h-11 px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 font-black gap-2"
                    >
                        <RetroCart className="w-4 h-4" /> Update Stok ({productsToUpdate.length})
                    </Button>
                </div>
            </div>

            {updateResult && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold animate-in fade-in slide-in-from-top-2 ${updateResult.startsWith('✅')
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                    : updateResult.startsWith('⚠️')
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                        : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                    }`}>
                    <span>{updateResult}</span>
                    <button onClick={() => setUpdateResult('')} className="ml-auto text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                    title="Produk Perlu Restok"
                    value={products.length.toString()}
                    icon={RetroAlert}
                    color="orange"
                />
                <StatCard
                    title="Total Nilai Restok"
                    value={formatCurrency(totalOrderValue)}
                    icon={RetroMoney}
                    color="blue"
                />
            </div>

            {/* Table */}
            <Card className="border border-border shadow-sm overflow-hidden bg-card dark:bg-background">
                <CardContent className="p-0 bg-card dark:bg-background">
                    {isLoadingProducts ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RetroRefresh className="w-10 h-10 text-primary-600 animate-spin" />
                            <p className="text-muted-foreground font-bold">Memindai stok gudang...</p>
                        </div>
                    ) : isErrorProducts ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                            <RetroAlert className="w-16 h-16 text-red-400 opacity-60" />
                            <div>
                                <p className="text-xl font-black text-foreground">Gagal Memuat Data</p>
                                <p className="text-sm font-medium text-muted-foreground mt-1">Terjadi kesalahan saat mengambil data stok rendah.</p>
                            </div>
                            <Button onClick={() => refetchProducts()} variant="outline" className="gap-2 font-bold">
                                <RetroRefresh className="w-4 h-4" /> Coba Lagi
                            </Button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30">
                            <Check className="w-20 h-20 text-green-500" />
                            <div>
                                <p className="text-2xl font-black text-foreground dark:text-foreground">Semua Stok Aman!</p>
                                <p className="text-sm font-medium">Tidak ada produk di bawah ambang batas ≤ {threshold}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col bg-card dark:bg-background">
                            <Table className="zebra-rows">
                                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm pointer-events-none">
                                    <TableRow className="border-b border-border">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground pl-6 w-16">NO</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">NAMA PRODUK</TableHead>
                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">STOK</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">H. JUAL</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">H. MODAL</TableHead>
                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground w-32">TAMBAH</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground pr-6">SUBTOTAL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="[&_td]:py-1.5">
                                    {paginatedProducts.map((product: any, idx: number) => {
                                        const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                                        return (
                                            <TableRow
                                                key={product.id}
                                                className="group hover:bg-muted/30 transition-colors border-b border-border"
                                            >
                                                <TableCell className="pl-6 text-xs font-black text-muted-foreground">{globalIndex}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-black text-xs text-foreground dark:text-foreground truncate">{product.name}</span>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter shrink-0">{product.category_name || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "font-black text-[10px] px-2 py-0 h-5 shadow-none",
                                                        product.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400" :
                                                            product.stock <= 3 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400" :
                                                                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                                                    )}>
                                                        {product.stock} {product.unit}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-xs text-muted-foreground">{formatCurrency(product.price)}</TableCell>
                                                <TableCell className="text-right font-bold text-xs text-muted-foreground">{formatCurrency(product.calculatedCost)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={orderQty[product.id] || 0}
                                                        onChange={(e) => handleQtyChange(product.id, e.target.value)}
                                                        className="w-20 h-7 bg-background border-none shadow-inner font-bold text-center mx-auto text-xs"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-black text-sm text-foreground dark:text-foreground">
                                                    {formatCurrency((orderQty[product.id] || 0) * product.calculatedCost)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t dark:border-border bg-muted/30">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, products.length)} dari {products.length} Produk
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="h-8 px-3 font-bold text-xs"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={cn(
                                                        "h-8 w-8 p-0 font-black text-xs",
                                                        currentPage === page ? "bg-primary text-white" : ""
                                                    )}
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="h-8 px-3 font-bold text-xs"
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-foreground text-background text-white font-black rounded-b-xl overflow-hidden">
                                <div className="flex h-12 items-center px-6">
                                    <div className="flex-1 text-right pr-4 uppercase tracking-widest text-[10px] text-muted-foreground">Total Purchase Request:</div>
                                    <div className="w-32 text-center text-md">
                                        {products.reduce((sum, p) => sum + (orderQty[p.id] || 0), 0)}
                                    </div>
                                    <div className="w-48 text-right text-lg text-primary-400 relative">
                                        {formatCurrency(totalOrderValue)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-primary shadow-blue-500/20",
        orange: "bg-orange-500 shadow-orange-500/20",
    } as any;

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all bg-card dark:bg-background group">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{title}</p>
                    <p className="text-xl font-black text-foreground dark:text-foreground">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
