import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getBarColor = (margin) => {
  if (margin >= 30) return '#22c55e';
  if (margin >= 15) return '#eab308';
  return '#ef4444';
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{d.product_name}</p>
      <p className="text-blue-600">Pendapatan: Rp {d.total?.toLocaleString('id-ID')}</p>
      <p className="text-gray-500">Qty: {d.qty}</p>
      {d.margin !== undefined && <p className="text-green-600">Margin: {d.margin.toFixed(1)}%</p>}
    </div>
  );
};

export default function TopProductsChart({ data, profitData }) {
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
    <div className="card">
      <h3 className="font-semibold mb-4">Produk Terlaris</h3>
      <ResponsiveContainer width="100%" height={Math.max(250, data.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }}
            tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
          <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} width={120} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.margin)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
