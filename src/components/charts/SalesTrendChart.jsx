import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatYAxis = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return value;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-blue-600">Pendapatan: Rp {d.total?.toLocaleString('id-ID')}</p>
      <p className="text-gray-500">{d.count} transaksi</p>
    </div>
  );
};

export default function SalesTrendChart({ data, hideCard = false }) {
  if (!data || data.length === 0) return null;

  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2}
          fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (hideCard) return chart;

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Tren Penjualan Harian</h3>
      {chart}
    </div>
  );
}
