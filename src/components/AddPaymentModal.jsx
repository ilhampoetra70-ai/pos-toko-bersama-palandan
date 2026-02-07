import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';

export default function AddPaymentModal({ transaction, onClose, onPaymentAdded }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentAmount = parseInt(amount) || 0;
  const remainingBalance = transaction.remaining_balance || 0;

  const quickAmounts = [
    Math.min(50000, remainingBalance),
    Math.min(100000, remainingBalance),
    Math.min(remainingBalance / 2, remainingBalance),
    remainingBalance,
  ].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4);

  const handleSubmit = async () => {
    if (paymentAmount <= 0) {
      setError('Jumlah pembayaran harus lebih dari 0');
      return;
    }
    if (paymentAmount > remainingBalance) {
      setError('Jumlah pembayaran melebihi sisa tagihan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await window.api.addPayment(
        transaction.id,
        paymentAmount,
        paymentMethod,
        user.id,
        notes.trim() || null
      );

      if (result.success) {
        onPaymentAdded();
      } else {
        setError(result.error || 'Gagal menambah pembayaran');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const isFullPayment = paymentAmount === remainingBalance;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Tambah Pembayaran</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-xs text-gray-500 mb-1">Invoice</div>
          <div className="font-mono text-primary-600 font-medium">{transaction.invoice_number}</div>
          {transaction.customer_name && (
            <div className="text-sm text-gray-600 mt-1">{transaction.customer_name}</div>
          )}
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 mb-1">Total Tagihan</div>
            <div className="font-bold text-blue-700">{formatCurrency(transaction.total)}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-xs text-orange-600 mb-1">Sisa Tagihan</div>
            <div className="font-bold text-orange-700">{formatCurrency(remainingBalance)}</div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
          <div className="flex gap-2">
            {['cash', 'debit', 'qris'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  paymentMethod === method
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {method === 'cash' ? 'Tunai' : method === 'debit' ? 'Debit' : 'QRIS'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran</label>
          <input
            type="number"
            className="input-field text-xl font-bold text-center"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max={remainingBalance}
            autoFocus
          />
        </div>

        {/* Quick Amounts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickAmounts.map((amt, i) => (
            <button
              key={i}
              onClick={() => setAmount(String(amt))}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                amt === remainingBalance
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {amt === remainingBalance ? 'Lunas' : formatCurrency(amt)}
            </button>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <textarea
            className="input-field resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan pembayaran..."
            rows={2}
          />
        </div>

        {/* Payment Summary */}
        {paymentAmount > 0 && (
          <div className={`rounded-lg p-4 mb-4 ${isFullPayment ? 'bg-green-50' : 'bg-blue-50'}`}>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className={isFullPayment ? 'text-green-600' : 'text-blue-600'}>Pembayaran</span>
                <span className="font-medium">{formatCurrency(paymentAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className={isFullPayment ? 'text-green-700' : 'text-blue-700'}>Sisa Setelah Bayar</span>
                <span className="font-bold">{formatCurrency(remainingBalance - paymentAmount)}</span>
              </div>
            </div>
            {isFullPayment && (
              <div className="mt-2 text-center text-green-700 font-medium text-sm">
                Transaksi akan menjadi LUNAS
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || paymentAmount <= 0 || paymentAmount > remainingBalance}
            className="btn-success flex-1 py-3 font-bold"
          >
            {loading ? 'Memproses...' : isFullPayment ? 'Lunasi' : 'Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
