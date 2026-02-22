import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import AddPaymentModal from '../components/AddPaymentModal';
import { useOutstandingDebts, useDebtSummary } from '@/lib/queries';
import {
    CreditCard,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    AlertCircle,
    Layout,
    RefreshCw,
    MoreVertical,
    ArrowUpRight,
    TrendingUp,
    Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';

const PAYMENT_STATUS_CONFIG: Record<string, { label: string, color: string, borderColor: string }> = {
    pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
    hutang: { label: 'Hutang', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800' },
    cicilan: { label: 'Cicilan', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-800' },
};

function PaymentStatusBadge({ status }: { status: string }) {
    const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
    return (
        <Badge variant="secondary" className={cn("font-bold shadow-none text-[10px] uppercase", config.color)}>
            {config.label}
        </Badge>
    );
}

export default function DebtManagementPage() {
    const [filters, setFilters] = useState({ payment_status: '', customer_search: '', overdue_only: false });
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set<number>());

    // Queries
    const { data: debts = [], isLoading: isLoadingDebts, refetch: refetchDebts } = useOutstandingDebts(filters);
    const { data: summary, isLoading: isLoadingSummary } = useDebtSummary();

    const loading = isLoadingDebts || isLoadingSummary;

    const handleFilter = () => {
        refetchDebts();
    };

    const handleRowClick = (txId: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(txId)) newSet.delete(txId);
            else newSet.add(txId);
            return newSet;
        });
    };

    const handleAddPayment = async (tx: any) => {
        // Load fresh transaction data
        const detail = await window.api.getTransactionById(tx.id);
        setSelectedTx(detail);
        setShowAddPayment(true);
    };

    const handlePaymentAdded = () => {
        setShowAddPayment(false);
        setSelectedTx(null);
        refetchDebts();
    };

    const getDaysOverdue = (dueDate: string) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : null;
    };

    // Keyboard support for modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showAddPayment) setShowAddPayment(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAddPayment]);

    if (loading && !summary) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold">Menyinkronkan data piutang...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Piutang</h2>
                    <p className="text-sm text-gray-500 font-medium">Manajemen tagihan dan cicilan customer</p>
                </div>
                <Button onClick={() => refetchDebts()} disabled={loading} variant="outline" className="gap-2 h-11 px-6 shadow-sm font-bold">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Data
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Piutang"
                        value={formatCurrency(summary.total_outstanding)}
                        subtitle={`${summary.total_count} transaksi`}
                        icon={CreditCard}
                        color="orange"
                    />
                    <StatCard
                        title="Jatuh Tempo"
                        value={formatCurrency(summary.overdue_total)}
                        subtitle={`${summary.overdue_count} transaksi overdue`}
                        icon={AlertCircle}
                        color="red"
                    />
                    {summary.by_status?.map((s: any) => {
                        const config = PAYMENT_STATUS_CONFIG[s.payment_status] || PAYMENT_STATUS_CONFIG.pending;
                        return (
                            <Card key={s.payment_status} className={cn("border-none shadow-sm", config.borderColor)}>
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="space-y-1">
                                        <PaymentStatusBadge status={s.payment_status} />
                                        <div className="text-xl font-black text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(s.total)}</div>
                                        <div className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{s.count} TRANSAKSI</div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-end gap-6">
                        <div className="space-y-1.5 flex-1 min-w-[250px]">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cari Pembeli</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <Input
                                    placeholder="Nama atau alamat..."
                                    value={filters.customer_search}
                                    onChange={e => setFilters(f => ({ ...f, customer_search: e.target.value }))}
                                    className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-100 border-none shadow-inner font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 w-48">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Pembayaran</label>
                            <Select value={filters.payment_status || 'all'} onValueChange={v => setFilters(f => ({ ...f, payment_status: v === 'all' ? '' : v }))}>
                                <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-100 border-none shadow-inner font-bold">
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="hutang">Hutang</SelectItem>
                                    <SelectItem value="cicilan">Cicilan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-3 h-11 px-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                            <Checkbox
                                id="overdue_only"
                                checked={filters.overdue_only}
                                onCheckedChange={(checked) => setFilters(f => ({ ...f, overdue_only: !!checked }))}
                            />
                            <label htmlFor="overdue_only" className="text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer">Jatuh tempo saja</label>
                        </div>

                        <Button onClick={handleFilter} disabled={loading} size="lg" className="h-11 px-8 font-black bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 shadow-lg">
                            Tampilkan Piutang
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30 dark:bg-gray-800/20 border-b dark:border-gray-800">
                                <TableHead className="font-black text-[10px] uppercase dark:text-gray-400 pl-6 h-14">CUSTOMER / INVOICE</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">TOTAL</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">TERBAYAR</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">SISA</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase dark:text-gray-400">JATUH TEMPO</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase dark:text-gray-400">STATUS</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400 pr-6">AKSI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            {debts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-gray-400">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Layout className="w-16 h-16" />
                                            <p className="text-lg font-bold">Tidak ada piutang yang ditemukan</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : debts.map((tx: any) => {
                                const daysOverdue = getDaysOverdue(tx.due_date);
                                const isExpanded = expandedRows.has(tx.id);

                                return (
                                    <TableRow
                                        key={tx.id}
                                        className={cn(
                                            "group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all border-gray-100 dark:border-gray-800 h-20",
                                            daysOverdue ? "bg-red-50/20 dark:bg-red-950/10" : ""
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 dark:text-gray-100">{tx.customer_name || '-'}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold text-primary-600 font-mono tracking-wider">{tx.invoice_number}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{formatDateTime(tx.created_at)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-gray-500">{formatCurrency(tx.total)}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">{formatCurrency(tx.total_paid)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-black text-orange-600 text-lg">{formatCurrency(tx.remaining_balance)}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {tx.due_date ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={cn("text-xs font-black", daysOverdue ? "text-red-600" : "text-gray-600 dark:text-gray-400")}>
                                                        {new Date(tx.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    {daysOverdue && (
                                                        <Badge variant="destructive" className="text-[9px] font-black h-5 py-0">
                                                            <Clock className="w-3 h-3 mr-1" /> {daysOverdue} HARI LEWAT
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : <span className="text-gray-300">-</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <PaymentStatusBadge status={tx.payment_status} />
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                onClick={() => handleAddPayment(tx)}
                                                variant="default"
                                                size="sm"
                                                className="h-9 px-5 bg-primary-600 hover:bg-primary-700 font-black shadow-md shadow-primary-600/20 gap-2"
                                            >
                                                <ArrowUpRight className="w-4 h-4" /> Bayar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Totals Summary Footer */}
            {debts.length > 0 && (
                <div className="flex justify-end pt-2">
                    <Card className="border-none shadow-lg bg-gray-900 text-white p-1 rounded-2xl">
                        <CardContent className="p-4 px-8 flex items-center gap-12">
                            <TotalItem label="Total Tagihan" value={debts.reduce((sum: number, d: any) => sum + d.total, 0)} color="white" />
                            <TotalItem label="Total Terbayar" value={debts.reduce((sum: number, d: any) => sum + d.total_paid, 0)} color="emerald" />
                            <TotalItem label="Total Sisa" value={debts.reduce((sum: number, d: any) => sum + d.remaining_balance, 0)} color="orange" />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Payment Modal */}
            {showAddPayment && selectedTx && (
                <AddPaymentModal
                    transaction={selectedTx}
                    onClose={() => setShowAddPayment(false)}
                    onPaymentAdded={handlePaymentAdded}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-blue-500 shadow-blue-500/20",
        green: "bg-green-500 shadow-green-500/20",
        orange: "bg-orange-500 shadow-orange-500/20",
        purple: "bg-purple-500 shadow-purple-500/20",
        red: "bg-red-500 shadow-red-500/20"
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
                    {subtitle && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function TotalItem({ label, value, color }: { label: string, value: number, color: 'white' | 'emerald' | 'orange' }) {
    const colorClasses = {
        white: "text-white",
        emerald: "text-emerald-400",
        orange: "text-orange-400"
    };

    return (
        <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</span>
            <span className={cn("text-xl font-black tabular-nums", colorClasses[color])}>{formatCurrency(value)}</span>
        </div>
    );
}
