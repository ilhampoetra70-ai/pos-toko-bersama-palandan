import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import AddPaymentModal from '../components/AddPaymentModal';

const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
  hutang: { label: 'Hutang', color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-200' },
  cicilan: { label: 'Cicilan', color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-200' },
};

function PaymentStatusBadge({ status }) {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function DebtManagementPage() {
  const { user } = useAuth();
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ payment_status: '', customer_search: '', overdue_only: false });
  const [selectedTx, setSelectedTx] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsData, summaryData] = await Promise.all([
        window.api.getOutstandingDebts(filters),
        window.api.getDebtSummary()
      ]);
      setDebts(debtsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load debt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadData();
  };

  const handleRowClick = (txId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(txId)) {
        newSet.delete(txId);
      } else {
        newSet.add(txId);
      }
      return newSet;
    });
  };

  const handleAddPayment = async (tx) => {
    // Load fresh transaction data
    const detail = await window.api.getTransactionById(tx.id);
    setSelectedTx(detail);
    setShowAddPayment(true);
  };

  const handlePaymentAdded = () => {
    setShowAddPayment(false);
    setSelectedTx(null);
    loadData();
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  // ESC to close modal
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && showAddPayment) {
      setShowAddPayment(false);
    }
  }, [showAddPayment]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span className="text-gray-500">Memuat data piutang...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Piutang</h2>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Outstanding */}
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Piutang</div>
                <div className="text-xl font-bold text-orange-600">{formatCurrency(summary.total_outstanding)}</div>
                <div className="text-xs text-gray-400">{summary.total_count} transaksi</div>
              </div>
            </div>
          </div>

          {/* Overdue */}
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Jatuh Tempo</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(summary.overdue_total)}</div>
                <div className="text-xs text-gray-400">{summary.overdue_count} transaksi</div>
              </div>
            </div>
          </div>

          {/* By Status */}
          {summary.by_status?.map(s => {
            const config = PAYMENT_STATUS_CONFIG[s.payment_status] || PAYMENT_STATUS_CONFIG.pending;
            return (
              <div key={s.payment_status} className={`card border-l-4 ${config.borderColor}`}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <PaymentStatusBadge status={s.payment_status} />
                    </div>
                    <div className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(s.total)}</div>
                    <div className="text-xs text-gray-400">{s.count} transaksi</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">Cari Pembeli</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Nama atau alamat..."
              value={filters.customer_search}
              onChange={e => setFilters(f => ({ ...f, customer_search: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              className="input-field text-sm"
              value={filters.payment_status}
              onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}
            >
              <option value="">Semua</option>
              <option value="pending">Pending</option>
              <option value="hutang">Hutang</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overdue_only"
              checked={filters.overdue_only}
              onChange={e => setFilters(f => ({ ...f, overdue_only: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="overdue_only" className="text-sm text-gray-600">
              Jatuh tempo saja
            </label>
          </div>
          <button onClick={handleFilter} className="btn-primary text-sm">Filter</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pembeli</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Terbayar</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Sisa</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Jatuh Tempo</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {debts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  {loading ? 'Memuat...' : 'Tidak ada piutang'}
                </td>
              </tr>
            ) : debts.map(tx => {
              const daysOverdue = getDaysOverdue(tx.due_date);
              const isExpanded = expandedRows.has(tx.id);

              return (
                <tr
                  key={tx.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${daysOverdue ? 'bg-red-50/50' : ''}`}
                  onClick={() => handleRowClick(tx.id)}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{tx.customer_name || '-'}</div>
                    {tx.customer_address && (
                      <div className="text-xs text-gray-500 truncate max-w-48">{tx.customer_address}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono text-primary-600">{tx.invoice_number}</div>
                    <div className="text-xs text-gray-400">{formatDateTime(tx.created_at)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-medium">{formatCurrency(tx.total)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-green-600">{formatCurrency(tx.total_paid)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-bold text-orange-600">{formatCurrency(tx.remaining_balance)}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tx.due_date ? (
                      <div>
                        <div className={`text-sm ${daysOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {new Date(tx.due_date).toLocaleDateString('id-ID')}
                        </div>
                        {daysOverdue && (
                          <div className="text-xs text-red-500 font-medium">
                            {daysOverdue} hari lewat
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PaymentStatusBadge status={tx.payment_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPayment(tx);
                      }}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Bayar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Footer */}
      {debts.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="bg-gray-50 rounded-lg px-6 py-3">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-gray-500">Total Tagihan:</span>
                <span className="ml-2 font-bold">{formatCurrency(debts.reduce((sum, d) => sum + d.total, 0))}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Terbayar:</span>
                <span className="ml-2 font-bold text-green-600">{formatCurrency(debts.reduce((sum, d) => sum + d.total_paid, 0))}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Sisa:</span>
                <span className="ml-2 font-bold text-orange-600">{formatCurrency(debts.reduce((sum, d) => sum + d.remaining_balance, 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedTx && (
        <AddPaymentModal
          transaction={selectedTx}
          onClose={() => setShowAddPayment(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
}
