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
    if (margin >= 30) return '#22c55e';
    if (margin >= 15) return '#f59e0b';
    if (margin >= 0) return '#ef4444';
    return '#7f1d1d';
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl shadow-xl p-4 text-xs animate-in zoom-in-95">
            <p className="font-black text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-widest">{d.product_name}</p>
            <div className="space-y-2">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400 font-bold uppercase tracking-tight">Pendapatan</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">Rp {d.revenue?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400 font-bold uppercase tracking-tight">Modal</span>
                    <span className="font-bold text-red-600 dark:text-red-400">Rp {d.total_cost?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4 pt-1 border-t dark:border-gray-800">
                    <span className="text-gray-400 font-bold uppercase tracking-tight">Laba Bersih</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">Rp {d.profit?.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-2 py-1 px-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                    <span className="font-black text-gray-900 dark:text-gray-100">MARGIN: {d.margin?.toFixed(1)}%</span>
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
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950 rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Margin Laba per Produk (Top 15)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid vertical={false} strokeWidth={1.5} className="stroke-gray-300 dark:stroke-gray-600" />
                        <XAxis
                            dataKey="product_name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={80}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 6 }} />
                        <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={2} />
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
