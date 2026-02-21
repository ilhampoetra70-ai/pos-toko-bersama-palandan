import { useState, useRef } from 'react';
import { formatCurrency, formatNumber } from '../../utils/format';
import SalesTrendChart from '../charts/SalesTrendChart';
import TopProductsChart from '../charts/TopProductsChart';
import PaymentPieChart from '../charts/PaymentPieChart';
import HourlySalesChart from '../charts/HourlySalesChart';
import ProfitMarginChart from '../charts/ProfitMarginChart';
import { ChevronUp, ChevronDown, LayoutDashboard, TrendingUp, Package, CreditCard, History, Calculator, ClipboardList, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
}

function CollapsibleSection({ id, title, icon: Icon, children }: CollapsibleSectionProps) {
    const [open, setOpen] = useState(true);
    return (
        <Card id={id} className="border-none shadow-sm bg-white dark:bg-gray-950 rounded-[2.5rem] overflow-hidden transition-all duration-300">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-8 text-left group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg uppercase tracking-tight text-gray-900 dark:text-gray-100">{title}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            {open && (
                <CardContent className="px-8 pb-8 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="pt-4 border-t dark:border-gray-900">
                        {children}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

interface MiniCardProps {
    label: string;
    value: string | number;
    sub?: string;
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

function MiniCard({ label, value, sub, color = 'blue' }: MiniCardProps) {
    const colors = {
        blue: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400',
        green: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400',
        orange: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400',
        purple: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400',
        red: 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400',
    };
    return (
        <div className={cn("rounded-3xl border p-6 flex flex-col justify-between transition-all hover:scale-[1.02]", colors[color])}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">{label}</div>
            <div className="space-y-1">
                <div className="text-xl font-black truncate">{value}</div>
                {sub && <div className="text-[9px] font-bold uppercase tracking-tight opacity-50">{sub}</div>}
            </div>
        </div>
    );
}

interface ComprehensiveReportProps {
    data: any;
    stockAuditData?: any[];
    stockTrailData?: any[];
}

export default function ComprehensiveReport({ data, stockAuditData, stockTrailData }: ComprehensiveReportProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    if (!data) return null;

    const { sales, profit, hourly, bottomProducts, transactionLog } = data;

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const peakHour = [...hourly].sort((a, b) => b.total - a.total)[0];
    const topProduct = sales.topProducts[0];

    const navItems = [
        { id: 'sec-summary', label: 'Ringkasan', icon: LayoutDashboard },
        { id: 'sec-trend', label: 'Tren', icon: TrendingUp },
        { id: 'sec-products', label: 'Produk', icon: Package },
        { id: 'sec-payment', label: 'Pembayaran', icon: CreditCard },
        { id: 'sec-txlog', label: 'Transaksi', icon: History },
        { id: 'sec-profit', label: 'Laba', icon: Calculator },
        ...(stockAuditData && stockAuditData.length > 0 ? [{ id: 'sec-stockaudit', label: 'Stok Opname', icon: ClipboardList }] : []),
        ...(stockTrailData && stockTrailData.length > 0 ? [{ id: 'sec-stocktrail', label: 'Log Mutasi', icon: Database }] : []),
    ];

    return (
        <div ref={containerRef} className="space-y-8 pb-20">
            {/* Quick navigation */}
            <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md py-4 -mx-4 px-4 border-b dark:border-gray-900">
                <div className="flex flex-wrap gap-2">
                    {navItems.map(n => (
                        <button key={n.id} onClick={() => scrollTo(n.id)}
                            className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-900 border dark:border-gray-800 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 hover:border-primary-600 transition-all rounded-full border-gray-100 shadow-sm flex items-center gap-2 group">
                            <n.icon className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                            {n.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Executive summary */}
            <CollapsibleSection id="sec-summary" title="Ringkasan Eksekutif" icon={LayoutDashboard}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MiniCard label="Total Pendapatan" value={formatCurrency(sales.summary.revenue)} color="blue" />
                    <MiniCard label="Jumlah Transaksi" value={formatNumber(sales.summary.count)} sub="transaksi terdaftar" color="green" />
                    <MiniCard label="Rerata Per Transaksi" value={formatCurrency(sales.summary.average)} color="purple" />
                    <MiniCard label="Laba Kotor" value={formatCurrency(profit.totals.profit)} color="green" />
                    <MiniCard label="Margin Laba Rerata" value={`${profit.totals.margin.toFixed(1)}%`} color="orange" />
                    <MiniCard label="Total Modal Dasar" value={formatCurrency(profit.totals.cost)} color="red" />
                    <MiniCard label="Produk Terlaris" value={topProduct?.product_name || '-'}
                        sub={topProduct ? `${formatNumber(topProduct.qty)} unit terjual` : ''} color="blue" />
                    <MiniCard label="Jam Puncak Sales" value={peakHour && peakHour.total > 0 ? `${String(peakHour.hour).padStart(2, '0')}:00` : '-'}
                        sub={peakHour && peakHour.total > 0 ? formatCurrency(peakHour.total) : ''} color="purple" />
                </div>
            </CollapsibleSection>

            {/* Sales trend */}
            <CollapsibleSection id="sec-trend" title="Visualisasi Tren" icon={TrendingUp}>
                <div className="space-y-6">
                    <SalesTrendChart data={sales.dailyBreakdown} />
                    <HourlySalesChart data={hourly} />
                </div>
            </CollapsibleSection>

            {/* Product performance */}
            <CollapsibleSection id="sec-products" title="Performa Produk Detail" icon={Package}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Top 5 Produk Terlaris
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <th className="text-left py-4 px-2">#</th>
                                    <th className="text-left py-4">Nama Produk</th>
                                    <th className="text-center py-4">Qty</th>
                                    <th className="text-right py-4 px-2">Subtotal</th>
                                </tr></thead>
                                <tbody>
                                    {sales.topProducts.slice(0, 5).map((p: any, i: number) => (
                                        <tr key={p.product_name} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-black/20 transition-colors">
                                            <td className="py-4 px-2 text-gray-400 font-bold">{i + 1}</td>
                                            <td className="py-4 font-bold text-gray-700 dark:text-gray-300">{p.product_name}</td>
                                            <td className="py-4 text-center">
                                                <Badge variant="secondary" className="font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-none">{formatNumber(p.qty)}</Badge>
                                            </td>
                                            <td className="py-4 text-right font-black text-gray-900 dark:text-gray-100 px-2">{formatCurrency(p.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Bottom 5 Produk Terendah
                        </h4>
                        {bottomProducts.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada data terdeteksi</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="text-left py-4 px-2">#</th>
                                        <th className="text-left py-4">Nama Produk</th>
                                        <th className="text-center py-4">Qty</th>
                                        <th className="text-right py-4 px-2">Subtotal</th>
                                    </tr></thead>
                                    <tbody>
                                        {bottomProducts.map((p: any, i: number) => (
                                            <tr key={p.product_name} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-black/20 transition-colors">
                                                <td className="py-4 px-2 text-gray-400 font-bold">{i + 1}</td>
                                                <td className="py-4 font-bold text-gray-700 dark:text-gray-300">{p.product_name}</td>
                                                <td className="py-4 text-center">
                                                    <Badge variant="secondary" className="font-black bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-none">{formatNumber(p.qty)}</Badge>
                                                </td>
                                                <td className="py-4 text-right font-black text-gray-900 dark:text-gray-100 px-2">{formatCurrency(p.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <TopProductsChart data={sales.topProducts} profitData={profit.products} />
            </CollapsibleSection>

            {/* Payment methods */}
            <CollapsibleSection id="sec-payment" title="Analisis Pembayaran" icon={CreditCard}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <PaymentPieChart data={sales.paymentBreakdown} />
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="text-left py-4 px-2">Metode</th>
                                <th className="text-center py-4">Vol</th>
                                <th className="text-right py-4">Nilai Total</th>
                                <th className="text-right py-4 px-2">%</th>
                            </tr></thead>
                            <tbody>
                                {sales.paymentBreakdown.map((p: any) => {
                                    const pct = sales.summary.revenue > 0 ? ((p.total / sales.summary.revenue) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={p.payment_method} className="border-b border-gray-100/50 dark:border-gray-800/50">
                                            <td className="py-4 px-2 font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                                                {p.payment_method === 'cash' ? 'Tunai' : p.payment_method}
                                            </td>
                                            <td className="py-4 text-center font-bold text-gray-500">{p.count} tx</td>
                                            <td className="py-4 text-right font-black text-gray-900 dark:text-gray-100">{formatCurrency(p.total)}</td>
                                            <td className="py-4 text-right px-2">
                                                <span className="text-[10px] font-black text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-2 py-1 rounded-lg">{pct}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Transaction log */}
            <CollapsibleSection id="sec-txlog" title="Log Transaksi Terakhir" icon={History}>
                {transactionLog.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <History className="w-12 h-12 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">Tidak ada riwayat transaksi</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="text-left py-4 px-4">Nomor Invoice</th>
                                <th className="text-left py-4">Waktu</th>
                                <th className="text-left py-4 max-w-[250px]">Produk & Qty</th>
                                <th className="text-right py-4">Total</th>
                                <th className="text-center py-4">Bayar</th>
                                <th className="text-left py-4 px-4 font-center">Oleh</th>
                            </tr></thead>
                            <tbody>
                                {transactionLog.slice(0, 100).map((tx: any) => (
                                    <tr key={tx.id} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="py-4 px-4 font-mono text-[10px] font-bold text-primary-600">{tx.invoice_number}</td>
                                        <td className="py-4 text-[10px] text-gray-500 font-medium">{tx.created_at?.slice(0, 19).replace('T', ' ')}</td>
                                        <td className="py-4 text-[10px] leading-relaxed max-w-[250px] truncate" title={tx.items?.map((it: any) => `${it.product_name} x${it.quantity}`).join(', ')}>
                                            {tx.items?.map((it: any) => `${it.product_name} x${it.quantity}`).join(', ')}
                                        </td>
                                        <td className="py-4 text-right font-black text-gray-900 dark:text-gray-100">{formatCurrency(tx.total || 0)}</td>
                                        <td className="py-4 text-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">
                                                {tx.payment_method === 'cash' ? 'Tunai' : (tx.payment_method || '-')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-500 font-bold">{tx.cashier_name || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactionLog.length > 100 && (
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Hanya menampilkan 100 dari total {transactionLog.length} transaksi dalam periode ini
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CollapsibleSection>

            {/* Profit detail */}
            <CollapsibleSection id="sec-profit" title="Kalkulasi Laba & Margin" icon={Calculator}>
                <ProfitMarginChart data={profit.products} />
                <div className="mt-8 overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                    <table className="w-full text-xs">
                        <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <th className="text-left py-4 px-2">Nama Barang</th>
                            <th className="text-center py-4">Laku</th>
                            <th className="text-right py-4">Revenue</th>
                            <th className="text-right py-4">Cost Basis</th>
                            <th className="text-right py-4 text-emerald-600 border-l dark:border-gray-800">Laba Bersih</th>
                            <th className="text-right py-4 px-2">Margin</th>
                        </tr></thead>
                        <tbody>
                            {profit.products.map((p: any) => {
                                const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
                                return (
                                    <tr key={p.product_name} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-black/20 transition-all">
                                        <td className="py-4 px-2 font-bold text-gray-700 dark:text-gray-300">{p.product_name}</td>
                                        <td className="py-4 text-center font-bold text-gray-500">{formatNumber(p.qty)}</td>
                                        <td className="py-4 text-right font-bold">{formatCurrency(p.revenue)}</td>
                                        <td className="py-4 text-right font-medium text-gray-400">{formatCurrency(p.total_cost)}</td>
                                        <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 border-l dark:border-gray-800">{formatCurrency(p.profit)}</td>
                                        <td className="py-4 text-right px-2">
                                            <span className="font-black text-[10px]">{margin}%</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-black/20 font-black">
                            <tr className="uppercase tracking-widest text-[10px]">
                                <td className="py-6 px-4 rounded-l-2xl">Total Akumulatif</td>
                                <td></td>
                                <td className="py-6 text-right">{formatCurrency(profit.totals.revenue)}</td>
                                <td className="py-6 text-right text-gray-500">{formatCurrency(profit.totals.cost)}</td>
                                <td className="py-6 text-right text-emerald-600 border-l dark:border-gray-800 px-2">{formatCurrency(profit.totals.profit)}</td>
                                <td className="py-6 text-right rounded-r-2xl px-4">{profit.totals.margin.toFixed(1)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Stock audit log */}
            {stockAuditData && stockAuditData.length > 0 && (
                <CollapsibleSection id="sec-stockaudit" title="Audit Stok Manual" icon={ClipboardList}>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-6 rounded-[2rem] mb-6 flex items-start gap-4">
                        <ClipboardList className="w-6 h-6 text-amber-600 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-widest">
                            Data di bawah mencatat perubahan stok yang dilakukan secara manual melalui halaman Edit Produk atau Stok Opname. Perubahan otomatis dari hasil penjualan tidak dicantumkan di sini.
                        </p>
                    </div>
                    <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="text-left py-4 px-2">Produk</th>
                                <th className="text-center py-4">Frk. Edit</th>
                                <th className="text-right py-4">Total Selisih</th>
                                <th className="text-left py-4 px-4">Operator/User</th>
                            </tr></thead>
                            <tbody>
                                {stockAuditData.map((log: any) => (
                                    <tr key={log.product_id} className="border-b border-gray-100/50 dark:border-gray-800/50">
                                        <td className="py-4 px-2 font-bold text-gray-700 dark:text-gray-300">{log.product_name}</td>
                                        <td className="py-4 text-center font-bold text-gray-500">{formatNumber(log.change_count)}x</td>
                                        <td className={cn(
                                            "py-4 text-right font-black",
                                            log.total_change > 0 ? 'text-emerald-600' : log.total_change < 0 ? 'text-red-600' : 'text-gray-500'
                                        )}>
                                            {log.total_change > 0 ? '+' : ''}{formatNumber(log.total_change)}
                                        </td>
                                        <td className="py-4 px-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">{log.user_names || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}

            {/* Stock trail log */}
            {stockTrailData && stockTrailData.length > 0 && (
                <CollapsibleSection id="sec-stocktrail" title="Audit Mutasi Stok Detail" icon={Database}>
                    <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 border dark:border-gray-800">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="text-left py-4 px-2">Timestamp</th>
                                <th className="text-left py-4">Produk</th>
                                <th className="text-center py-4">Event</th>
                                <th className="text-right py-4">Before &rsaquo; After</th>
                                <th className="text-right py-4">Delta</th>
                                <th className="text-left py-4 px-4 font-center">Operator</th>
                            </tr></thead>
                            <tbody>
                                {stockTrailData.map((t: any) => (
                                    <tr key={t.id} className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-black/20 transition-all">
                                        <td className="py-4 px-2 text-[10px] text-gray-400 font-medium">{t.created_at?.slice(0, 19).replace('T', ' ')}</td>
                                        <td className="py-4 font-black text-gray-800 dark:text-gray-200">{t.product_name}</td>
                                        <td className="py-4 text-center">
                                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-2 py-0.5">
                                                {t.event_type}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-right text-gray-400 font-bold">
                                            {t.quantity_before} <span className="mx-1 text-gray-300">&rsaquo;</span> <span className="text-gray-900 dark:text-gray-100 font-black">{t.quantity_after}</span>
                                        </td>
                                        <td className={cn(
                                            "py-4 text-right font-black",
                                            t.quantity_change > 0 ? 'text-emerald-500' : 'text-red-500'
                                        )}>
                                            {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                                        </td>
                                        <td className="py-4 px-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.user_name || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}
        </div>
    );
}
