import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const getMarginColor = (margin) => {
  if (margin >= 30) return '#22c55e';
  if (margin >= 15) return '#eab308';
  if (margin >= 0) return '#f97316';
  return '#ef4444';
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{d.product_name}</p>
      <p className="text-blue-600">Pendapatan: Rp {d.revenue?.toLocaleString('id-ID')}</p>
      <p className="text-orange-600">Modal: Rp {d.total_cost?.toLocaleString('id-ID')}</p>
      <p className="text-green-600">Laba: Rp {d.profit?.toLocaleString('id-ID')}</p>
      <p className="font-medium">Margin: {d.margin?.toFixed(1)}%</p>
    </div>
  );
};

export default function ProfitMarginChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.slice(0, 15).map(p => ({
    ...p,
    margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
  }));

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Margin Laba per Produk</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="product_name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }}
            interval={0} height={80} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#666" />
          <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getMarginColor(entry.margin)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
