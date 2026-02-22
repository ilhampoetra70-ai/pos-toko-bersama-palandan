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
            <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all">
                <CardHeader className="bg-muted/20 border-b border-border">
                    <CardTitle className="text-base font-bold text-card-foreground">Komparasi Head-to-Head</CardTitle>
                    <CardDescription className="text-muted-foreground">Perbandingan performa antara dua periode</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-border">
                                <TableHead className="font-black text-[10px] uppercase text-muted-foreground">METRIK</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase text-muted-foreground">{labelA}</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase text-muted-foreground">{labelB}</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase text-muted-foreground">PERUBAHAN</TableHead>
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
        <TableRow className="h-16 border-b border-border hover:bg-muted/10">
            <TableCell className="font-bold text-muted-foreground">{label}</TableCell>
            <TableCell className="text-right font-bold tabular-nums text-foreground">{valA}</TableCell>
            <TableCell className="text-right font-black tabular-nums text-primary">{valB}</TableCell>
            <TableCell className="text-center">
                <Badge className={cn(
                    "font-black text-xs px-3",
                    isUp ? "bg-green-100/50 text-green-700 dark:bg-green-900/40 dark:text-green-400 shadow-none hover:bg-green-100/60" : "bg-red-100/50 text-red-700 dark:bg-red-900/40 dark:text-red-400 shadow-none hover:bg-red-100/60"
                )}>
                    {isUp ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {Math.abs(delta).toFixed(1)}%
                </Badge>
            </TableCell>
        </TableRow>
    );
}
