import React from 'react';
import { TrendingUp, FileText, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '../../utils/format';
import SalesTrendChart from '../charts/SalesTrendChart';
import PaymentPieChart from '../charts/PaymentPieChart';
import HourlySalesChart from '../charts/HourlySalesChart';
import TopProductsChart from '../charts/TopProductsChart';
import StatCard from './StatCard';
import StockAuditSection from './StockAuditSection';
import TransactionLogSection from './TransactionLogSection';
import StockTrailSection from './StockTrailSection';

export default function SalesReportTab({ data, hourlyData, stockAuditData, transactionsData, stockTrailData }: any) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Pendapatan Total" value={formatCurrency(data.summary.revenue)} icon={TrendingUp} color="blue" />
                <StatCard title="Total Transaksi" value={formatNumber(data.summary.count)} icon={FileText} color="purple" />
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

            <StockAuditSection data={stockAuditData} />
            <TransactionLogSection data={transactionsData} />
            <StockTrailSection data={stockTrailData} />
        </div>
    );
}
