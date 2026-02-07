import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  cash: '#3b82f6',
  debit: '#8b5cf6',
  qris: '#f59e0b',
  credit: '#ef4444',
  transfer: '#10b981',
};

const LABELS = {
  cash: 'Tunai',
  debit: 'Debit',
  qris: 'QRIS',
  credit: 'Kredit',
  transfer: 'Transfer',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{d.name}</p>
      <p className="text-blue-600">Total: Rp {d.total?.toLocaleString('id-ID')}</p>
      <p className="text-gray-500">{d.count} transaksi</p>
    </div>
  );
};

const renderLabel = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`;

export default function PaymentPieChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(p => ({
    ...p,
    name: LABELS[p.payment_method] || p.payment_method,
    color: COLORS[p.payment_method] || '#94a3b8',
  }));

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} dataKey="total" nameKey="name"
            cx="50%" cy="50%" innerRadius={50} outerRadius={90}
            label={renderLabel} labelLine={true}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
