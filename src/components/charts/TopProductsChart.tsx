import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TopProductData {
    product_name: string;
    total: number;
    qty: number;
}

interface ProfitData {
    product_name: string;
    revenue: number;
    profit: number;
}

interface TopProductsChartProps {
    data: TopProductData[];
    profitData?: ProfitData[];
}

const getBarColor = (margin: number) => {
    if (margin >= 30) return '#22c55e';
    if (margin >= 15) return '#f59e0b';
    return '#ef4444';
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl shadow-xl p-4 text-xs animate-in zoom-in-95">
            <p className="font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-widest">{d.product_name}</p>
            <div className="space-y-1">
                <p className="font-bold text-primary-600 dark:text-primary-400">Pendapatan: Rp {d.total?.toLocaleString('id-ID')}</p>
                <p className="text-[10px] font-bold text-gray-400">Kuantitas Terjual: {d.qty}</p>
                {d.margin !== undefined && (
                    <div className="mt-2 pt-1 border-t dark:border-gray-800">
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">Margin Estimasi: {d.margin.toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TopProductsChart({ data, profitData }: TopProductsChartProps) {
    if (!data || data.length === 0) return null;

    const chartData = data.map(p => {
        let margin = 0;
        if (profitData) {
            const match = profitData.find(pp => pp.product_name === p.product_name);
            if (match && match.revenue > 0) {
                margin = (match.profit / match.revenue) * 100;
            }
        }
        return { ...p, margin };
    });

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950 rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(250, data.length * 40)}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid horizontal={false} strokeWidth={1.5} className="stroke-gray-300 dark:stroke-gray-600" />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                        />
                        <YAxis
                            type="category"
                            dataKey="product_name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                            width={140}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 6 }} />
                        <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={getBarColor(entry.margin)} fillOpacity={0.85} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
