import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import * as XLSX from 'xlsx';
import {
    useLowStockProducts,
    useSettings,
    useUpdateProductWithAudit
} from '@/lib/queries';
import {
    Package,
    Download,
    RefreshCw,
    AlertTriangle,
    Check,
    X,
    ShoppingCart,
    TrendingUp,
    Layout
} from 'lucide-react';
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
    const [threshold, setThreshold] = useState(5);
    const [orderQty, setOrderQty] = useState<Record<number, number>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Queries
    const { data: settings = {} as any } = useSettings();
    const { data: rawProducts = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useLowStockProducts(threshold);
    const updateProductMutation = useUpdateProductWithAudit();

    const products = useMemo(() => {
        const margin = parseFloat(settings.default_margin_percent || "10.5");
        const costMultiplier = 1 - (margin / 100);
        return rawProducts.map((p: any) => ({
            ...p,
            calculatedCost: (p.cost && p.cost > 0) ? p.cost : Math.round(p.price * costMultiplier)
        }));
    }, [rawProducts, settings.default_margin_percent]);

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
                alert(`✅ Berhasil update stok ${successCount} produk!`);
            } else {
                alert(`⚠️ Update selesai: ${successCount}/${productsToUpdate.length} produk berhasil.`);
            }
        } catch (err: any) {
            console.error('Failed to update stock:', err);
            alert('❌ Gagal update stok: ' + (err.message || 'Unknown error'));
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
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Konfirmasi Update Stok</DialogTitle>
                        <DialogDescription>
                            Anda akan menambah stok untuk <strong>{productsToUpdate.length}</strong> produk berikut.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[40vh] overflow-y-auto border dark:border-gray-800 rounded-xl mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <TableHead className="font-bold">PRODUK</TableHead>
                                    <TableHead className="text-center font-bold">LAMA</TableHead>
                                    <TableHead className="text-center font-bold">TAMBAH</TableHead>
                                    <TableHead className="text-center font-bold">BARU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsToUpdate.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-bold">{item.name}</TableCell>
                                        <TableCell className="text-center text-gray-500">{item.currentStock}</TableCell>
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
                            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {updating ? 'Menyimpan...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Stok Rendah</h2>
                    <p className="text-sm text-gray-500 font-medium">Monitoring stok produk di bawah ambang batas (≤ {threshold})</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Card className="border-none shadow-sm flex items-center h-11 px-3 bg-gray-50 dark:bg-gray-800">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-3">Ambang Batas:</label>
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
                        <ShoppingCart className="w-4 h-4" /> Update Stok ({productsToUpdate.length})
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                    title="Produk Perlu Restok"
                    value={products.length.toString()}
                    icon={AlertTriangle}
                    color="orange"
                />
                <StatCard
                    title="Total Nilai Restok"
                    value={formatCurrency(totalOrderValue)}
                    icon={TrendingUp}
                    color="blue"
                />
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                <CardContent className="p-0">
                    {isLoadingProducts ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCw className="w-10 h-10 text-primary-600 animate-spin" />
                            <p className="text-gray-500 font-bold">Memindai stok gudang...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30">
                            <Check className="w-20 h-20 text-green-500" />
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">Semua Stok Aman!</p>
                                <p className="text-sm font-medium">Tidak ada produk di bawah ambang batas ≤ {threshold}</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/30 dark:bg-gray-800/20 border-b dark:border-gray-800">
                                    <TableHead className="font-black text-[10px] uppercase dark:text-gray-400 pl-6 h-14 w-16">NO</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase dark:text-gray-400">NAMA PRODUK</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase dark:text-gray-400">STOK</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">H. JUAL</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">H. MODAL</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase dark:text-gray-400 w-32">TAMBAH</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400 pr-6">SUBTOTAL</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y">
                                {products.map((product: any, index: number) => (
                                    <TableRow key={product.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all border-gray-100 dark:border-gray-800 h-16">
                                        <TableCell className="pl-6 text-xs font-black text-gray-400">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 dark:text-gray-100">{product.name}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{product.category_name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "font-black text-xs px-3 shadow-none",
                                                product.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400" :
                                                    product.stock <= 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400" :
                                                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                                            )}>
                                                {product.stock} {product.unit}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-gray-500">{formatCurrency(product.price)}</TableCell>
                                        <TableCell className="text-right font-bold text-gray-500">{formatCurrency(product.calculatedCost)}</TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={orderQty[product.id] || 0}
                                                onChange={(e) => handleQtyChange(product.id, e.target.value)}
                                                className="w-24 h-9 bg-gray-50 border-none shadow-inner font-bold text-center mx-auto"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-black text-gray-900 dark:text-gray-100">
                                            {formatCurrency((orderQty[product.id] || 0) * product.calculatedCost)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <tfoot className="bg-gray-900 text-white font-black">
                                <TableRow className="h-16">
                                    <TableCell colSpan={5} className="text-right pl-6 border-none uppercase tracking-widest text-[10px] text-gray-400">Total Purchase Request:</TableCell>
                                    <TableCell className="text-center border-none text-lg">
                                        {products.reduce((sum, p) => sum + (orderQty[p.id] || 0), 0)}
                                    </TableCell>
                                    <TableCell className="text-right pr-6 border-none text-xl text-primary-400">
                                        {formatCurrency(totalOrderValue)}
                                    </TableCell>
                                </TableRow>
                            </tfoot>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-blue-500 shadow-blue-500/20",
        orange: "bg-orange-500 shadow-orange-500/20",
    } as any;

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-900 group">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
