import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import { useAddTransactionPayment } from '@/lib/queries';
import { User } from '@/lib/types';

interface AddPaymentModalProps {
    transaction: {
        id: number;
        invoice_number: string;
        customer_name?: string;
        remaining_balance: number;
        [key: string]: any;
    };
    onClose: () => void;
    onPaymentAdded: () => void;
}

export default function AddPaymentModal({ transaction, onClose, onPaymentAdded }: AddPaymentModalProps) {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const addPaymentMutation = useAddTransactionPayment();

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

        setError('');

        try {
            const result = await addPaymentMutation.mutateAsync({
                txId: transaction.id,
                amount: paymentAmount,
                method: paymentMethod,
                userId: (user as User).id,
                notes: notes.trim() || null
            });

            if (result.success) {
                onPaymentAdded();
            } else {
                setError(result.error || 'Gagal menambah pembayaran');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        }
    };

    const isFullPayment = paymentAmount === remainingBalance;
    const loading = addPaymentMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 uppercase tracking-tight">Bayar Piutang</h3>
                        <p className="text-xs text-gray-500 font-medium">Tambah riwayat cicilan atau pelunasan</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Transaction Info */}
                    <div className="bg-primary-50 dark:bg-primary-950/30 rounded-2xl p-4 border border-primary-100 dark:border-primary-900/50 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-0.5">Invoice</div>
                            <div className="font-sans text-primary-700 dark:text-primary-300 font-black">{transaction.invoice_number}</div>
                            {transaction.customer_name && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">{transaction.customer_name}</div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-0.5">Sisa Tagihan</div>
                            <div className="text-xl font-black text-orange-700 dark:text-orange-400">{formatCurrency(remainingBalance)}</div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Metode Pembayaran</label>
                        <div className="flex gap-2">
                            {['cash', 'debit', 'qris'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-tight border-2 transition-all ${paymentMethod === method
                                        ? 'border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                        : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {method === 'cash' ? 'Tunai' : method === 'debit' ? 'Debit' : 'QRIS'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jumlah Pembayaran</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-16 text-2xl font-black text-center text-gray-900 dark:text-gray-100 px-12 shadow-inner focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                min="1"
                                max={remainingBalance}
                                autoFocus
                            />
                            <div className="absolute left-6 top-5 text-gray-400 font-black text-lg">Rp</div>
                        </div>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amt, i) => (
                            <button
                                key={i}
                                onClick={() => setAmount(String(amt))}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${amt === remainingBalance
                                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {amt === remainingBalance ? 'LUNASI' : formatCurrency(amt)}
                            </button>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catatan</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-sm font-medium resize-none shadow-inner"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Tambahkan catatan jika perlu..."
                            rows={2}
                        />
                    </div>

                    {/* Payment Summary */}
                    {paymentAmount > 0 && (
                        <div className={`rounded-2xl p-4 transition-colors ${isFullPayment ? 'bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30' : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30'}`}>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className={isFullPayment ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}>Pembayaran Masuk</span>
                                    <span className="font-black text-gray-900 dark:text-gray-100">{formatCurrency(paymentAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
                                    <span className={isFullPayment ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}>Sisa Piutang Akhir</span>
                                    <span className="font-black text-lg text-gray-900 dark:text-gray-100">{formatCurrency(remainingBalance - paymentAmount)}</span>
                                </div>
                            </div>
                            {isFullPayment && (
                                <div className="mt-3 text-center text-green-700 dark:text-green-400 font-black text-[10px] tracking-widest uppercase animate-pulse">
                                    ✓ TRANKSAKSI AKAN DINYATAKAN LUNAS
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/20 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                            <span className="text-lg">!</span> {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-4">
                    <button onClick={onClose} className="flex-1 h-12 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Tutup
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || paymentAmount <= 0 || paymentAmount > remainingBalance}
                        className={`flex-1 h-12 rounded-2xl font-black text-white shadow-lg transition-all ${isFullPayment ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'} disabled:opacity-50 disabled:grayscale`}
                    >
                        {loading ? 'Memproses...' : isFullPayment ? 'LUNASI TAGIHAN' : 'BAYAR SEKARANG'}
                    </button>
                </div>
            </div>
        </div>
    );
}
