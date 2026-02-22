import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import ReceiptPreview from '../components/ReceiptPreview';
import AddPaymentModal from '../components/AddPaymentModal';
import {
    useTransactions,
    useTransactionDetail,
    useVoidTransaction
} from '@/lib/queries';
import {
    FileText,
    Search,
    Filter,
    Calendar,
    Printer,
    Trash2,
    Clock,
    CreditCard,
    Wallet,
    QrCode,
    User,
    Info,
    AlertCircle,
    CheckCircle2,
    X,
    History,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const PAYMENT_STATUS_CONFIG = {
    lunas: { label: 'Lunas', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 shadow-none' },
    pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 shadow-none' },
    hutang: { label: 'Hutang', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 shadow-none' },
    cicilan: { label: 'Cicilan', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 shadow-none' },
} as any;

function PaymentStatusBadge({ status }: { status: string }) {
    const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.lunas;
    return (
        <Badge className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
            {config.label}
        </Badge>
    );
}

export default memo(function TransactionsPage() {
    const { user, hasRole } = useAuth();

    // Default to today
    const getToday = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [filters, setFilters] = useState({
        date_from: getToday(),
        date_to: getToday(),
        status: '',
        payment_status: '',
        customer_search: ''
    });

    // Reset pagination when any filter changes
    useEffect(() => {
        setPage(1);
    }, [filters.date_from, filters.date_to, filters.status, filters.payment_status, filters.customer_search]);
    const [showDetail, setShowDetail] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [printingId, setPrintingId] = useState<number | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions({
        ...filters,
        limit: pageSize,
        offset: (page - 1) * pageSize
    });

    const transactions = transactionsData?.data || [];
    const totalTransactions = transactionsData?.total || 0;

    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: transactions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // height with badges
        overscan: 10,
    });

    const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
    const { data: selectedTx, isLoading: isLoadingDetail, error: detailError } = useTransactionDetail(selectedTxId);

    const voidMutation = useVoidTransaction();

    useEffect(() => {
        // Advance date automatically if midnight passes and user is on "Today"
        const interval = setInterval(() => {
            const currentToday = getToday();
            setFilters(prev => {
                const prevToday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                if (prev.date_from === prevToday || prev.date_to === prevToday) {
                    return {
                        ...prev,
                        date_from: prev.date_from === prevToday ? currentToday : prev.date_from,
                        date_to: prev.date_to === prevToday ? currentToday : prev.date_to
                    };
                }
                return prev;
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const handleRowClick = (tx: any) => {
        setSelectedTxId(tx.id);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setSelectedTxId(null);
    };

    const handleVoid = async (tx: any) => {
        if (!confirm(`Void transaksi ${tx.invoice_number || tx.id}? Stok produk akan dikembalikan.`)) return;
        voidMutation.mutate(tx.id, {
            onSuccess: () => {
                handleCloseDetail();
            },
        });
    };

    const handlePrintFromDetail = () => {
        setShowReceipt(true);
    };

    const handlePrintFromTable = async (e: React.MouseEvent, tx: any) => {
        e.stopPropagation();
        setSelectedTxId(tx.id);
        setShowReceipt(true);
    };

    const handleVoidFromTable = (e: React.MouseEvent, tx: any) => {
        e.stopPropagation();
        handleVoid(tx);
    };

    const handleAddPaymentClick = () => {
        setShowAddPayment(true);
    };

    const handlePaymentAdded = async () => {
        setShowAddPayment(false);
    };

    const paymentMethodConfig = {
        cash: { label: 'Tunai', icon: Wallet, color: 'text-green-600' },
        debit: { label: 'Debit', icon: CreditCard, color: 'text-blue-600' },
        qris: { label: 'QRIS', icon: QrCode, color: 'text-purple-600' },
        transfer: { label: 'Transfer', icon: FileText, color: 'text-orange-600' }
    } as any;

    const paymentLabel = (method: string) => {
        const config = paymentMethodConfig[method];
        return config ? config.label : method;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Transaksi</h2>
                    <p className="text-sm text-gray-500 font-medium">Riwayat dan manajemen transaksi penjualan</p>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cari Pembeli</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <Input
                                    className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-none shadow-inner"
                                    placeholder="Ketik nama atau alamat..."
                                    value={filters.customer_search}
                                    onChange={e => setFilters(f => ({ ...f, customer_search: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dari</label>
                            <Input
                                type="date"
                                className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-none shadow-inner"
                                value={filters.date_from}
                                onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sampai</label>
                            <Input
                                type="date"
                                className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-none shadow-inner"
                                value={filters.date_to}
                                onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full h-11 bg-primary-600 hover:bg-primary-700 shadow-md gap-2 font-bold opacity-50 cursor-not-allowed">
                                <Filter className="w-4 h-4" /> Filter Otomatis
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Transaksi</label>
                            <Select value={filters.status} onValueChange={val => setFilters(f => ({ ...f, status: val === '__all__' ? '' : val }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-none shadow-inner data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua Status</SelectItem>
                                    <SelectItem value="completed">Selesai (Completed)</SelectItem>
                                    <SelectItem value="voided">Dibatalkan (Voided)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Pembayaran</label>
                            <Select value={filters.payment_status} onValueChange={val => setFilters(f => ({ ...f, payment_status: val === '__all__' ? '' : val }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-none shadow-inner data-[state=open]:bg-white dark:data-[state=open]:bg-gray-900">
                                    <SelectValue placeholder="Semua Pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Semua Pembayaran</SelectItem>
                                    <SelectItem value="lunas">Lunas</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="hutang">Hutang</SelectItem>
                                    <SelectItem value="cicilan">Cicilan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <div
                    ref={parentRef}
                    className="h-[calc(100vh-420px)] overflow-auto bg-white dark:bg-gray-950"
                >
                    <Table className="relative border-separate border-spacing-0">
                        <TableHeader className="bg-gray-50/80 dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-b flex items-center w-full">
                                <TableHead className="font-black text-[11px] uppercase tracking-widest py-4 w-[15%]">Invoice</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest w-[15%]">Waktu</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest w-[10%]">Kasir</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest w-[15%]">Pembeli</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-center w-[10%]">Metode</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-right w-[15%]">Total</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-center w-[10%]">Status</TableHead>
                                <TableHead className="font-black text-[11px] uppercase tracking-widest text-right w-[10%]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative'
                            }}
                        >
                            {isLoadingTransactions ? (
                                <TableRow className="absolute w-full flex items-center justify-center py-20">
                                    <TableCell className="border-none">
                                        <Loader2 className="w-8 h-8 animate-spin opacity-20" />
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow className="absolute w-full flex flex-col items-center justify-center py-20 text-gray-400">
                                    <TableCell className="border-none flex flex-col items-center gap-4">
                                        <History className="w-16 h-16 opacity-10" />
                                        <p className="font-bold text-lg text-center">Tidak ada transaksi ditemukan</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const tx = transactions[virtualRow.index];
                                    const isEven = virtualRow.index % 2 === 0;
                                    if (!tx) return null;
                                    return (
                                        <TableRow
                                            key={virtualRow.key}
                                            data-index={virtualRow.index}
                                            ref={rowVirtualizer.measureElement}
                                            className={cn(
                                                "hover:bg-[var(--table-hover)] cursor-pointer transition-colors absolute w-full flex items-center border-b",
                                                !isEven && "bg-[var(--table-zebra)]"
                                            )}
                                            style={{
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            onClick={() => handleRowClick(tx)}
                                        >
                                            <TableCell className="font-medium w-[15%]">{tx.invoice_number}</TableCell>
                                            <TableCell className="text-xs text-gray-500 w-[15%]">
                                                {new Date(tx.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-xs w-[10%]">{tx.cashier_name || '-'}</TableCell>
                                            <TableCell className="text-xs w-[15%] truncate" title={tx.customer_name || 'Umum'}>
                                                {tx.customer_name || 'Umum'}
                                            </TableCell>
                                            <TableCell className="text-center w-[10%]">
                                                <Badge variant="outline" className="font-bold text-[10px] uppercase">
                                                    {tx.payment_method === 'cash' ? 'Tunai' : tx.payment_method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold w-[15%]">
                                                {formatCurrency(tx.total)}
                                                {tx.remaining_balance > 0 && (
                                                    <div className="text-[10px] font-black text-orange-600 uppercase">Sisa: {formatCurrency(tx.remaining_balance)}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center w-[10%]">
                                                <Badge className={cn(
                                                    "font-black text-[10px] uppercase h-5",
                                                    tx.status === 'completed'
                                                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 shadow-none"
                                                        : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 shadow-none"
                                                )}>
                                                    {tx.status === 'completed' ? 'Selesai' : 'Void'}
                                                </Badge>
                                                {tx.payment_status && tx.payment_status !== 'lunas' && (
                                                    <div className="mt-1">
                                                        <PaymentStatusBadge status={tx.payment_status} />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right w-[10%]">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8 text-primary-600", printingId === tx.id && "animate-pulse")}
                                                        onClick={(e) => handlePrintFromTable(e, tx)}
                                                        disabled={printingId === tx.id}
                                                    >
                                                        {printingId === tx.id ? (
                                                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Printer className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    {hasRole('admin', 'supervisor') && tx.status === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={(e) => handleVoidFromTable(e, tx)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-transparent">
                <div className="text-sm font-bold text-gray-500">
                    Memperlihatkan <span className="text-gray-900 dark:text-gray-100">{Math.min(transactions.length, pageSize)}</span> dari <span className="text-gray-900 dark:text-gray-100">{totalTransactions}</span> transaksi
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-10 w-10 border-none bg-gray-50 dark:bg-gray-900"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {(() => {
                            const totalPages = Math.ceil(totalTransactions / pageSize);
                            if (totalPages <= 1) return null;

                            const pages = [];
                            let startPage = Math.max(1, page - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            if (endPage - startPage < 2) startPage = Math.max(1, endPage - 2);

                            for (let i = startPage; i <= endPage; i++) {
                                if (i > 0 && i <= totalPages) pages.push(i);
                            }

                            return pages.map(pageNum => (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPage(pageNum)}
                                    className={cn("h-10 w-10 font-black", page === pageNum && "shadow-lg shadow-primary-600/20 bg-primary-600 text-white")}
                                >
                                    {pageNum}
                                </Button>
                            ));
                        })()}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => Math.min(Math.ceil(totalTransactions / pageSize), p + 1))}
                        disabled={page >= Math.ceil(totalTransactions / pageSize) || totalTransactions === 0}
                        className="h-10 w-10 border-none bg-gray-50 dark:bg-gray-900"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Baris:</span>
                    <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setPage(1); }}>
                        <SelectTrigger className="w-20 h-10 font-bold border-none bg-gray-50 dark:bg-gray-900 shadow-inner">
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

            <Dialog open={showDetail} onOpenChange={handleCloseDetail}>
                <DialogContent className="sm:max-w-2xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-gray-950">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>Memuat atau menampilkan detail transaksi penjualan</DialogDescription>
                    </DialogHeader>
                    {isLoadingDetail ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-4">
                            <div className="w-10 h-10 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-500">Memuat detail transaksi...</p>
                        </div>
                    ) : detailError ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6">
                            <div className="alert-adaptive-error flex-col p-8 items-center text-center max-w-sm">
                                <AlertCircle className="w-12 h-12 mb-2" />
                                <p className="text-lg">{(detailError as any)?.message || 'Gagal memuat detail'}</p>
                                <Button onClick={handleCloseDetail} variant="outline" className="h-10 px-8 font-bold mt-4 bg-white dark:bg-gray-800">Tutup</Button>
                            </div>
                        </div>
                    ) : !selectedTx ? null : (
                        <>
                            <DialogHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800 shrink-0">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-2xl font-black text-gray-900 dark:text-gray-100">Detail Transaksi</DialogTitle>
                                        <DialogDescription className="font-sans text-primary-700 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded-md inline-block">
                                            {selectedTx.invoice_number}
                                        </DialogDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <Badge className={cn(
                                            "font-black text-xs uppercase px-3 h-7",
                                            selectedTx.status === 'completed' ? "bg-green-600 text-white" : "bg-red-600 text-white"
                                        )}>
                                            {selectedTx.status === 'completed' ? 'Selesai' : 'Void'}
                                        </Badge>
                                        {selectedTx.payment_status && (
                                            <PaymentStatusBadge status={selectedTx.payment_status} />
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-950">
                                <div className="p-6 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoItem icon={Calendar} label="Waktu" value={formatDateTime(selectedTx.created_at)} />
                                                <InfoItem icon={User} label="Kasir" value={selectedTx.cashier_name || '-'} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoItem
                                                    icon={paymentMethodConfig[selectedTx.payment_method]?.icon || Wallet}
                                                    label="Metode"
                                                    value={paymentLabel(selectedTx.payment_method)}
                                                />
                                                {selectedTx.due_date && (
                                                    <InfoItem icon={Clock} label="Jatuh Tempo" value={new Date(selectedTx.due_date).toLocaleDateString('id-ID')} className="text-orange-600" />
                                                )}
                                            </div>
                                        </div>

                                        {(selectedTx.customer_name || selectedTx.customer_address) && (
                                            <div className="alert-adaptive-info flex-col items-start p-4 gap-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                                    <User className="w-3 h-3" /> Info Pembeli
                                                </label>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{selectedTx.customer_name || 'Pembeli Anonim'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selectedTx.customer_address || '-'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Daftar Item</label>
                                        <div className="border dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                                            <Table className="text-sm">
                                                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                                    <TableRow className="dark:border-gray-800">
                                                        <TableHead className="font-black text-[10px] h-10">PRODUK</TableHead>
                                                        <TableHead className="text-center font-black text-[10px] h-10">QTY</TableHead>
                                                        <TableHead className="text-right font-black text-[10px] h-10">HARGA</TableHead>
                                                        <TableHead className="text-right font-black text-[10px] h-10">SUBTOTAL</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="divide-y dark:divide-gray-800">
                                                    {selectedTx.items?.map((item: any, i: number) => (
                                                        <TableRow key={i} className="dark:border-gray-800 hover:bg-transparent">
                                                            <TableCell>
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">{item.product_name}</div>
                                                                {item.discount > 0 && (
                                                                    <div className="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase px-1.5 bg-orange-50 dark:bg-orange-950/30 inline-block rounded mt-1">
                                                                        Disc: -{formatCurrency(item.discount)}/item
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center font-black text-gray-500 dark:text-gray-400">{item.quantity}</TableCell>
                                                            <TableCell className="text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.price)}</TableCell>
                                                            <TableCell className="text-right font-black text-gray-900 dark:text-gray-100">{formatCurrency(item.subtotal)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            {selectedTx.payment_history && selectedTx.payment_history.length > 0 && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Riwayat Cicilan</label>
                                                    <div className="max-h-40 overflow-y-auto border dark:border-gray-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/50">
                                                        <div className="space-y-4">
                                                            {selectedTx.payment_history.map((ph: any, i: number) => (
                                                                <div key={i} className="flex justify-between items-start gap-3">
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                                                                            {new Date(ph.payment_date).toLocaleDateString('id-ID')}
                                                                        </p>
                                                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{paymentLabel(ph.payment_method)}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-black text-green-600 dark:text-green-400">{formatCurrency(ph.amount)}</p>
                                                                        <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 italic">{ph.notes || '-'}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedTx.payment_notes && (
                                                <Card className="bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/30 shadow-none">
                                                    <CardContent className="p-4 space-y-1">
                                                        <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Catatan</label>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{selectedTx.payment_notes}</p>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>

                                        <div className="bg-gray-50/80 dark:bg-gray-900/80 rounded-3xl p-6 space-y-4 border border-gray-100 dark:border-gray-800">
                                            <div className="space-y-2">
                                                <TotalRow label="Subtotal" value={formatCurrency(selectedTx.subtotal)} />
                                                {selectedTx.tax_amount > 0 && (
                                                    <TotalRow label="Pajak" value={formatCurrency(selectedTx.tax_amount)} />
                                                )}
                                                {selectedTx.discount_amount > 0 && (
                                                    <TotalRow label="Diskon Total" value={`-${formatCurrency(selectedTx.discount_amount)}`} color="text-orange-500 dark:text-orange-400" />
                                                )}
                                            </div>
                                            <Separator className="bg-gray-200 dark:bg-gray-800" />
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-base font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">TOTAL</span>
                                                <span className={cn(
                                                    "text-3xl font-black tracking-tight",
                                                    selectedTx.status === 'voided' ? "text-red-400 line-through" : "text-gray-900 dark:text-gray-100"
                                                )}>
                                                    {formatCurrency(selectedTx.total)}
                                                </span>
                                            </div>
                                            <Separator className="bg-gray-200 dark:bg-gray-800" />
                                            <div className="space-y-2 pt-2">
                                                <TotalRow label="Terbayar" value={formatCurrency(selectedTx.total_paid || selectedTx.amount_paid)} color="text-green-600 dark:text-green-400" />
                                                {selectedTx.remaining_balance > 0 && (
                                                    <TotalRow label="Sisa Tagihan" value={formatCurrency(selectedTx.remaining_balance)} color="text-orange-600 dark:text-orange-400" />
                                                )}
                                                {selectedTx.change_amount > 0 && selectedTx.payment_status === 'lunas' && (
                                                    <TotalRow label="Kembali" value={formatCurrency(selectedTx.change_amount)} color="text-blue-600 dark:text-blue-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-4"></div> {/* Spacer */}
                                </div>
                            </div>

                            <DialogFooter className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800 flex items-center justify-between gap-4 shrink-0">
                                <div className="flex gap-2 mr-auto">
                                    {hasRole('admin', 'supervisor') && selectedTx.status === 'completed' && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleVoid(selectedTx)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Void Transaksi
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {selectedTx.status === 'completed' && selectedTx.remaining_balance > 0 && hasRole('admin', 'supervisor', 'cashier') && (
                                        <Button onClick={handleAddPaymentClick} className="bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 h-11 px-6 shadow-lg shadow-orange-600/20">
                                            <Plus className="w-5 h-5" /> Cicilan Baru
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={handleCloseDetail} className="h-11 px-6 font-bold dark:border-gray-800">Tutup</Button>
                                    <Button onClick={handlePrintFromDetail} className="h-11 px-6 font-bold gap-2 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20">
                                        <Printer className="w-5 h-5" /> Cetak Struk
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {
                showReceipt && selectedTx && (
                    <ReceiptPreview transaction={selectedTx as any} onClose={() => setShowReceipt(false)} />
                )
            }

            {
                showAddPayment && selectedTx && (
                    <AddPaymentModal
                        transaction={selectedTx}
                        onClose={() => setShowAddPayment(false)}
                        onPaymentAdded={handlePaymentAdded}
                    />
                )
            }
        </div >
    );
});

function InfoItem({ icon: Icon, label, value, className }: any) {
    return (
        <div className={cn("space-y-1", className)}>
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                <Icon className="w-3 h-3" /> {label}
            </label>
            <p className="text-[13px] font-black text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}

function TotalRow({ label, value, color = "text-gray-900" }: any) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter text-xs">{label}</span>
            <span className={cn("font-black", color)}>{value}</span>
        </div>
    );
}
