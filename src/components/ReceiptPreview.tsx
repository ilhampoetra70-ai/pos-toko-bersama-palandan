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
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { RetroPrinter } from '../components/RetroIcons';
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
    const [printError, setPrintError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPreview();
    }, [transaction]);

    const loadPreview = async () => {
        setLoading(true);
        try {
            // Backend (main.js) sudah mengambil data terbaru sendiri via
            // getTransactionById jika ada id. Tidak perlu fetch dobel di sini.
            const result = await window.api.getReceiptHTML(transaction as any);
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
        setPrintError('');
        try {
            // Backend akan mengambil data terbaru sendiri via getTransactionById.
            // Tidak perlu fetch dobel di frontend.
            const result = await window.api.printReceipt(transaction as any);
            if (!result.success) {
                setPrintStatus('error');
                setPrintError('Print gagal: ' + (result.error || 'Unknown error'));
                setPrinting(false);
            } else {
                setPrintStatus('success');
                setTimeout(() => {
                    setPrinting(false);
                    setPrintStatus(null);
                }, 2000);
            }
        } catch (err: any) {
            // Bug Fix: Sebelumnya exception hanya di-log ke console — user tidak
            // melihat pesan error apapun. Sekarang error ditampilkan ke UI.
            console.error('Print error:', err);
            setPrintStatus('error');
            setPrintError('Print gagal: ' + (err?.message || 'Terjadi kesalahan tidak terduga'));
            setPrinting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-card dark:bg-background border-none shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="p-8 border-b dark:border-border shrink-0 bg-background/50 dark:bg-background/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                            <RetroPrinter className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground dark:text-foreground">
                                Pratinjau Struk
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                                Invoice {transaction.invoice_number}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/50 dark:bg-background/50 p-8 flex flex-col items-center">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Menyiapkan Tampilan...</p>
                        </div>
                    ) : (
                        <div className="bg-card p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ReceiptIframe html={html} width="300px" />
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 border-t dark:border-border bg-card dark:bg-background shrink-0">
                    {printError && (
                        <div className="w-full mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-medium">
                            <span className="shrink-0">⚠</span>
                            <span>{printError}</span>
                        </div>
                    )}
                    <div className="flex w-full gap-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={printing}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-none bg-background dark:bg-background hover:bg-muted dark:hover:bg-card transition-colors"
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
                                    <RetroPrinter className="w-4 h-4" />
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
