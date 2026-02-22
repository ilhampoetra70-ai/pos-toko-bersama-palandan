import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useSlowMovingProducts, useLowStockProducts } from '@/lib/queries';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import {
    TrendingUp,
    ShoppingCart,
    DollarSign,
    BarChart3,
    Calendar,
    ChevronRight,
    Plus,
    Settings,
    AlertTriangle,
    FileText,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Package,
    CheckCircle2,
    Database,
    History,
    Timer,
    Wallet,
    QrCode,
    Loader2,
    CreditCard,
    ShoppingBag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { hasRole, user } = useAuth();
    const navigate = useNavigate();
    const [chartPeriod, setChartPeriod] = useState(7);

    const { data: stats, isLoading } = useDashboardStats();

    if (isLoading || !stats) return <LoadingState />;

    // Dedicated cashier view — no whitespace, focused on what matters
    if (!hasRole('admin', 'supervisor')) {
        return <CashierDashboard stats={stats} user={user} navigate={navigate} />;
    }

    const chartData = chartPeriod === 7 ? stats.last_7_days : stats.last_30_days;

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <DashboardHeader />
            <KPICardsSection stats={stats} hasRole={hasRole} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SalesChartSection
                    chartData={chartData}
                    chartPeriod={chartPeriod}
                    setChartPeriod={setChartPeriod}
                    stats={stats}
                />
                <QuickActionsSection hasRole={hasRole} navigate={navigate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TopProductsSection topProducts={stats.top_products_today} navigate={navigate} />
                <AlertsSection stats={stats} navigate={navigate} />
            </div>

            <SlowMovingDashboardSection navigate={navigate} />
            <RecentTransactionsSection transactions={stats.recent_transactions} navigate={navigate} />
        </div>
    );
}

// ── Cashier-specific dashboard ────────────────────────────────────────────────
function CashierDashboard({ stats, user, navigate }: { stats: any; user: any; navigate: any }) {
    const [chartPeriod, setChartPeriod] = useState(7);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    const hour = now.getHours();
    const shift = hour < 12 ? 'Shift Pagi' : hour < 17 ? 'Shift Siang' : 'Shift Sore';
    const todayStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const salesGrowth = stats.yesterday_sales_total > 0
        ? ((stats.today_sales_total - stats.yesterday_sales_total) / stats.yesterday_sales_total * 100)
        : stats.today_sales_total > 0 ? 100 : 0;

    const avgTransaction = stats.today_sales_count > 0
        ? Math.round(stats.today_sales_total / stats.today_sales_count)
        : 0;

    const chartData = chartPeriod === 7 ? stats.last_7_days : stats.last_30_days;

    const methodMap: Record<string, { label: string; color: string }> = {
        cash: { label: 'Tunai', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        debit: { label: 'Debit', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        qris: { label: 'QRIS', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        transfer: { label: 'Transfer', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    };

    const maxQty = stats.top_products_today?.length > 0
        ? Math.max(...stats.top_products_today.map((p: any) => p.qty))
        : 1;

    const rankStyle = [
        'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-900/30',
        'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        'bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
    ];
    const barColor = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400'];

    return (
        <div className="space-y-5 max-w-6xl mx-auto">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Dashboard Kasir,{' '}
                        <span className="text-primary-600 dark:text-primary-400">{user?.name || 'Kasir'}</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Ringkasan aktivitas operasional hari ini
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{todayStr}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{shift} · {timeStr} WIB</div>
                </div>
            </div>

            {/* ── Top Row: 4 cols (2 KPI + 2-col CTA) ─────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Penjualan */}
                <Card className="border shadow-sm flex flex-col justify-between h-32 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-default">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Penjualan</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums leading-tight">
                                    {formatCurrency(stats.today_sales_total)}
                                </p>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg shrink-0">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                                "font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5",
                                salesGrowth >= 0
                                    ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            )}>
                                {salesGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                {Math.abs(salesGrowth).toFixed(1)}%
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">vs kemarin</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Transaksi */}
                <Card className="border shadow-sm flex flex-col justify-between h-32 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-default">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaksi</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums leading-tight">
                                    {formatNumber(stats.today_sales_count)}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Rata-rata{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(avgTransaction)}</span>
                        </p>
                    </CardContent>
                </Card>

                {/* CTA — spans 2 cols */}
                <button
                    onClick={() => navigate('/cashier')}
                    className="md:col-span-2 relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all group flex items-center h-32 border-0 cursor-pointer"
                >
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 translate-x-12 pointer-events-none" />
                    <div className="flex-1 p-5 text-white relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm shrink-0">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-white leading-tight">Buka Aplikasi Kasir</h3>
                                <p className="text-gray-300 dark:text-gray-400 text-xs mt-0.5">Mulai transaksi baru</p>
                            </div>
                        </div>
                    </div>
                    <div className="pr-6 relative z-10 shrink-0">
                        <div className="h-8 w-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md border border-transparent dark:border-white/10">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </button>
            </div>

            {/* ── Sales Trend Chart ────────────────────────────────────── */}
            <Card className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4 px-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary-600" />
                        Tren Penjualan
                    </CardTitle>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
                        {[7, 30].map(p => (
                            <Button
                                key={p}
                                variant={chartPeriod === p ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartPeriod(p)}
                                className={cn(
                                    "h-7 text-[10px] font-bold px-2.5",
                                    chartPeriod === p && "bg-white dark:bg-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-700"
                                )}
                            >
                                {p} Hari
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                    <SalesTrendChart data={chartData} hideCard={true} />
                </CardContent>
            </Card>

            {/* ── Bottom: 3-col grid ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left 2 cols: Recent Transactions + Low Stock */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Recent Transactions */}
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Transaksi Terakhir</h3>
                            <Button variant="link" size="sm" onClick={() => navigate('/transactions')} className="h-auto p-0 text-xs font-semibold text-primary-600 hover:text-primary-700">
                                Lihat Semua
                            </Button>
                        </div>
                        {!stats.recent_transactions?.length ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-center">
                                <Timer className="w-10 h-10 text-gray-200 opacity-50" />
                                <p className="text-sm text-gray-400 font-medium">Belum ada transaksi hari ini</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-500 dark:text-gray-500 uppercase font-semibold tracking-wider border-b dark:border-gray-800">
                                        <tr>
                                            <th className="px-5 py-3">Waktu</th>
                                            <th className="px-5 py-3">Invoice</th>
                                            <th className="px-5 py-3 text-center">Metode</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {stats.recent_transactions.slice(0, 7).map((tx: any) => {
                                            const method = methodMap[tx.payment_method] || { label: tx.payment_method, color: 'bg-gray-100 text-gray-700' };
                                            return (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-5 py-3 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                                                        {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{tx.invoice_number}</span>
                                                        {tx.status === 'voided' && (
                                                            <Badge variant="destructive" className="ml-2 text-[9px] h-3.5 px-1">VOID</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <Badge className={cn("text-[10px] font-bold border-0 shadow-none", method.color)}>
                                                            {method.label}
                                                        </Badge>
                                                    </td>
                                                    <td className={cn(
                                                        "px-5 py-3 text-right font-bold text-sm tabular-nums",
                                                        tx.status === 'voided' ? 'text-red-400 line-through' : 'text-gray-900 dark:text-gray-100'
                                                    )}>
                                                        {formatCurrency(tx.total)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Low Stock — only shown when there are items */}
                    {stats.low_stock_count > 0 && (
                        <Card className="border border-red-100 dark:border-red-900/30 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-red-50 dark:border-red-900/20 flex justify-between items-center bg-red-50/40 dark:bg-red-900/10">
                                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    Stok Menipis
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] h-4 px-1.5">
                                        {stats.low_stock_count}
                                    </Badge>
                                </h3>
                                <Button variant="link" size="sm" onClick={() => navigate('/low-stock')} className="h-auto p-0 text-xs font-semibold text-red-600 hover:text-red-700">
                                    Lihat Semua
                                </Button>
                            </div>
                            <LowStockMiniTable />
                        </Card>
                    )}
                </div>

                {/* Right 1 col: Top Products Today */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            Terlaris Hari Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        {!stats.top_products_today?.length ? (
                            <div className="text-center py-10">
                                <Package className="w-10 h-10 mx-auto text-gray-200 opacity-50 mb-2" />
                                <p className="text-sm text-gray-400 font-medium">Belum ada penjualan</p>
                            </div>
                        ) : (
                            stats.top_products_today.slice(0, 7).map((product: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded text-xs font-bold flex items-center justify-center shrink-0",
                                        rankStyle[index] || 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                    )}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                                            {product.product_name}
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                            <div
                                                className={cn("h-1.5 rounded-full", barColor[index] || 'bg-primary-400')}
                                                style={{ width: `${(product.qty / maxQty) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums shrink-0">
                                        {product.qty}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Low stock mini table — separate component so it can call its own hook
function LowStockMiniTable() {
    const { data: products = [], isLoading } = useLowStockProducts(5);

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-red-300" />
            </div>
        );
    }
    if (!products.length) return null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-red-50/50 dark:bg-red-900/10 text-[10px] text-red-700/70 dark:text-red-400/70 uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-5 py-2.5">Produk</th>
                        <th className="px-5 py-2.5 text-center">Sisa Stok</th>
                        <th className="px-5 py-2.5 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {products.slice(0, 4).map((p: any) => (
                        <tr key={p.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                            <td className="px-5 py-2.5">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate max-w-[180px]">
                                    {p.name}
                                </div>
                                <div className="text-[10px] text-gray-400">{p.category_name || '-'}</div>
                            </td>
                            <td className="px-5 py-2.5 text-center">
                                <span className={cn(
                                    "font-bold tabular-nums text-sm",
                                    p.stock <= 2 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                                )}>
                                    {p.stock}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-1">{p.unit}</span>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                                <Badge className={cn(
                                    "text-[9px] font-bold border-0",
                                    p.stock <= 2
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                )}>
                                    {p.stock <= 2 ? 'CRITICAL' : 'LOW'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                <Timer className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary-600" />
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-gray-900 font-bold">Menyiapkan Dashboard</span>
                <span className="text-gray-500 text-sm">Menghitung statistik hari ini...</span>
            </div>
        </div>
    );
}

function DashboardHeader() {
    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-medium">{today}</p>
                </div>
            </div>
        </div>
    );
}

function KPICardsSection({ stats, hasRole }: { stats: any, hasRole: any }) {
    const salesGrowth = stats.yesterday_sales_total > 0
        ? ((stats.today_sales_total - stats.yesterday_sales_total) / stats.yesterday_sales_total * 100)
        : stats.today_sales_total > 0 ? 100 : 0;

    const avgTransaction = stats.today_sales_count > 0
        ? Math.round(stats.today_sales_total / stats.today_sales_count)
        : 0;

    const profitMargin = stats.today_revenue > 0
        ? (stats.today_profit / stats.today_revenue * 100)
        : 0;

    const weeklyGrowth = stats.last_week_total > 0
        ? ((stats.this_week_total - stats.last_week_total) / stats.last_week_total * 100)
        : stats.this_week_total > 0 ? 100 : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <EnhancedStatCard
                title="Penjualan Hari Ini"
                value={formatCurrency(stats.today_sales_total)}
                subtitle={`vs kemarin: ${formatCurrency(stats.yesterday_sales_total)}`}
                comparison={salesGrowth}
                icon={DollarSign}
                variant="blue"
            />
            <EnhancedStatCard
                title="Transaksi Hari Ini"
                value={formatNumber(stats.today_sales_count)}
                subtitle={`Rata-rata: ${formatCurrency(avgTransaction)}`}
                icon={ShoppingCart}
                variant="purple"
            />
            {hasRole('admin', 'supervisor') && (
                <EnhancedStatCard
                    title="Laba Hari Ini"
                    value={formatCurrency(stats.today_profit)}
                    subtitle={`Margin: ${profitMargin.toFixed(1)}%`}
                    icon={TrendingUp}
                    variant="green"
                    progress={profitMargin}
                />
            )}
            <EnhancedStatCard
                title="Minggu Ini"
                value={formatCurrency(stats.this_week_total)}
                subtitle={`vs minggu lalu: ${formatCurrency(stats.last_week_total)}`}
                comparison={weeklyGrowth}
                icon={BarChart3}
                variant="orange"
            />
        </div>
    );
}

function EnhancedStatCard({ title, value, subtitle, comparison, icon: Icon, variant, progress }: any) {
    const variants = {
        blue: "bg-blue-600 border-blue-500/20 dark:border-blue-800",
        purple: "bg-purple-600 border-purple-500/20 dark:border-purple-800",
        green: "bg-green-600 border-green-500/20 dark:border-green-800",
        orange: "bg-orange-600 border-orange-500/20 dark:border-orange-800"
    } as any;

    return (
        <Card className={cn(
            "overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.005] bg-white dark:bg-gray-900",
            variant === 'blue' && "border-blue-100/50 dark:border-blue-900/50",
            variant === 'purple' && "border-purple-100/50 dark:border-purple-900/50",
            variant === 'green' && "border-green-100/50 dark:border-green-900/50",
            variant === 'orange' && "border-orange-100/50 dark:border-orange-900/50"
        )}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2 rounded-lg text-white shadow-md", variants[variant].split(' ')[0])}>
                        <Icon className="w-4 h-4" />
                    </div>
                    {comparison !== undefined && (
                        <Badge variant={comparison >= 0 ? "default" : "destructive"} className="h-5 font-bold shadow-sm px-1.5">
                            {comparison >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
                            {Math.abs(comparison).toFixed(1)}%
                        </Badge>
                    )}
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
                </div>
                {progress !== undefined && (
                    <div className="mt-3">
                        <Progress value={progress} className="h-1" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SalesChartSection({ chartData, chartPeriod, setChartPeriod, stats }: any) {
    const currentPeriodTotal = chartData.reduce((sum: number, d: any) => sum + d.total, 0);
    const halfPoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, halfPoint).reduce((sum: number, d: any) => sum + d.total, 0);
    const secondHalf = chartData.slice(halfPoint).reduce((sum: number, d: any) => sum + d.total, 0);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

    return (
        <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                <div className="space-y-0.5">
                    <CardTitle className="text-lg font-bold">Tren Penjualan</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        Total: <span className="text-gray-900 font-bold">{formatCurrency(currentPeriodTotal)}</span>
                        {trend !== 0 && (
                            <Badge variant={trend >= 0 ? "default" : "destructive"} className="h-5 text-[10px] px-1.5 leading-none">
                                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                {Math.abs(trend).toFixed(1)}%
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {[7, 30].map((p) => (
                        <Button
                            key={p}
                            variant={chartPeriod === p ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setChartPeriod(p)}
                            className={cn("h-7 text-[10px] font-bold px-2.5", chartPeriod === p && "bg-white shadow-sm hover:bg-white")}
                        >
                            {p} Hari
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <SalesTrendChart data={chartData} hideCard={true} />
            </CardContent>
        </Card>
    );
}

function QuickActionsSection({ hasRole, navigate }: any) {
    const actions = [
        { label: 'Buka Kasir', icon: ShoppingCart, path: '/cashier', color: 'bg-primary-600', roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
        { label: 'Tambah Produk', icon: Plus, path: '/products', color: 'bg-green-600', roles: ['admin', 'supervisor'] },
        { label: 'Laporan Penjualan', icon: FileText, path: '/reports', color: 'bg-blue-600', roles: ['admin', 'supervisor'] },
        { label: 'Pengaturan Sistem', icon: Settings, path: '/settings', color: 'bg-gray-600', roles: ['admin'] }
    ];

    const visibleActions = actions.filter(action =>
        action.roles.some(role => hasRole(role))
    );

    return (
        <Card className="border-none shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
                {visibleActions.map((action) => (
                    <Button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        variant="outline"
                        className={cn("w-full justify-start h-12 gap-4 text-sm font-bold shadow-sm hover:shadow-md hover:scale-[1.01] transition-all border-l-4", action.color.replace('bg-', 'border-l-'))}
                    >
                        <action.icon className={cn("w-5 h-5", action.color.replace('bg-', 'text-'))} />
                        {action.label}
                    </Button>
                ))}
            </CardContent>
            <CardFooter className="pt-0 pb-6 flex justify-center text-center">
                <p className="text-[10px] text-gray-400 font-medium italic">Klik tombol untuk akses cepat menu</p>
            </CardFooter>
        </Card>
    );
}

function TopProductsSection({ topProducts, navigate }: any) {
    const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map((p: any) => p.qty)) : 1;

    return (
        <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    Terlaris Hari Ini
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="text-primary-600 font-bold hover:text-primary-700 h-8">
                    Semua <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1">
                {topProducts.length === 0 ? (
                    <div className="text-center py-10 space-y-3 h-full flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 mx-auto text-gray-200 opacity-50" />
                        <p className="text-gray-400 text-sm font-medium">Belum ada penjualan hari ini</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {topProducts.map((product: any, index: number) => {
                            const percentage = (product.qty / maxQty) * 100;
                            const rank = index + 1;

                            let rankStyles = "bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
                            if (rank === 1) rankStyles = "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30";
                            if (rank === 2) rankStyles = "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
                            if (rank === 3) rankStyles = "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30";

                            return (
                                <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all group">
                                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-md border font-bold text-xs shrink-0", rankStyles)}>
                                        #{rank}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate pr-2">{product.product_name}</span>
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{product.qty} terjual</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Progress value={percentage} className="h-1.5 flex-1" />
                                            <span className="text-[10px] font-bold text-gray-500 w-20 text-right tabular-nums">
                                                {formatCurrency(product.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AlertsSection({ stats, navigate }: any) {
    const alerts: any[] = [];

    if (stats.debt_overdue_count > 0) {
        alerts.push({
            type: 'error',
            title: 'Piutang Jatuh Tempo',
            message: `${stats.debt_overdue_count} transaksi (${formatCurrency(stats.debt_overdue_total)})`,
            action: () => navigate('/debts'),
            icon: Clock,
            color: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/20"
        });
    }

    if (stats.debt_total_count > 0 && stats.debt_overdue_count === 0) {
        alerts.push({
            type: 'info',
            title: 'Piutang Belum Lunas',
            message: `${stats.debt_total_count} transaksi (${formatCurrency(stats.debt_total_outstanding)})`,
            action: () => navigate('/debts'),
            icon: DollarSign,
            color: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/20"
        });
    }

    if (stats.low_stock_count > 0) {
        alerts.push({
            type: 'warning',
            title: 'Stok Menipis',
            message: `${stats.low_stock_count} produk perlu restok`,
            action: () => navigate('/low-stock'),
            icon: Package,
            color: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/20"
        });
    }

    const lastBackup = stats.last_backup_date;
    const daysSinceBackup = lastBackup
        ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000)
        : null;

    if (daysSinceBackup === null || daysSinceBackup > 3) {
        alerts.push({
            type: daysSinceBackup === null ? 'error' : 'warning',
            title: 'Backup Diperlukan',
            message: daysSinceBackup === null ? 'Belum pernah backup' : `Backup terakhir ${daysSinceBackup} hari lalu`,
            action: () => navigate('/database'),
            icon: Database,
            color: daysSinceBackup === null ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/20" : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/20"
        });
    }

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Pemberitahuan</CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                        </div>
                        <p className="text-green-600 dark:text-green-400 font-bold">Semua Aman!</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[240px]">
                        <div className="space-y-3 pr-4">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    onClick={alert.action}
                                    className={cn("p-3 rounded-lg border flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors", alert.color)}
                                >
                                    <div className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-md shrink-0">
                                        <alert.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate leading-none mb-1">{alert.title}</p>
                                        <p className="text-xs font-medium opacity-80 truncate">{alert.message}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

function SlowMovingDashboardSection({ navigate }: any) {
    const { data: products = [], isLoading } = useSlowMovingProducts(120, 10);

    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/30 border-b dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <History className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Produk Lambat Jual (120+ Hari)</CardTitle>
                            <CardDescription>Stok tertahan yang jarang terjual</CardDescription>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nilai Tertahan</p>
                        <p className="text-lg font-black text-orange-600 leading-none">{formatCurrency(totalValue)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 flex justify-center text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-200" /></div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-200 dark:text-green-900/50" />
                        <p className="text-green-600 dark:text-green-400 font-bold">Semua produk bergerak lancar!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b dark:border-gray-800">
                                    <th className="py-2 px-4 text-left">Produk</th>
                                    <th className="py-2 px-3 text-center">Stok</th>
                                    <th className="py-2 px-3 text-right">Harga</th>
                                    <th className="py-2 px-4 text-left">Terakhir Terjual</th>
                                    <th className="py-2 px-4 text-center">Tidak Aktif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {products.slice(0, 5).map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-2 px-4">
                                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px]" title={p.name}>{p.name}</p>
                                            <p className="text-[10px] text-gray-400">{p.category_name || '-'}</p>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <Badge variant="outline" className="font-bold text-[10px] h-5">{p.stock} {p.unit}</Badge>
                                        </td>
                                        <td className="py-2 px-3 text-right font-medium text-xs">{formatCurrency(p.price)}</td>
                                        <td className="py-2 px-4 text-gray-500 text-[10px] font-medium">
                                            {p.last_sale_date ? formatDateTime(p.last_sale_date) : 'Belum pernah'}
                                        </td>
                                        <td className="py-2 px-4 text-center">
                                            <Badge variant="destructive" className="h-5 text-[10px] font-black">{p.days_inactive} Hari</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
            <Separator />
            <CardFooter className="py-3 px-6 bg-gray-50/50 dark:bg-gray-800/30 justify-between">
                <p className="text-xs font-medium text-gray-500">{products.length} produk terdeteksi lambat jual</p>
                <Button variant="link" size="sm" onClick={() => navigate('/reports')} className="h-auto p-0 font-bold text-primary-600">
                    Analisis Lengkap →
                </Button>
            </CardFooter>
        </Card>
    );
}

function RecentTransactionsSection({ transactions, navigate }: any) {
    const methodMap = {
        cash: { label: 'Tunai', icon: Wallet, color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
        debit: { label: 'Debit', icon: CreditCard, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
        qris: { label: 'QRIS', icon: QrCode, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
        transfer: { label: 'Transfer', icon: FileText, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' }
    } as any;

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-600" />
                    Transaksi Terakhir
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="text-primary-600 font-bold hover:text-primary-700 h-8">
                    Riwayat <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {transactions.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <Timer className="w-12 h-12 mx-auto text-gray-200 opacity-50" />
                        <p className="text-gray-400 text-sm font-medium">Hening... Belum ada transaksi hari ini</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b dark:border-gray-800">
                                    <th className="py-2 px-4 text-left">Jam</th>
                                    <th className="py-2 px-4 text-left">Invoice</th>
                                    <th className="py-2 px-3 text-center">Items</th>
                                    <th className="py-2 px-4 text-right">Total</th>
                                    <th className="py-2 px-4 text-center">Bayar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {transactions.map((tx: any) => {
                                    const method = methodMap[tx.payment_method] || { label: tx.payment_method, icon: DollarSign, color: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-2 px-4 text-[10px] font-bold text-gray-500">
                                                {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-2 px-4">
                                                <span className="font-black text-gray-900 dark:text-gray-100 text-xs">{tx.invoice_number}</span>
                                                {tx.status === 'voided' && (
                                                    <Badge variant="destructive" className="ml-2 text-[9px] h-3.5 px-1 uppercase">VOID</Badge>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{tx.items?.length || 0}</span>
                                            </td>
                                            <td className={cn("py-2 px-4 text-right font-black text-xs", tx.status === 'voided' ? 'text-red-400 line-through' : 'text-primary-700 dark:text-primary-400')}>
                                                {formatCurrency(tx.total)}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                <Badge className={cn("font-bold text-[9px] h-4 px-1.5 shadow-none", method.color)}>{method.label}</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
