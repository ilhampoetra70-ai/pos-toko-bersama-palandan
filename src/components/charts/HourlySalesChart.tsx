import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface HourlySalesData {
    hour: number;
    total: number;
    count: number;
}

interface HourlySalesChartProps {
    data: HourlySalesData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-card dark:bg-background border dark:border-border rounded-2xl shadow-xl p-4 text-xs animate-in zoom-in-95">
            <p className="font-black text-foreground dark:text-foreground mb-2 uppercase tracking-widest">{String(d.hour).padStart(2, '0')}:00</p>
            <div className="space-y-1">
                <p className="font-bold text-primary-600 dark:text-primary-400">Pendapatan: Rp {d.total?.toLocaleString('id-ID')}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{d.count} transaksi terdeteksi</p>
            </div>
        </div>
    );
};

export default function HourlySalesChart({ data }: HourlySalesChartProps) {
    if (!data || data.length === 0) return null;

    const maxTotal = Math.max(...data.map(d => d.total), 1);

    return (
        <Card className="border-none shadow-sm bg-card dark:bg-background rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pola Penjualan per Jam</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeWidth={2} className="stroke-gray-300 dark:stroke-gray-700" />
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => `${String(v).padStart(2, '0')}:00`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 8 }} />
                        <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={24}>
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.total >= maxTotal * 0.8 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                                    fillOpacity={entry.total >= maxTotal * 0.8 ? 1 : 0.25}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
