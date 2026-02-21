import { useState, useEffect } from 'react';
import ReportPreviewModal from './ReportPreviewModal';
import PlainReportPreviewModal from './PlainReportPreviewModal';
import { Button } from '@/components/ui/button';
import {
    Printer,
    FileText,
    FileCode,
    Monitor,
    Save,
    X,
    Loader2,
    Settings2,
    BookOpen,
    ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface PrinterInfo {
    name: string;
}

interface PrintConfigModalProps {
    onClose: () => void;
    onExportPdf: () => Promise<boolean>;
    onPrintText: (printerName: string) => void;
    onSaveText: () => void;
    getReportHtml?: () => string | null;
    getReportText?: () => string | null;
    includeStockTrail: boolean;
    onToggleStockTrail: (v: boolean) => void;
}

export default function PrintConfigModal({
    onClose,
    onExportPdf,
    onPrintText,
    onSaveText,
    getReportHtml,
    getReportText,
    includeStockTrail,
    onToggleStockTrail
}: PrintConfigModalProps) {
    const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
    const [textAction, setTextAction] = useState<'preview' | 'save' | 'print'>('save');
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showTextPreview, setShowTextPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewText, setPreviewText] = useState('');

    useEffect(() => {
        if (mode === 'text' && textAction === 'print') {
            setLoadingPrinters(true);
            (window as any).api.getPrinters().then((list: PrinterInfo[]) => {
                setPrinters(list || []);
                if (list && list.length > 0) setSelectedPrinter(list[0].name);
            }).finally(() => setLoadingPrinters(false));
        }
    }, [mode, textAction]);

    const handleSubmit = () => {
        if (mode === 'pdf') {
            const html = getReportHtml ? getReportHtml() : null;
            if (!html) {
                alert('Tampilkan laporan terlebih dahulu');
                return;
            }
            setPreviewHtml(html);
            setShowPreview(true);
        } else {
            if (textAction === 'preview') {
                const text = getReportText ? getReportText() : null;
                if (!text) {
                    alert('Tampilkan laporan terlebih dahulu');
                    return;
                }
                setPreviewText(text);
                setShowTextPreview(true);
            } else if (textAction === 'save') {
                onSaveText();
                onClose();
            } else {
                onPrintText(selectedPrinter);
                onClose();
            }
        }
    };

    const handlePrintFromPreview = async () => {
        const result = await (window as any).api.printReportHtml(previewHtml);
        if (result && !result.success && result.error !== 'Cancelled') {
            alert('Gagal mencetak: ' + result.error);
        }
    };

    const handleDownloadPdf = async () => {
        const result = await onExportPdf();
        if (result) {
            setShowPreview(false);
            onClose();
        }
    };

    const getButtonLabel = () => {
        if (mode === 'pdf') return 'Preview Laporan';
        if (textAction === 'preview') return 'Preview Teks';
        if (textAction === 'save') return 'Simpan .txt';
        return 'Cetak Sekarang';
    };

    if (showPreview) {
        return (
            <ReportPreviewModal
                html={previewHtml}
                onClose={() => {
                    setShowPreview(false);
                    onClose();
                }}
                onPrint={handlePrintFromPreview}
                onDownloadPdf={handleDownloadPdf}
            />
        );
    }

    if (showTextPreview) {
        return (
            <PlainReportPreviewModal
                text={previewText}
                onClose={() => {
                    setShowTextPreview(false);
                    onClose();
                }}
                onPrint={selectedPrinter ? () => onPrintText(selectedPrinter) : undefined}
                onSave={onSaveText}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 uppercase tracking-tight">Opsi Output Laporan</h3>
                        <p className="text-xs text-gray-500 font-medium">Pilih format pengeluaran data</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <button
                        onClick={() => onToggleStockTrail(!includeStockTrail)}
                        className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all",
                            includeStockTrail
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                                : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                includeStockTrail ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}>
                                <ArrowUpDown className="w-4 h-4" />
                            </div>
                            <div>
                                <p className={cn(
                                    "text-xs font-black uppercase tracking-tight",
                                    includeStockTrail ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500"
                                )}>
                                    Log Mutasi Stok
                                </p>
                                <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                    Restok & penyesuaian, maks. 50 entri
                                </p>
                            </div>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0",
                            includeStockTrail
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        )}>
                            {includeStockTrail ? "Aktif" : "Nonaktif"}
                        </span>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMode('pdf')}
                            className={cn(
                                "p-6 rounded-3xl border-2 text-left transition-all relative group",
                                mode === 'pdf'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 shadow-lg shadow-primary-600/10'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                mode === 'pdf' ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "font-black text-xs uppercase tracking-widest mb-1",
                                mode === 'pdf' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-400'
                            )}>
                                Modern PDF
                            </div>
                            <div className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">Full-color, Grafis, A4 Layout</div>
                        </button>

                        <button
                            onClick={() => setMode('text')}
                            className={cn(
                                "p-6 rounded-3xl border-2 text-left transition-all relative group",
                                mode === 'text'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 shadow-lg shadow-primary-600/10'
                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                mode === 'text' ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}>
                                <FileCode className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "font-black text-xs uppercase tracking-widest mb-1",
                                mode === 'text' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-400'
                            )}>
                                Dot Matrix
                            </div>
                            <div className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">Monospace, 80 Kolom, Teks Murni</div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {mode === 'pdf' ? (
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-6 rounded-3xl flex gap-4">
                                <Monitor className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed uppercase tracking-widest">
                                    Akan menampilkan pratinjau digital dalam format A4. Cocok untuk dokumentasi arsip atau cetak via printer laser/inkjet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Settings2 className="w-4 h-4 text-primary-500" />
                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Pilih Aksi Teks</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'preview', label: 'Lihat Pratinjau Teks', icon: BookOpen },
                                        { id: 'save', label: 'Simpan File .txt', icon: Save },
                                        { id: 'print', label: 'Cetak ke Printer Baris', icon: Printer }
                                    ].map(action => (
                                        <label
                                            key={action.id}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2",
                                                textAction === action.id
                                                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/20"
                                                    : "border-gray-50 dark:border-gray-900 hover:border-gray-100 dark:hover:border-gray-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <action.icon className={cn("w-4 h-4", textAction === action.id ? "text-primary-600" : "text-gray-400")} />
                                                <span className={cn("text-xs font-black uppercase tracking-tight", textAction === action.id ? "text-primary-700 dark:text-primary-400" : "text-gray-500")}>
                                                    {action.label}
                                                </span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="textAction"
                                                value={action.id}
                                                checked={textAction === action.id}
                                                onChange={() => setTextAction(action.id as any)}
                                                className="sr-only"
                                            />
                                            {textAction === action.id && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                        </label>
                                    ))}
                                </div>

                                {textAction === 'print' && (
                                    <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-3xl space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pilih Target Printer</label>
                                        {loadingPrinters ? (
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 italic">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Memuat daftar printer...
                                            </div>
                                        ) : printers.length === 0 ? (
                                            <p className="text-[10px] font-black text-red-500 uppercase">Printer tidak ditemukan</p>
                                        ) : (
                                            <select
                                                value={selectedPrinter}
                                                onChange={e => setSelectedPrinter(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-950 border-none rounded-2xl h-12 text-xs font-black px-4 shadow-sm focus:ring-2 focus:ring-primary-500/20"
                                            >
                                                {printers.map(p => (
                                                    <option key={p.name} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={mode === 'text' && textAction === 'print' && !selectedPrinter}
                        className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-lg shadow-primary-600/20"
                    >
                        {getButtonLabel()}
                    </Button>
                </div>
            </div>
        </div>
    );
}
