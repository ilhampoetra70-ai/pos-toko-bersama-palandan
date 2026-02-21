import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import {
    CheckCircle2,
    Clock,
    CreditCard,
    Wallet,
    QrCode,
    User as UserIcon,
    Calendar,
    AlertCircle,
    Banknote,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PAYMENT_STATUSES = [
    { value: 'lunas', label: 'Lunas', desc: 'Bayar penuh', icon: CheckCircle2, color: 'green' },
    { value: 'pending', label: 'Pending', desc: 'COD/Bayar nanti', icon: Clock, color: 'blue' },
    { value: 'hutang', label: 'Hutang', desc: 'Kredit + jatuh tempo', icon: AlertCircle, color: 'orange' },
    { value: 'cicilan', label: 'Cicilan', desc: 'Bayar bertahap', icon: CreditCard, color: 'purple' },
] as const;

interface PaymentModalProps {
    total: number;
    onConfirm: (data: any) => void;
    onClose: () => void;
    customerName?: string;
    customerAddress?: string;
}

export default function PaymentModal({ total, onConfirm, onClose, customerName, customerAddress }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'qris'>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<string>('lunas');
    const [dueDate, setDueDate] = useState('');
    const [initialPayment, setInitialPayment] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const [localCustomerName, setLocalCustomerName] = useState(customerName || '');
    const [localCustomerAddress, setLocalCustomerAddress] = useState(customerAddress || '');

    const paid = parseInt(amountPaid) || 0;
    const change = paid - total;
    const dpAmount = parseInt(initialPayment) || 0;

    const requiresCustomerInfo = paymentStatus !== 'lunas';
    const hasCustomerInfo = localCustomerName && localCustomerName.trim().length > 0;
    const customerInfoMissing = requiresCustomerInfo && !hasCustomerInfo;

    const requiresDueDate = paymentStatus === 'hutang';
    const dueDateMissing = requiresDueDate && !dueDate;

    const quickAmounts = [
        total,
        Math.ceil(total / 10000) * 10000,
        Math.ceil(total / 50000) * 50000,
        Math.ceil(total / 100000) * 100000,
    ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customerInfoMissing) {
            alert('Untuk pembayaran non-lunas, Nama Pembeli wajib diisi');
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
            customer_name: localCustomerName,
            customer_address: localCustomerAddress
        });
    };

    const getStatusClasses = (status: string, isActive: boolean) => {
        const activeClasses = {
            lunas: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400',
            pending: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
            hutang: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
            cicilan: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-400',
        } as Record<string, string>;

        return cn(
            "relative py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all text-left flex flex-col gap-1",
            isActive
                ? activeClasses[status]
                : "border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
        );
    };

    const canSubmit = () => {
        if (customerInfoMissing) return false;
        if (dueDateMissing) return false;
        if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return false;
        return true;
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg h-auto max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-gray-950 shadow-2xl">
                <DialogHeader className="p-5 pb-3 border-b dark:border-gray-800 shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Pembayaran
                    </DialogTitle>
                    <DialogDescription>Pilih metode pembayaran dan selesaikan transaksi</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/30 dark:bg-gray-900/10">
                    <form id="payment-form" onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div className="bg-primary-50 dark:bg-primary-900/40 rounded-2xl p-4 text-center border border-primary-100 dark:border-primary-800/50 shadow-inner">
                            <div className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-0.5">Total Bayar</div>
                            <div className="text-2xl font-black text-primary-700 dark:text-primary-300">{formatCurrency(total)}</div>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-sm font-bold opacity-80 pl-1">Status Pembayaran</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_STATUSES.map(status => (
                                    <button
                                        type="button"
                                        key={status.value}
                                        onClick={() => setPaymentStatus(status.value)}
                                        className={cn(
                                            "relative py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all text-left flex flex-col gap-0.5",
                                            paymentStatus === status.value
                                                ? (status.value === 'lunas' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30' :
                                                    status.value === 'pending' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30' :
                                                        status.value === 'hutang' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30' :
                                                            'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30')
                                                : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 ring-offset-background">
                                            <status.icon className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-xs leading-none">{status.label}</span>
                                        </div>
                                        <div className="text-[10px] opacity-60 font-normal leading-tight truncate">{status.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {requiresCustomerInfo && (
                            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-2xl border dark:border-gray-800 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400 pl-1">
                                    <Info className="w-3.5 h-3.5" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Info Pembeli</h4>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="space-y-1">
                                        <Label htmlFor="cust-name" className="text-xs">Nama Pembeli</Label>
                                        <Input
                                            id="cust-name"
                                            placeholder="Wajib diisi..."
                                            value={localCustomerName}
                                            onChange={e => setLocalCustomerName(e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cust-addr" className="text-xs">Alamat</Label>
                                        <textarea
                                            id="cust-addr"
                                            className="w-full border dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none dark:text-gray-200 h-16"
                                            placeholder="Alamat penagihan/tujuan..."
                                            value={localCustomerAddress}
                                            onChange={e => setLocalCustomerAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentStatus === 'hutang' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="due-date">Tanggal Jatuh Tempo <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="due-date"
                                        type="date"
                                        className="pl-9 h-10"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                    />
                                </div>
                            </div>
                        )}

                        {(paymentStatus === 'cicilan' || paymentStatus === 'hutang') && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="initial-pay">Pembayaran Awal (DP)</Label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="initial-pay"
                                        type="number"
                                        className="pl-9 h-10"
                                        value={initialPayment}
                                        onChange={e => setInitialPayment(e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        max={total}
                                    />
                                </div>
                                {dpAmount > 0 && (
                                    <div className="text-sm bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-400 p-2 rounded-lg font-medium flex justify-between items-center">
                                        <span>Sisa tagihan:</span>
                                        <span className="font-bold">{formatCurrency(total - dpAmount)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="pay-notes" className="text-xs">Catatan Kasir</Label>
                            <textarea
                                id="pay-notes"
                                className="w-full border dark:border-gray-700 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none dark:text-gray-200 h-14"
                                value={paymentNotes}
                                onChange={e => setPaymentNotes(e.target.value)}
                                placeholder="Catatan untuk struk (opsional)..."
                            />
                        </div>

                        {(paymentStatus === 'lunas' || dpAmount > 0) && (
                            <div className="space-y-3 pt-1">
                                <Label className="text-sm font-bold opacity-80 pl-1">Metode Pembayaran</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'cash', label: 'Tunai', icon: Wallet },
                                        { id: 'debit', label: 'Debit', icon: CreditCard },
                                        { id: 'qris', label: 'QRIS', icon: QrCode }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                paymentMethod === method.id
                                                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                                    : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700"
                                            )}
                                        >
                                            <method.icon className="w-4 h-4" />
                                            <span className="text-[10px] font-bold">{method.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {paymentStatus === 'lunas' && paymentMethod === 'cash' && (
                                    <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Jumlah Bayar</Label>
                                            <Input
                                                type="number"
                                                className="h-11 text-xl font-black text-center"
                                                value={amountPaid}
                                                onChange={e => setAmountPaid(e.target.value)}
                                                placeholder="0"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {quickAmounts.map(amt => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => setAmountPaid(String(amt))}
                                                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:border-gray-700 rounded-lg text-[10px] font-bold transition-all grow"
                                                >
                                                    {formatCurrency(amt)}
                                                </button>
                                            ))}
                                        </div>

                                        {paid > 0 && (
                                            <div className={cn(
                                                "rounded-xl p-3 text-center shadow-sm border",
                                                change >= 0
                                                    ? "bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50"
                                                    : "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50"
                                            )}>
                                                <div className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                                    {change >= 0 ? 'Kembalian' : 'Kurang'}
                                                </div>
                                                <div className={cn("text-xl font-black", change >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
                                                    {formatCurrency(Math.abs(change))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {paymentStatus !== 'lunas' && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 space-y-3 border dark:border-gray-800">
                                <div className="text-sm space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Total Tagihan</span>
                                        <span className="font-bold">{formatCurrency(total)}</span>
                                    </div>
                                    {dpAmount > 0 && (
                                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                            <span className="font-medium">Pembayaran Awal</span>
                                            <span className="font-bold">-{formatCurrency(dpAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
                                        <span className="text-gray-900 dark:text-gray-200 font-bold">Sisa Tagihan</span>
                                        <span className="text-xl font-black text-orange-600 dark:text-orange-400">{formatCurrency(total - dpAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="h-4"></div>
                    </form>
                </div>

                <div className="p-5 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 text-sm font-bold">
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="payment-form"
                            disabled={!canSubmit()}
                            className={cn(
                                "flex-[1.5] h-11 text-base font-black shadow-lg",
                                paymentStatus === 'lunas'
                                    ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                                    : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
                            )}
                        >
                            {paymentStatus === 'lunas' ? 'Bayar Sekarang' : 'Simpan Transaksi'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
