import { useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, X, Loader2, ArrowRight, ShieldAlert, Info } from 'lucide-react';
import { RetroAlert } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExcelManagerProps {
    onClose: () => void;
}

interface ImportPreview {
    fileName: string;
    newProducts: any[];
    needBarcode: any[];
    existingProducts: { name: string; reason: string }[];
    invalidRows: { row: number; reason: string }[];
}

export default function ExcelManager({ onClose }: ExcelManagerProps) {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [confirming, setConfirming] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        setResult(null);
        const res = await window.api.exportProducts();
        if (res.success) {
            setResult({ type: 'success', message: `Berhasil export ke: ${res.path}` });
        } else if (res.error !== 'Cancelled') {
            setResult({ type: 'error', message: `Export gagal: ${res.error}` });
        }
        setExporting(false);
    };

    const handleImport = async () => {
        setImporting(true);
        setResult(null);
        setPreview(null);

        const res = await window.api.previewImport();
        setImporting(false);

        if (res.error === 'Cancelled') return;

        if (!res.success) {
            setResult({ type: 'error', message: `Import gagal: ${res.error}` });
            return;
        }

        setPreview(res.preview);
    };

    const handleConfirmImport = async () => {
        if (!preview) return;

        setConfirming(true);
        const res = await window.api.confirmImport({
            newProducts: preview.newProducts,
            needBarcode: preview.needBarcode
        });
        setConfirming(false);

        if (res.success) {
            const msg = [];
            if (res.withBarcode > 0) msg.push(`${res.withBarcode} dengan barcode`);
            if (res.autoBarcode > 0) msg.push(`${res.autoBarcode} barcode baru`);
            setResult({
                type: 'success',
                message: `Berhasil import ${res.created} produk (${msg.join(', ')})`
            });
        } else {
            setResult({ type: 'error', message: `Import gagal: ${res.error}` });
        }
        setPreview(null);
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        setResult(null);
        const res = await window.api.exportTemplate();
        if (res.success) {
            setResult({ type: 'success', message: `Template disimpan: ${res.path}` });
        } else if (res.error !== 'Cancelled') {
            setResult({ type: 'error', message: `Gagal: ${res.error}` });
        }
        setDownloadingTemplate(false);
    };

    const totalToImport = preview ? preview.newProducts.length + preview.needBarcode.length : 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-card dark:bg-background rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b dark:border-border flex items-center justify-between bg-background dark:bg-background">
                    <div>
                        <h3 className="font-black text-xl text-foreground dark:text-foreground uppercase tracking-tight">Eksper / Impor Excel</h3>
                        <p className="text-xs text-muted-foreground font-medium">Pengolahan data produk massal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {result && (
                        <div className={cn(
                            "p-4 rounded-2xl flex items-center gap-3 border shadow-sm animate-in slide-in-from-top-2",
                            result.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400" : "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
                        )}>
                            {result.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <RetroAlert className="w-5 h-5 flex-shrink-0" />}
                            <span className="text-xs font-bold">{result.message}</span>
                        </div>
                    )}

                    {preview ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <div className="bg-primary-50 dark:bg-primary-950/30 border-2 border-primary-100 dark:border-primary-900/50 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <FileSpreadsheet className="w-6 h-6 text-primary-600" />
                                    <h4 className="font-black uppercase tracking-tight text-primary-700">Preview Impor</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-card dark:bg-background p-4 rounded-xl border dark:border-border shadow-sm text-center">
                                        <div className="text-3xl font-black text-emerald-600">{preview.newProducts.length}</div>
                                        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Produk Baru</div>
                                    </div>
                                    <div className="bg-card dark:bg-background p-4 rounded-xl border dark:border-border shadow-sm text-center">
                                        <div className="text-3xl font-black text-primary">{preview.needBarcode.length}</div>
                                        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Auto Barcode</div>
                                    </div>
                                </div>
                            </div>

                            {preview.existingProducts.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex gap-4">
                                    <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-amber-700 uppercase tracking-tight">{preview.existingProducts.length} PRODUK DILEWATI</p>
                                        <p className="text-[10px] font-bold text-amber-600 leading-relaxed uppercase tracking-widest">Produk sudah ada di database dan tidak akan ditimpa.</p>
                                    </div>
                                </div>
                            )}

                            {preview.invalidRows.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-2xl p-4 flex gap-4">
                                    <RetroAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-red-700 uppercase tracking-tight">{preview.invalidRows.length} BARIS TIDAK VALID</p>
                                        <p className="text-[10px] font-bold text-red-600 leading-relaxed uppercase tracking-widest">Ada kesalahan data pada {preview.invalidRows.length} baris di file Excel Anda.</p>
                                        <div className="pt-2">
                                            {preview.invalidRows.slice(0, 3).map((r, i) => (
                                                <div key={i} className="text-[9px] font-mono text-red-500 bg-card/50 dark:bg-black/20 px-2 py-1 rounded mt-1">Baris {r.row}: {r.reason}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" onClick={() => setPreview(null)} disabled={confirming} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs">Batal</Button>
                                <Button onClick={handleConfirmImport} disabled={confirming || totalToImport === 0} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 shadow-lg">
                                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {confirming ? 'PROSES...' : `IMPOR ${totalToImport} PRODUK`}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Card className="border-none bg-primary-600 text-white shadow-lg shadow-primary-600/20 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <Download className="w-5 h-5 shadow-sm" /> Unduh Template
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs font-bold leading-relaxed opacity-90 uppercase tracking-tight">Unduh file Excel master sebagai panduan format impor data produk massal.</p>
                                    <Button
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadingTemplate}
                                        className="w-full bg-card text-primary-600 hover:bg-card/90 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm"
                                    >
                                        {downloadingTemplate ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                        Download Template Master
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-none shadow-sm bg-background dark:bg-background rounded-2xl flex flex-col justify-between">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ekspor Data</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-6">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Simpan semua produk Anda ke dalam format .xlsx</p>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] border-none bg-card dark:bg-card shadow-sm gap-2">
                                            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                            Export Excel
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl flex flex-col justify-between border-l-4 border-l-emerald-500">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600">Impor Produk</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-6">
                                        <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest leading-relaxed">Tambah ribuan produk sekaligus dari file Excel.</p>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button onClick={handleImport} disabled={importing} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-600/10">
                                            {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                                            Pilih File
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>

                            <div className="p-4 bg-background/50 dark:bg-background/50 rounded-2xl border dark:border-border space-y-3">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary-500" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Informasi Impor</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Kolom "Barcode" wajib diisi</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Baris dengan barcode ganda akan dilewati</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        <span className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">Disarankan maksimal 1000 baris per file</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!preview && (
                    <div className="p-6 border-t dark:border-border bg-background dark:bg-background">
                        <Button variant="ghost" onClick={onClose} className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all">
                            Tutup Window
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
