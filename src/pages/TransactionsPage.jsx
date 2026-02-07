import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import ReceiptPreview from '../components/ReceiptPreview';
import AddPaymentModal from '../components/AddPaymentModal';

const PAYMENT_STATUS_CONFIG = {
  lunas: { label: 'Lunas', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700' },
  hutang: { label: 'Hutang', color: 'bg-orange-100 text-orange-700' },
  cicilan: { label: 'Cicilan', color: 'bg-purple-100 text-purple-700' },
};

function PaymentStatusBadge({ status }) {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.lunas;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function TransactionsPage() {
  const { user, hasRole } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', status: '', payment_status: '', customer_search: '' });
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => { loadTransactions(); }, []);

  // ESC to close modal
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (showAddPayment) {
        setShowAddPayment(false);
      } else if (showReceipt) {
        setShowReceipt(false);
      } else if (showDetail) {
        setShowDetail(false);
        setSelectedTx(null);
      }
    }
  }, [showDetail, showReceipt, showAddPayment]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const loadTransactions = async () => {
    const f = { ...filters };
    if (!hasRole('admin', 'supervisor')) f.user_id = user.id;
    const data = await window.api.getTransactions(f);
    setTransactions(data);
  };

  const handleFilter = () => { loadTransactions(); };

  const handleRowClick = async (tx) => {
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedTx(null);
    setShowDetail(true);
    try {
      const detail = await window.api.getTransactionById(tx.id);
      if (!detail) {
        setDetailError('Data transaksi tidak ditemukan');
      } else {
        setSelectedTx(detail);
      }
    } catch (err) {
      console.error('Failed to load transaction detail:', err);
      setDetailError('Gagal memuat detail transaksi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedTx(null);
    setDetailError(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseDetail();
    }
  };

  const handleVoid = async (tx) => {
    if (!confirm(`Void transaksi ${tx.invoice_number}?`)) return;
    await window.api.voidTransaction(tx.id);
    loadTransactions();
    handleCloseDetail();
  };

  const handlePrintFromDetail = () => {
    setShowReceipt(true);
  };

  const handlePrintFromTable = async (e, tx) => {
    e.stopPropagation();
    try {
      const detail = await window.api.getTransactionById(tx.id);
      if (detail) {
        setSelectedTx(detail);
        setShowReceipt(true);
      }
    } catch (err) {
      console.error('Failed to load transaction for print:', err);
    }
  };

  const handleVoidFromTable = (e, tx) => {
    e.stopPropagation();
    handleVoid(tx);
  };

  const handleAddPaymentClick = () => {
    setShowAddPayment(true);
  };

  const handlePaymentAdded = async () => {
    setShowAddPayment(false);
    // Refresh the selected transaction
    if (selectedTx) {
      const detail = await window.api.getTransactionById(selectedTx.id);
      setSelectedTx(detail);
    }
    loadTransactions();
  };

  const paymentLabel = (method) => {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'debit': return 'Debit';
      case 'qris': return 'QRIS';
      default: return method;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transaksi</h2>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">Cari Nama/Alamat Pembeli</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ketik nama atau alamat..."
              value={filters.customer_search}
              onChange={e => setFilters(f => ({ ...f, customer_search: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
            <input type="date" className="input-field text-sm" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
            <input type="date" className="input-field text-sm" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select className="input-field text-sm" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">Semua</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pembayaran</label>
            <select className="input-field text-sm" value={filters.payment_status} onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}>
              <option value="">Semua</option>
              <option value="lunas">Lunas</option>
              <option value="pending">Pending</option>
              <option value="hutang">Hutang</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          <button onClick={handleFilter} className="btn-primary text-sm">Filter</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Waktu</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kasir</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pembeli</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pembayaran</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Tidak ada transaksi</td></tr>
            ) : transactions.map(tx => (
              <tr
                key={tx.id}
                className="hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(tx)}
              >
                <td className="px-4 py-3 text-sm font-mono text-primary-600 font-medium">{tx.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(tx.created_at)}</td>
                <td className="px-4 py-3 text-sm">{tx.cashier_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tx.customer_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{paymentLabel(tx.payment_method)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="font-semibold">{formatCurrency(tx.total)}</div>
                  {tx.remaining_balance > 0 && (
                    <div className="text-xs text-orange-600">Sisa: {formatCurrency(tx.remaining_balance)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center space-y-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tx.status === 'completed' ? 'Selesai' : 'Void'}
                  </span>
                  {tx.payment_status && tx.payment_status !== 'lunas' && (
                    <div className="mt-1">
                      <PaymentStatusBadge status={tx.payment_status} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => handlePrintFromTable(e, tx)} className="text-primary-600 hover:text-primary-700 text-sm mr-2" title="Cetak struk">Cetak</button>
                  {hasRole('admin', 'supervisor') && tx.status === 'completed' && (
                    <button onClick={(e) => handleVoidFromTable(e, tx)} className="text-red-500 hover:text-red-700 text-sm" title="Void transaksi">Void</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn"
          onClick={handleBackdropClick}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col mx-4"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">Memuat detail...</div>
              </div>
            ) : detailError ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-red-500 text-sm">{detailError}</div>
                <button onClick={handleCloseDetail} className="btn-secondary text-sm">Tutup</button>
              </div>
            ) : !selectedTx ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-gray-400">Data tidak tersedia</div>
                <button onClick={handleCloseDetail} className="btn-secondary text-sm">Tutup</button>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Detail Transaksi</h3>
                    <p className="text-sm font-mono text-primary-600 mt-0.5">{selectedTx.invoice_number}</p>
                  </div>
                  <button
                    onClick={handleCloseDetail}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1 -mr-1 -mt-1"
                    title="Tutup (Esc)"
                  >
                    &times;
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Invoice info grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Tanggal & Waktu</div>
                      <div className="text-sm font-medium">{formatDateTime(selectedTx.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Kasir</div>
                      <div className="text-sm font-medium">{selectedTx.cashier_name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Metode Pembayaran</div>
                      <div className="text-sm font-medium">{paymentLabel(selectedTx.payment_method)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedTx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedTx.status === 'completed' ? 'Selesai' : 'Void'}
                        </span>
                        {selectedTx.payment_status && (
                          <PaymentStatusBadge status={selectedTx.payment_status} />
                        )}
                      </div>
                    </div>
                    {selectedTx.due_date && (
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Jatuh Tempo</div>
                        <div className="text-sm font-medium">{new Date(selectedTx.due_date).toLocaleDateString('id-ID')}</div>
                      </div>
                    )}
                  </div>

                  {/* Customer info (if provided) */}
                  {(selectedTx.customer_name || selectedTx.customer_address) && (
                    <div className="mb-5 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Info Pembeli
                      </div>
                      {selectedTx.customer_name && (
                        <div className="text-sm mb-1">
                          <span className="text-gray-500">Nama:</span>{' '}
                          <span className="font-medium text-gray-800">{selectedTx.customer_name}</span>
                        </div>
                      )}
                      {selectedTx.customer_address && (
                        <div className="text-sm">
                          <span className="text-gray-500">Alamat:</span>{' '}
                          <span className="font-medium text-gray-800">{selectedTx.customer_address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items table */}
                  <div className="mb-5">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Detail Item</div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedTx.items?.map((item, i) => (
                            <tr key={i} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-800">{item.product_name}</div>
                                {(item.discount > 0) && (
                                  <div className="text-xs text-orange-500 mt-0.5">Disc: -{formatCurrency(item.discount)}/item</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.price)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))}
                          {(!selectedTx.items || selectedTx.items.length === 0) && (
                            <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400">Tidak ada item</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(selectedTx.subtotal)}</span>
                    </div>
                    {selectedTx.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pajak</span>
                        <span>{formatCurrency(selectedTx.tax_amount)}</span>
                      </div>
                    )}
                    {selectedTx.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Diskon</span>
                        <span className="text-orange-500">-{formatCurrency(selectedTx.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className={selectedTx.status === 'voided' ? 'text-red-500 line-through' : 'text-gray-900'}>{formatCurrency(selectedTx.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                      <span className="text-gray-500">Terbayar</span>
                      <span className="text-green-600">{formatCurrency(selectedTx.total_paid || selectedTx.amount_paid)}</span>
                    </div>
                    {selectedTx.remaining_balance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sisa Tagihan</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedTx.remaining_balance)}</span>
                      </div>
                    )}
                    {selectedTx.change_amount > 0 && selectedTx.payment_status === 'lunas' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Kembali</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedTx.change_amount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment History */}
                  {selectedTx.payment_history && selectedTx.payment_history.length > 0 && (
                    <div className="mb-5">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-medium">Riwayat Pembayaran</div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tanggal</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Metode</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Jumlah</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedTx.payment_history.map((ph, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-gray-600">{formatDateTime(ph.payment_date)}</td>
                                <td className="px-3 py-2 text-gray-600">{paymentLabel(ph.payment_method)}</td>
                                <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(ph.amount)}</td>
                                <td className="px-3 py-2 text-gray-500 text-xs">{ph.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payment Notes */}
                  {selectedTx.payment_notes && (
                    <div className="mb-5 bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <div className="text-xs text-yellow-600 uppercase tracking-wide mb-1 font-medium">Catatan Pembayaran</div>
                      <div className="text-sm text-gray-700">{selectedTx.payment_notes}</div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {hasRole('admin', 'supervisor') && selectedTx.status === 'completed' && (
                      <button
                        onClick={() => handleVoid(selectedTx)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Void Transaksi
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {/* Add Payment Button for non-lunas transactions */}
                    {selectedTx.status === 'completed' && selectedTx.remaining_balance > 0 && hasRole('admin', 'supervisor', 'cashier') && (
                      <button
                        onClick={handleAddPaymentClick}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tambah Pembayaran
                      </button>
                    )}
                    <button onClick={handleCloseDetail} className="btn-secondary">
                      Tutup
                    </button>
                    <button
                      onClick={handlePrintFromDetail}
                      className="btn-primary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Cetak Struk
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && selectedTx && (
        <ReceiptPreview transaction={selectedTx} onClose={() => setShowReceipt(false)} />
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedTx && (
        <AddPaymentModal
          transaction={selectedTx}
          onClose={() => setShowAddPayment(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {/* Inline animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
