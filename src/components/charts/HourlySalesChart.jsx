import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{String(d.hour).padStart(2, '0')}:00</p>
      <p className="text-blue-600">Pendapatan: Rp {d.total?.toLocaleString('id-ID')}</p>
      <p className="text-gray-500">{d.count} transaksi</p>
    </div>
  );
};

export default function HourlySalesChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Pola Penjualan per Jam</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${String(v).padStart(2, '0')}:00`} />
          <YAxis tick={{ fontSize: 11 }}
            tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.total >= maxTotal * 0.8 ? '#3b82f6' : '#93c5fd'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
