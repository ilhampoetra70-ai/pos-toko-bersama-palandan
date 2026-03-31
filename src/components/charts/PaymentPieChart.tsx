import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const COLORS: Record<string, string> = {
    cash: '#3b82f6',
    debit: '#8b5cf6',
    qris: '#f59e0b',
    credit: '#ef4444',
    transfer: '#10b981',
};

const LABELS: Record<string, string> = {
    cash: 'Tunai',
    debit: 'Debit',
    qris: 'QRIS',
    credit: 'Kredit',
    transfer: 'Transfer',
};

interface PaymentData {
    payment_method: string;
    total: number;
    count: number;
}

interface PaymentPieChartProps {
    data: PaymentData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-card dark:bg-background border dark:border-border rounded-2xl shadow-xl p-4 text-xs animate-in zoom-in-95">
            <p className="font-black text-foreground dark:text-foreground mb-2 uppercase tracking-widest">{d.name}</p>
            <div className="space-y-1">
                <p className="font-bold text-primary-600 dark:text-primary-400">Total: Rp {d.total?.toLocaleString('id-ID')}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{d.count} transaksi</p>
            </div>
        </div>
    );
};

const renderLabel = ({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`;

export default function PaymentPieChart({ data }: PaymentPieChartProps) {
    if (!data || data.length === 0) return null;

    const chartData = data.map(p => ({
        ...p,
        name: LABELS[p.payment_method] || p.payment_method,
        color: COLORS[p.payment_method] || 'hsl(var(--muted-foreground))',
    }));

    return (
        <Card className="border-none shadow-sm bg-card dark:bg-background rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            stroke="none"
                            label={renderLabel}
                            style={{ fontSize: '10px', fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} className="outline-none" />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
