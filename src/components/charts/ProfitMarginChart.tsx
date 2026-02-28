import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MarginData {
    product_name: string;
    revenue: number;
    total_cost: number;
    profit: number;
    margin: number;
}

interface ProfitMarginChartProps {
    data: MarginData[];
}

const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'hsl(142 71% 45%)';
    if (margin >= 15) return 'hsl(38 92% 50%)';
    if (margin >= 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--destructive) / 0.6)';
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-card dark:bg-background border dark:border-border rounded-2xl shadow-xl p-4 text-xs animate-in zoom-in-95">
            <p className="font-black text-foreground dark:text-foreground mb-3 uppercase tracking-widest">{d.product_name}</p>
            <div className="space-y-2">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Pendapatan</span>
                    <span className="font-bold text-primary dark:text-primary">Rp {d.revenue?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Modal</span>
                    <span className="font-bold text-red-600 dark:text-red-400">Rp {d.total_cost?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t dark:border-border">
                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Laba Bersih</span>
                    <span className="font-black text-primary-600 dark:text-primary-400">Rp {d.profit?.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-2 py-1 px-2 bg-background dark:bg-background rounded-lg text-center">
                    <span className="font-black text-foreground dark:text-foreground">MARGIN: {d.margin?.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

export default function ProfitMarginChart({ data }: ProfitMarginChartProps) {
    if (!data || data.length === 0) return null;

    const chartData = data.slice(0, 15).map(p => ({
        ...p,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
    }));

    return (
        <Card className="border-none shadow-sm bg-card dark:bg-background rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Margin Laba per Produk (Top 15)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeWidth={2} className="stroke-gray-300 dark:stroke-gray-700" />
                        <XAxis
                            dataKey="product_name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={80}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 6 }} />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                        <Bar dataKey="margin" radius={[4, 4, 4, 4]} barSize={20}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={getMarginColor(entry.margin)} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
