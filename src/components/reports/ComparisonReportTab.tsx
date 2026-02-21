import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '../../utils/format';
import { cn } from '@/lib/utils';
import StockAuditSection from './StockAuditSection';
import StockTrailSection from './StockTrailSection';

export default function ComparisonReportTab({ data, labelA, labelB, stockAuditData, stockTrailData }: any) {
    if (!data) return null;

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-gray-900 transition-all">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                    <CardTitle className="text-lg font-bold">Komparasi Head-to-Head</CardTitle>
                    <CardDescription className="dark:text-gray-400">Perbandingan performa antara dua periode</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30 dark:bg-gray-800/20 border-b dark:border-gray-800">
                                <TableHead className="font-black text-[10px] uppercase dark:text-gray-400">METRIK</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">{labelA}</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase dark:text-gray-400">{labelB}</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase dark:text-gray-400">PERUBAHAN</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            <ComparisonRow label="Pendapatan" valA={formatCurrency(data.periodA.revenue)} valB={formatCurrency(data.periodB.revenue)} delta={data.delta.revenue} />
                            <ComparisonRow label="Transaksi" valA={formatNumber(data.periodA.count)} valB={formatNumber(data.periodB.count)} delta={data.delta.count} />
                            <ComparisonRow label="Rata-rata" valA={formatCurrency(data.periodA.average)} valB={formatCurrency(data.periodB.average)} delta={data.delta.average} />
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <StockAuditSection data={stockAuditData} />
            <StockTrailSection data={stockTrailData} />
        </div>
    );
}

function ComparisonRow({ label, valA, valB, delta }: any) {
    const isUp = delta >= 0;
    return (
        <TableRow className="h-16">
            <TableCell className="font-bold text-gray-500">{label}</TableCell>
            <TableCell className="text-right font-bold text-gray-900">{valA}</TableCell>
            <TableCell className="text-right font-black text-primary-700">{valB}</TableCell>
            <TableCell className="text-center">
                <Badge className={cn(
                    "font-black text-xs px-3",
                    isUp ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 shadow-none hover:bg-green-100" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 shadow-none hover:bg-red-100"
                )}>
                    {isUp ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {Math.abs(delta).toFixed(1)}%
                </Badge>
            </TableCell>
        </TableRow>
    );
}
