import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import { CheckCircle2, Clock, QrCode, Calendar, AlertCircle, Banknote, Info, Loader2 } from 'lucide-react';
import { RetroWallet } from '../components/RetroIcons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PAYMENT_STATUSES = [
    { value: 'lunas', label: 'Lunas', desc: 'Bayar penuh', icon: CheckCircle2 },
    { value: 'pending', label: 'Pending', desc: 'COD/Bayar nanti', icon: Clock },
    { value: 'hutang', label: 'Hutang', desc: 'Kredit + jatuh tempo', icon: AlertCircle },
    { value: 'cicilan', label: 'Cicilan', desc: 'Bayar bertahap', icon: RetroWallet },
] as const;

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

interface PaymentModalProps {
    total: number;
    onConfirm: (data: any) => void;
    onClose: () => void;
    customerName?: string;
    customerAddress?: string;
    isSubmitting?: boolean;
}

export default function PaymentModal({ total, onConfirm, onClose, customerName, customerAddress, isSubmitting = false }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'qris'>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<string>('lunas');
    const [dueDate, setDueDate] = useState('');
    const [initialPayment, setInitialPayment] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [localCustomerName, setLocalCustomerName] = useState(customerName || '');
    const [localCustomerAddress, setLocalCustomerAddress] = useState(customerAddress || '');
    const [errorMessage, setErrorMessage] = useState('');

    const paid = parseInt(amountPaid) || 0;
    const change = paid - total;
    const dpAmount = parseInt(initialPayment) || 0;

    const requiresCustomerInfo = paymentStatus !== 'lunas';
    const hasCustomerInfo = localCustomerName && localCustomerName.trim().length > 0;
    const customerInfoMissing = requiresCustomerInfo && !hasCustomerInfo;
    const requiresDueDate = paymentStatus === 'hutang';
    const dueDateMissing = requiresDueDate && !dueDate;
    const isLunasCash = paymentStatus === 'lunas' && paymentMethod === 'cash';
    const showNumpad = isLunasCash || paymentStatus !== 'lunas';

    const quickAmounts = [
        total,
        Math.ceil(total / 10000) * 10000,
        Math.ceil(total / 50000) * 50000,
        Math.ceil(total / 100000) * 100000,
    ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4);

    const handleNumpadPress = (key: string) => {
        const setter = isLunasCash ? setAmountPaid : setInitialPayment;
        setter(prev => {
            if (key === '⌫') return prev.slice(0, -1);
            if (key === '000') return prev === '' ? '' : prev + '000';
            const next = prev + key;
            const num = parseInt(next);
            return isNaN(num) ? '' : String(num);
        });
    };

    const numpadValue = isLunasCash ? paid : dpAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (customerInfoMissing) {
            setErrorMessage('Untuk pembayaran non-lunas, Nama Pembeli wajib diisi');
            return;
        }
        if (dueDateMissing) {
            setErrorMessage('Tanggal jatuh tempo wajib diisi untuk pembayaran hutang');
            return;
        }
        if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return;
        if ((paymentStatus === 'cicilan' || paymentStatus === 'hutang') && dpAmount > total) {
            setErrorMessage('Pembayaran awal tidak boleh melebihi total');
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

    const canSubmit = () => {
        if (isSubmitting) return false;
        if (customerInfoMissing) return false;
        if (dueDateMissing) return false;
        if (paymentStatus === 'lunas' && paymentMethod === 'cash' && paid < total) return false;
        return true;
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-[96vw] max-w-[1400px] max-h-[99vh] p-0 gap-0 overflow-hidden flex flex-col bg-card dark:bg-background shadow-2xl">
                <DialogHeader className="p-5 pb-3 border-b dark:border-border shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <RetroWallet className="w-5 h-5" />
                        Pembayaran
                    </DialogTitle>
                    <DialogDescription>Pilih metode pembayaran dan selesaikan transaksi</DialogDescription>
                </DialogHeader>

                {/* Two-column body */}
                <div className="flex-1 flex min-h-0 overflow-hidden">

                    {/* Left: form fields */}
                    <div className="flex-1 overflow-y-auto bg-background/30 dark:bg-background/10">
                        <form id="payment-form" onSubmit={handleSubmit} className="p-5 space-y-4">

                            {errorMessage && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Status pembayaran */}
                            <div className="space-y-2.5">
                                <Label className="text-sm font-bold opacity-80 pl-1">Status Pembayaran</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_STATUSES.map(status => (
                                        <button type="button" key={status.value}
                                            onClick={() => setPaymentStatus(status.value)}
                                            className={cn(
                                                "relative py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all text-left flex flex-col gap-0.5",
                                                paymentStatus === status.value
                                                    ? (status.value === 'lunas' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30' :
                                                        status.value === 'pending' ? 'border-primary bg-primary text-primary-foreground dark:bg-primary/30' :
                                                            status.value === 'hutang' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30' :
                                                                'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30')
                                                    : "border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:border-border dark:hover:border-gray-700"
                                            )}>
                                            <div className="flex items-center gap-1.5">
                                                <status.icon className="w-3.5 h-3.5 shrink-0" />
                                                <span className="text-xs leading-none">{status.label}</span>
                                            </div>
                                            <div className="text-[10px] opacity-60 font-normal leading-tight truncate">{status.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info pembeli */}
                            <div className="space-y-2 bg-background dark:bg-card/50 p-2.5 rounded-xl border dark:border-border">
                                <div className="flex items-center gap-1.5 text-primary-700 dark:text-primary-400 pl-0.5">
                                    <Info className="w-3 h-3" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Info Pembeli</h4>
                                    {!requiresCustomerInfo && (
                                        <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-normal normal-case tracking-normal">(opsional)</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="cust-name" className="text-[10px]">
                                            Nama Pembeli
                                            {requiresCustomerInfo && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        <Input id="cust-name"
                                            placeholder={requiresCustomerInfo ? "Wajib diisi..." : "Nama (opsional)..."}
                                            value={localCustomerName}
                                            onChange={e => setLocalCustomerName(e.target.value.toUpperCase())}
                                            className="h-8 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cust-addr" className="text-[10px]">Alamat</Label>
                                        <Input id="cust-addr"
                                            placeholder="Alamat (opsional)..."
                                            value={localCustomerAddress}
                                            onChange={e => setLocalCustomerAddress(e.target.value.toUpperCase())}
                                            className="h-8 text-xs" />
                                    </div>
                                </div>
                            </div>

                            {/* Jatuh tempo */}
                            {paymentStatus === 'hutang' && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="due-date">Tanggal Jatuh Tempo <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="due-date" type="date" className="pl-9 h-10"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            min={new Date().toISOString().slice(0, 10)} />
                                    </div>
                                </div>
                            )}

                            {/* DP */}
                            {(paymentStatus === 'cicilan' || paymentStatus === 'hutang') && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="initial-pay">Pembayaran Awal (DP)</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="initial-pay" type="number" className="pl-9 h-10"
                                            value={initialPayment}
                                            onChange={e => setInitialPayment(e.target.value)}
                                            placeholder="0" min="0" max={total} />
                                    </div>
                                    {dpAmount > 0 && (
                                        <div className="text-sm bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-400 p-2 rounded-lg font-medium flex justify-between items-center">
                                            <span>Sisa tagihan:</span>
                                            <span className="font-bold">{formatCurrency(total - dpAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Catatan kasir */}
                            <div className="space-y-1">
                                <Label htmlFor="pay-notes" className="text-xs">Catatan Kasir</Label>
                                <textarea id="pay-notes"
                                    className="w-full border dark:border-border dark:bg-background rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none dark:text-foreground h-14"
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="Catatan untuk struk (opsional)..." />
                            </div>

                            {/* Metode pembayaran */}
                            {(paymentStatus === 'lunas' || dpAmount > 0) && (
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-bold opacity-80 pl-1">Metode Pembayaran</Label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'cash', label: 'Tunai', icon: RetroWallet },
                                            { id: 'debit', label: 'Debit', icon: RetroWallet },
                                            { id: 'qris', label: 'QRIS', icon: QrCode }
                                        ].map(method => (
                                            <button key={method.id} type="button"
                                                onClick={() => setPaymentMethod(method.id as any)}
                                                className={cn(
                                                    "flex-1 py-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                    paymentMethod === method.id
                                                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                                        : "border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:border-border dark:hover:border-gray-700"
                                                )}>
                                                <method.icon className="w-4 h-4" />
                                                <span className="text-[10px] font-bold">{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Non-lunas summary */}
                            {paymentStatus !== 'lunas' && (
                                <div className="bg-background dark:bg-card rounded-2xl p-4 space-y-3 border dark:border-border">
                                    <div className="text-sm space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground dark:text-muted-foreground font-medium">Total Tagihan</span>
                                            <span className="font-bold">{formatCurrency(total)}</span>
                                        </div>
                                        {dpAmount > 0 && (
                                            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                                <span className="font-medium">Pembayaran Awal</span>
                                                <span className="font-bold">-{formatCurrency(dpAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t dark:border-border">
                                            <span className="text-foreground dark:text-foreground font-bold">Sisa Tagihan</span>
                                            <span className="text-xl font-black text-orange-600 dark:text-orange-400">{formatCurrency(total - dpAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="h-2" />
                        </form>
                    </div>

                    {/* Right: total + numpad */}
                    <div className="w-[480px] shrink-0 border-l dark:border-border flex flex-col">

                        {/* Total bayar */}
                        <div className="p-4 border-b dark:border-border text-center bg-primary-50 dark:bg-primary-900/40">
                            <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Total Bayar</div>
                            <div className="text-4xl font-black text-primary-700 dark:text-primary-300">{formatCurrency(total)}</div>
                        </div>

                        {showNumpad ? (
                            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">

                                {/* Amount display */}
                                <div className="bg-muted dark:bg-card rounded-xl px-4 py-2.5 border dark:border-border text-right">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                                        {isLunasCash ? 'Jumlah Bayar' : 'Pembayaran Awal (DP)'}
                                    </div>
                                    <div className="text-4xl font-black tabular-nums text-foreground dark:text-white min-h-[2.5rem] truncate">
                                        {numpadValue > 0 ? formatCurrency(numpadValue) : <span className="text-muted-foreground dark:text-muted-foreground">Rp 0</span>}
                                    </div>
                                </div>

                                {/* Quick amounts — hanya untuk lunas cash */}
                                {isLunasCash && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {quickAmounts.map(amt => (
                                            <button key={amt} type="button"
                                                onClick={() => setAmountPaid(String(amt))}
                                                className="py-1.5 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/40 text-primary-700 dark:text-primary-400 rounded-lg text-[9px] font-bold transition-all border border-primary/20 dark:border-primary/30 leading-tight">
                                                {formatCurrency(amt)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Numpad */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    {NUMPAD_KEYS.map(key => (
                                        <button key={key} type="button"
                                            onClick={() => handleNumpadPress(key)}
                                            className={cn(
                                                "h-[72px] rounded-xl font-black text-2xl transition-all active:scale-95 select-none",
                                                key === '⌫'
                                                    ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                                                    : "bg-card dark:bg-card hover:bg-background dark:hover:bg-muted border border-border dark:border-border text-foreground dark:text-white shadow-sm",
                                                key === '000' ? 'text-sm' : ''
                                            )}>
                                            {key}
                                        </button>
                                    ))}
                                </div>

                                {/* Kembalian (lunas cash) atau Sisa tagihan (non-lunas) */}
                                {isLunasCash ? (
                                    <div className={cn(
                                        "rounded-xl p-3 text-center border transition-all",
                                        paid === 0
                                            ? "bg-background dark:bg-card/50 border-border dark:border-border"
                                            : change >= 0
                                                ? "bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50"
                                                : "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50"
                                    )}>
                                        <div className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                                            paid === 0 ? 'text-muted-foreground' : change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        )}>
                                            {paid === 0 ? 'Kembalian' : change >= 0 ? 'Kembalian' : 'Kurang'}
                                        </div>
                                        <div className={cn(
                                            "text-3xl font-black tabular-nums",
                                            paid === 0 ? 'text-muted-foreground dark:text-muted-foreground' : change >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                        )}>
                                            {paid === 0 ? formatCurrency(0) : formatCurrency(Math.abs(change))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl p-3 text-center border bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30">
                                        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-orange-600 dark:text-orange-400">
                                            Sisa Tagihan
                                        </div>
                                        <div className="text-3xl font-black tabular-nums text-orange-700 dark:text-orange-300">
                                            {formatCurrency(total - dpAmount)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center space-y-2">
                                    {paymentMethod === 'debit' && <RetroWallet className="w-10 h-10 mx-auto text-primary-400 opacity-50" />}
                                    {paymentMethod === 'qris' && <QrCode className="w-10 h-10 mx-auto text-primary-400 opacity-50" />}
                                    {paymentStatus !== 'lunas' && <Banknote className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />}
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                                        {paymentStatus !== 'lunas' ? 'Transaksi dicatat' : 'Konfirmasi pembayaran'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-border bg-background dark:bg-background shrink-0">
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 text-sm font-bold">
                            Batal
                        </Button>
                        <Button type="submit" form="payment-form" disabled={!canSubmit()}
                            className={cn(
                                "flex-[2] h-11 text-base font-black shadow-lg",
                                paymentStatus === 'lunas'
                                    ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                                    : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
                            )}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                </span>
                            ) : (
                                paymentStatus === 'lunas' ? 'Bayar Sekarang' : 'Simpan Transaksi'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
