import React from 'react';
import { Activity } from 'lucide-react';
import { RetroMoney, RetroBox, RetroChart } from '../../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../../utils/format';
import TransactionLogSection from './TransactionLogSection';
import StatCard from './StatCard';
import StockAuditSection from './StockAuditSection';
import StockTrailSection from './StockTrailSection';

export default function ProfitReportTab({ data, stockAuditData, stockTrailData, transactionsData }: any) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Pendapatan" value={formatCurrency(data.totals.revenue)} icon={RetroMoney} color="blue" />
                <StatCard title="Total Modal" value={formatCurrency(data.totals.cost)} icon={RetroBox} color="orange" />
                <StatCard title="Laba Kotor" value={formatCurrency(data.totals.profit)} icon={RetroChart} color="green" />
                <StatCard title="Margin Rata-rata" value={`${data.totals.margin.toFixed(1)}%`} icon={Activity} color="purple" />
            </div>

            <TransactionLogSection data={transactionsData} />

            <StockAuditSection data={stockAuditData} />
            <StockTrailSection data={stockTrailData} />
        </div>
    );
}
