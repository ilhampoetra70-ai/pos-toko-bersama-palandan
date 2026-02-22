import { useState, useEffect } from 'react';
import ReceiptIframe from './ReceiptIframe';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Printer, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ReceiptPreviewProps {
    transaction: Partial<Transaction> & { invoice_number: string };
    onClose: () => void;
}

export default function ReceiptPreview({ transaction, onClose }: ReceiptPreviewProps) {
    const [html, setHtml] = useState('');
    const [printing, setPrinting] = useState(false);
    const [printStatus, setPrintStatus] = useState<'success' | 'error' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPreview();
    }, [transaction]);

    const loadPreview = async () => {
        setLoading(true);
        try {
            let tx: any = transaction;
            if (transaction.id) {
                const response = await window.api.getTransactionById(transaction.id);
                if (response) tx = response;
            }
            const result = await window.api.getReceiptHTML(tx);
            setHtml(result);
        } catch (err) {
            console.error('Failed to load receipt preview:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        setPrinting(true);
        setPrintStatus(null);
        try {
            let tx: any = transaction;
            if (transaction.id) {
                const response = await window.api.getTransactionById(transaction.id);
                if (response) tx = response;
            }
            const result = await window.api.printReceipt(tx);
            if (!result.success) {
                setPrintStatus('error');
                alert('Print gagal: ' + (result.error || 'Unknown error'));
                setPrinting(false);
            } else {
                setPrintStatus('success');
                setTimeout(() => {
                    setPrinting(false);
                    setPrintStatus(null);
                }, 2000);
            }
        } catch (err) {
            console.error('Print error:', err);
            setPrinting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-gray-950 border-none shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="p-8 border-b dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                            <Printer className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">
                                Pratinjau Struk
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                                Invoice {transaction.invoice_number}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 bg-gray-100/50 dark:bg-gray-900/50 p-8 flex flex-col items-center">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Menyiapkan Tampilan...</p>
                        </div>
                    ) : (
                        <div className="bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ReceiptIframe html={html} width="300px" />
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
                    <div className="flex w-full gap-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={printing}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-none bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Tutup
                        </Button>
                        <Button
                            onClick={handlePrint}
                            disabled={printing || loading}
                            className={cn(
                                "flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-lg transition-all",
                                printStatus === 'success'
                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                    : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
                            )}
                        >
                            {printing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    PROSES...
                                </>
                            ) : printStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    BERHASIL DICETAK
                                </>
                            ) : (
                                <>
                                    <Printer className="w-4 h-4" />
                                    CETAK SEKARANG
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
