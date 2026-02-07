import { useState } from 'react';
import { formatCurrency } from '../utils/format';

const PAYMENT_STATUSES = [
  { value: 'lunas', label: 'Lunas', desc: 'Bayar penuh', color: 'green' },
  { value: 'pending', label: 'Pending', desc: 'COD/Bayar nanti', color: 'blue' },
  { value: 'hutang', label: 'Hutang', desc: 'Kredit + jatuh tempo', color: 'orange' },
  { value: 'cicilan', label: 'Cicilan', desc: 'Bayar bertahap', color: 'purple' },
];

export default function PaymentModal({ total, onConfirm, onClose, customerName, customerAddress }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('lunas');
  const [dueDate, setDueDate] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const paid = parseInt(amountPaid) || 0;
  const change = paid - total;
  const dpAmount = parseInt(initialPayment) || 0;

  // Check if customer info is required but missing
  const requiresCustomerInfo = paymentStatus !== 'lunas';
  const hasCustomerInfo = customerName && customerName.trim().length > 0;
  const customerInfoMissing = requiresCustomerInfo && !hasCustomerInfo;

  // Validation for due date (required for hutang)
  const requiresDueDate = paymentStatus === 'hutang';
  const dueDateMissing = requiresDueDate && !dueDate;

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4);

  const handleSubmit = () => {
    // Validation
    if (customerInfoMissing) {
      alert('Untuk pembayaran non-lunas, info pembeli (nama) wajib diisi di bagian Info Pembeli');
      return;
    }
    if (dueDateMissing) {
      alert('Tanggal jatuh tempo wajib diisi untuk pembayaran hutang');
      return;
    }
    if (paymentStatus === 'lunas') {
      if (paymentMethod === 'cash' && paid < total) return;
    }
    if ((paymentStatus === 'cicilan' || paymentStatus === 'hutang') && dpAmount > total) {
      alert('Pembayaran awal tidak boleh melebihi total');
      return;
    }

    onConfirm({
      payment_method: paymentMethod,
      amount_paid: paymentStatus === 'lunas' ? (paymentMethod === 'cash' ? paid : total) : dpAmount,
      change_amount: paymentStatus === 'lunas' && paymentMethod === 'cash' ? Math.max(0, change) : 0,
      payment_status: paymentStatus,
      due_date: paymentStatus === 'hutang' ? dueDate : null,
      initial_payment: (paymentStatus === 'cicilan' || paymentStatus === 'hutang') ? dpAmount : null,
      payment_notes: paymentNotes.trim() || null,
    });
  };

  const getStatusColor = (status, isActive) => {
    const colors = {
      lunas: isActive ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300',
      pending: isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300',
      hutang: isActive ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300',
      cicilan: isActive ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300',
    };
    return colors[status] || colors.lunas;
  };

  const canSubmit = () => {
    if (customerInfoMissing) return false;
    if (dueDateMissing) return false;
    if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-4">Pembayaran</h3>

        <div className="bg-primary-50 rounded-xl p-4 mb-6 text-center">
          <div className="text-sm text-primary-600">Total Bayar</div>
          <div className="text-3xl font-bold text-primary-700">{formatCurrency(total)}</div>
        </div>

        {/* Payment Status Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_STATUSES.map(status => (
              <button
                key={status.value}
                onClick={() => setPaymentStatus(status.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${getStatusColor(status.value, paymentStatus === status.value)}`}
              >
                <div>{status.label}</div>
                <div className="text-xs opacity-75">{status.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer info warning for non-lunas */}
        {customerInfoMissing && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-yellow-700">
                <strong>Info Pembeli Wajib</strong>
                <p className="mt-0.5">Untuk pembayaran {PAYMENT_STATUSES.find(s => s.value === paymentStatus)?.label}, nama pembeli wajib diisi. Tutup modal ini dan isi di bagian "Info Pembeli".</p>
              </div>
            </div>
          </div>
        )}

        {/* Due Date for Hutang */}
        {paymentStatus === 'hutang' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Jatuh Tempo <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}

        {/* Initial Payment for Cicilan/Hutang */}
        {(paymentStatus === 'cicilan' || paymentStatus === 'hutang') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pembayaran Awal (DP) <span className="text-gray-400 text-xs">- opsional</span>
            </label>
            <input
              type="number"
              className="input-field"
              value={initialPayment}
              onChange={e => setInitialPayment(e.target.value)}
              placeholder="0"
              min="0"
              max={total}
            />
            {dpAmount > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Sisa tagihan: <span className="font-semibold text-orange-600">{formatCurrency(total - dpAmount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment Notes */}
        {paymentStatus !== 'lunas' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Pembayaran</label>
            <textarea
              className="input-field resize-none"
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>
        )}

        {/* Payment Method - only for lunas or when making initial payment */}
        {(paymentStatus === 'lunas' || dpAmount > 0) && (
          <>
            <div className="flex gap-2 mb-4">
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

            {paymentStatus === 'lunas' && paymentMethod === 'cash' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label>
                  <input
                    type="number"
                    className="input-field text-xl font-bold text-center"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmountPaid(String(amt))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>

                {paid > 0 && (
                  <div className={`rounded-xl p-4 mb-4 text-center ${change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? 'Kembalian' : 'Kurang'}
                    </div>
                    <div className={`text-2xl font-bold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(Math.abs(change))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Summary for non-lunas */}
        {paymentStatus !== 'lunas' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Tagihan</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              {dpAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pembayaran Awal</span>
                  <span className="font-medium text-green-600">-{formatCurrency(dpAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Sisa Tagihan</span>
                <span className="font-bold text-orange-600">{formatCurrency(total - dpAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="btn-success flex-1 py-3 text-lg font-bold"
          >
            {paymentStatus === 'lunas' ? 'Bayar' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
