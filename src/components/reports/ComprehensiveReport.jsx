import { useState, useRef } from 'react';
import { formatCurrency, formatNumber } from '../../utils/format';
import SalesTrendChart from '../charts/SalesTrendChart';
import TopProductsChart from '../charts/TopProductsChart';
import PaymentPieChart from '../charts/PaymentPieChart';
import HourlySalesChart from '../charts/HourlySalesChart';
import ProfitMarginChart from '../charts/ProfitMarginChart';

function CollapsibleSection({ id, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div id={id} className="card">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-semibold text-left">
        <span>{title}</span>
        <span className="text-gray-400 text-lg">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function MiniCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color] || colors.blue}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ComprehensiveReport({ data, stockAuditData }) {
  const containerRef = useRef(null);

  if (!data) return null;

  const { sales, profit, hourly, bottomProducts, transactionLog } = data;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const peakHour = [...hourly].sort((a, b) => b.total - a.total)[0];
  const topProduct = sales.topProducts[0];

  const navItems = [
    { id: 'sec-summary', label: 'Ringkasan' },
    { id: 'sec-trend', label: 'Tren' },
    { id: 'sec-products', label: 'Produk' },
    { id: 'sec-payment', label: 'Pembayaran' },
    { id: 'sec-txlog', label: 'Transaksi' },
    { id: 'sec-profit', label: 'Laba' },
    ...(stockAuditData && stockAuditData.length > 0 ? [{ id: 'sec-stockaudit', label: 'Stok' }] : []),
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Quick navigation */}
      <div className="flex flex-wrap gap-2">
        {navItems.map(n => (
          <button key={n.id} onClick={() => scrollTo(n.id)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            {n.label}
          </button>
        ))}
      </div>

      {/* Executive summary */}
      <CollapsibleSection id="sec-summary" title="Ringkasan Eksekutif">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniCard label="Total Pendapatan" value={formatCurrency(sales.summary.revenue)} color="blue" />
          <MiniCard label="Jumlah Transaksi" value={formatNumber(sales.summary.count)} sub="transaksi" color="green" />
          <MiniCard label="Rata-rata" value={formatCurrency(sales.summary.average)} color="purple" />
          <MiniCard label="Laba Kotor" value={formatCurrency(profit.totals.profit)} color="green" />
          <MiniCard label="Margin Laba" value={`${profit.totals.margin.toFixed(1)}%`} color="orange" />
          <MiniCard label="Total Modal" value={formatCurrency(profit.totals.cost)} color="red" />
          <MiniCard label="Produk Terlaris" value={topProduct?.product_name || '-'}
            sub={topProduct ? `${formatNumber(topProduct.qty)} qty` : ''} color="blue" />
          <MiniCard label="Jam Tersibuk" value={peakHour && peakHour.total > 0 ? `${String(peakHour.hour).padStart(2, '0')}:00` : '-'}
            sub={peakHour && peakHour.total > 0 ? formatCurrency(peakHour.total) : ''} color="purple" />
        </div>
      </CollapsibleSection>

      {/* Sales trend */}
      <CollapsibleSection id="sec-trend" title="Tren Penjualan">
        <div className="space-y-4">
          <SalesTrendChart data={sales.dailyBreakdown} />
          <HourlySalesChart data={hourly} />
        </div>
      </CollapsibleSection>

      {/* Product performance */}
      <CollapsibleSection id="sec-products" title="Performa Produk">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Top 5 Produk Terlaris</h4>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
                <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
              </tr></thead>
              <tbody>
                {sales.topProducts.slice(0, 5).map((p, i) => (
                  <tr key={p.product_name} className="border-b border-gray-100">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2">{p.product_name}</td>
                    <td className="py-2 text-center">{formatNumber(p.qty)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Bottom 5 Produk Paling Sedikit</h4>
            {bottomProducts.length === 0 ? (
              <p className="text-gray-400 text-sm">Tidak ada data</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                </tr></thead>
                <tbody>
                  {bottomProducts.map((p, i) => (
                    <tr key={p.product_name} className="border-b border-gray-100">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2">{p.product_name}</td>
                      <td className="py-2 text-center">{formatNumber(p.qty)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <TopProductsChart data={sales.topProducts} profitData={profit.products} />
      </CollapsibleSection>

      {/* Payment methods */}
      <CollapsibleSection id="sec-payment" title="Metode Pembayaran">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PaymentPieChart data={sales.paymentBreakdown} />
          <div>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">Metode</th>
                <th className="text-center py-2 text-gray-500 font-medium">Jumlah</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 text-gray-500 font-medium">%</th>
              </tr></thead>
              <tbody>
                {sales.paymentBreakdown.map(p => {
                  const pct = sales.summary.revenue > 0 ? ((p.total / sales.summary.revenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.payment_method} className="border-b border-gray-100">
                      <td className="py-2">{p.payment_method === 'cash' ? 'Tunai' : p.payment_method}</td>
                      <td className="py-2 text-center">{p.count}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.total)}</td>
                      <td className="py-2 text-right text-gray-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Transaction log */}
      <CollapsibleSection id="sec-txlog" title="Log Transaksi">
        {transactionLog.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada transaksi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">Invoice</th>
                <th className="text-left py-2 text-gray-500 font-medium">Waktu</th>
                <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                <th className="text-left py-2 text-gray-500 font-medium">Pembayaran</th>
                <th className="text-left py-2 text-gray-500 font-medium">Kasir</th>
              </tr></thead>
              <tbody>
                {transactionLog.slice(0, 100).map(tx => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">{tx.invoice_number}</td>
                    <td className="py-2 text-xs">{tx.created_at?.slice(0, 19)}</td>
                    <td className="py-2 text-xs">
                      {tx.items?.map(it => `${it.product_name} x${it.quantity}`).join(', ')}
                    </td>
                    <td className="py-2 text-right font-medium">{formatCurrency(tx.total)}</td>
                    <td className="py-2">{tx.payment_method === 'cash' ? 'Tunai' : (tx.payment_method || '')}</td>
                    <td className="py-2">{tx.cashier_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactionLog.length > 100 && (
              <p className="text-xs text-gray-400 mt-2">Menampilkan 100 dari {transactionLog.length} transaksi</p>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* Profit detail */}
      <CollapsibleSection id="sec-profit" title="Detail Laba">
        <ProfitMarginChart data={profit.products} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
              <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
              <th className="text-right py-2 text-gray-500 font-medium">Pendapatan</th>
              <th className="text-right py-2 text-gray-500 font-medium">Modal</th>
              <th className="text-right py-2 text-gray-500 font-medium">Laba</th>
              <th className="text-right py-2 text-gray-500 font-medium">Margin</th>
            </tr></thead>
            <tbody>
              {profit.products.map(p => {
                const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={p.product_name} className="border-b border-gray-100">
                    <td className="py-2">{p.product_name}</td>
                    <td className="py-2 text-center">{formatNumber(p.qty)}</td>
                    <td className="py-2 text-right">{formatCurrency(p.revenue)}</td>
                    <td className="py-2 text-right">{formatCurrency(p.total_cost)}</td>
                    <td className="py-2 text-right font-medium text-green-600">{formatCurrency(p.profit)}</td>
                    <td className="py-2 text-right">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="py-2">Total</td>
                <td></td>
                <td className="py-2 text-right">{formatCurrency(profit.totals.revenue)}</td>
                <td className="py-2 text-right">{formatCurrency(profit.totals.cost)}</td>
                <td className="py-2 text-right text-green-600">{formatCurrency(profit.totals.profit)}</td>
                <td className="py-2 text-right">{profit.totals.margin.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CollapsibleSection>

      {/* Stock audit log */}
      {stockAuditData && stockAuditData.length > 0 && (
        <CollapsibleSection id="sec-stockaudit" title="Log Perubahan Stok Manual">
          <p className="text-xs text-gray-500 mb-3">
            Perubahan stok manual dalam periode ini (tidak termasuk perubahan otomatis dari transaksi penjualan)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
                <th className="text-center py-2 text-gray-500 font-medium">Jml Perubahan</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total Perubahan</th>
                <th className="text-left py-2 text-gray-500 font-medium">Diubah Oleh</th>
              </tr></thead>
              <tbody>
                {stockAuditData.map(log => (
                  <tr key={log.product_id} className="border-b border-gray-100">
                    <td className="py-2">{log.product_name}</td>
                    <td className="py-2 text-center">{formatNumber(log.change_count)}</td>
                    <td className={`py-2 text-right font-medium ${
                      log.total_change > 0 ? 'text-green-600' : log.total_change < 0 ? 'text-red-600' : ''
                    }`}>
                      {log.total_change > 0 ? '+' : ''}{formatNumber(log.total_change)}
                    </td>
                    <td className="py-2 text-gray-600">{log.user_names || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
