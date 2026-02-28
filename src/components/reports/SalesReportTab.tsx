import React from 'react';
import { Activity, MapPin } from 'lucide-react';
import { RetroMoney, RetroReceipt, RetroUsers } from '../../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '../../utils/format';
import SalesTrendChart from '../charts/SalesTrendChart';
import PaymentPieChart from '../charts/PaymentPieChart';
import HourlySalesChart from '../charts/HourlySalesChart';
import TopProductsChart from '../charts/TopProductsChart';
import StatCard from './StatCard';
import StockAuditSection from './StockAuditSection';
import TransactionLogSection from './TransactionLogSection';
import StockTrailSection from './StockTrailSection';

function deriveCustomerRankings(transactionLog: any[]) {
    const byName: { name: string; count: number; total: number }[] = Object.values(
        (transactionLog || []).reduce((acc: any, tx: any) => {
            const key = (tx.customer_name || '').trim();
            if (!key) return acc;
            if (!acc[key]) acc[key] = { name: key, count: 0, total: 0 };
            acc[key].count++;
            acc[key].total += tx.total || 0;
            return acc;
        }, {})
    ).sort((a: any, b: any) => b.total - a.total).slice(0, 15) as any;

    const byAddress: { address: string; count: number; total: number }[] = Object.values(
        (transactionLog || []).reduce((acc: any, tx: any) => {
            const key = (tx.customer_address || '').trim();
            if (!key) return acc;
            if (!acc[key]) acc[key] = { address: key, count: 0, total: 0 };
            acc[key].count++;
            acc[key].total += tx.total || 0;
            return acc;
        }, {})
    ).sort((a: any, b: any) => b.total - a.total).slice(0, 15) as any;

    return { byName, byAddress };
}

function CustomerTable({ rows, keyField, labelField }: { rows: any[]; keyField: string; labelField: string }) {
    if (rows.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Tidak ada data
            </div>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs zebra-rows">
                <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="text-left py-3 px-2 w-6">#</th>
                        <th className="text-left py-3">Nama</th>
                        <th className="text-center py-3 w-14">Tx</th>
                        <th className="text-right py-3 px-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((c, i) => (
                        <tr key={c[keyField]} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-2 text-muted-foreground font-bold">{i + 1}</td>
                            <td className="py-2.5 font-bold text-foreground max-w-[150px] truncate" title={c[labelField]}>
                                {c[labelField]}
                            </td>
                            <td className="py-2.5 text-center">
                                <Badge variant="secondary" className="font-black text-[10px] bg-primary/10 text-primary border-none">
                                    {c.count}x
                                </Badge>
                            </td>
                            <td className="py-2.5 text-right font-black tabular-nums text-foreground px-2">
                                {formatCurrency(c.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SalesReportTab({ data, hourlyData, stockAuditData, transactionsData, stockTrailData }: any) {
    const txLog = data.transactionLog || [];
    const { byName, byAddress } = deriveCustomerRankings(txLog);
    const hasCustomerData = byName.length > 0 || byAddress.length > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Pendapatan Total" value={formatCurrency(data.summary.revenue)} icon={RetroMoney} color="blue" />
                <StatCard title="Total Transaksi" value={formatNumber(data.summary.count)} icon={RetroReceipt} color="purple" />
                <StatCard title="Rata-rata Penjualan" value={formatCurrency(data.summary.average)} icon={Activity} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-card-foreground">Tren Penjualan</CardTitle></CardHeader>
                    <CardContent><SalesTrendChart data={data.dailyBreakdown} hideCard={true} /></CardContent>
                </Card>
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-card-foreground">Distribusi Pembayaran</CardTitle></CardHeader>
                    <CardContent><PaymentPieChart data={data.paymentBreakdown} /></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-card-foreground">Pola Penjualan Per Jam</CardTitle></CardHeader>
                    <CardContent><HourlySalesChart data={hourlyData} /></CardContent>
                </Card>
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-card-foreground">Produk Terlaris</CardTitle></CardHeader>
                    <CardContent><TopProductsChart data={data.topProducts} profitData={null} /></CardContent>
                </Card>
            </div>

            {hasCustomerData && (
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-card-foreground flex items-center gap-2">
                            <RetroUsers className="w-4 h-4 text-primary" />
                            Pemeringkatan Pelanggan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <RetroUsers className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Berdasarkan Nama Pembeli</p>
                                </div>
                                <CustomerTable rows={byName} keyField="name" labelField="name" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Berdasarkan Alamat Pembeli</p>
                                </div>
                                <CustomerTable rows={byAddress} keyField="address" labelField="address" />
                            </div>
                        </div>
                        {txLog.length >= 300 && (
                            <p className="text-[10px] text-muted-foreground font-bold mt-4 text-center uppercase tracking-widest">
                                * Berdasarkan {txLog.length} transaksi terbaru. Untuk data lebih lengkap gunakan tab Laporan Lengkap.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <StockAuditSection data={stockAuditData} />
            <TransactionLogSection data={transactionsData} />
            <StockTrailSection data={stockTrailData} />
        </div>
    );
}
