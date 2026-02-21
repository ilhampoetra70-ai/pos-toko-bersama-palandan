import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SalesData {
    date: string;
    total: number;
    count: number;
}

interface SalesTrendChartProps {
    data: SalesData[];
    hideCard?: boolean;
}

const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
    return value;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
            <p className="font-black text-primary-600 dark:text-primary-400 tabular-nums">
                Rp {d.total?.toLocaleString('id-ID')}
            </p>
            <p className="text-gray-400 mt-0.5 tabular-nums">{d.count} transaksi</p>
        </div>
    );
};

const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const radius = 4;
    if (height <= 0) return null;
    return (
        <path
            d={`
                M ${x},${y + radius}
                Q ${x},${y} ${x + radius},${y}
                L ${x + width - radius},${y}
                Q ${x + width},${y} ${x + width},${y + radius}
                L ${x + width},${y + height}
                L ${x},${y + height}
                Z
            `}
            fill={fill}
        />
    );
};

export default function SalesTrendChart({ data, hideCard = false }: SalesTrendChartProps) {
    if (!data || data.length === 0) return null;

    // Highlight the bar with the highest value
    const maxTotal = Math.max(...data.map(d => d.total));

    const chart = (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth={1}
                />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={formatYAxis}
                    width={40}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
                />
                <Bar dataKey="total" shape={<CustomBar />} maxBarSize={48}>
                    {data.map((entry, index) => (
                        <Cell
                            key={index}
                            fill={entry.total === maxTotal && maxTotal > 0
                                ? 'rgb(var(--color-primary-600))'
                                : 'rgb(var(--color-primary-400) / 0.5)'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

    if (hideCard) return chart;

    return (
        <Card className="border-none shadow-sm bg-white dark:bg-gray-950 rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Tren Penjualan Harian
                </CardTitle>
            </CardHeader>
            <CardContent>
                {chart}
            </CardContent>
        </Card>
    );
}
