import { Button } from '@/components/ui/button';
import { X, Printer, Save, FileText, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlainReportPreviewModalProps {
    text: string;
    onClose: () => void;
    onPrint?: () => void;
    onSave?: () => void;
}

export default function PlainReportPreviewModal({ text, onClose, onPrint, onSave }: PlainReportPreviewModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col z-50 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-8 py-5 flex items-center justify-between shrink-0 shadow-lg z-10">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                            <FileCode className="w-6 h-6 text-primary-600" />
                        </div>
                        Preview Dot Matrix
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    {onPrint && (
                        <Button
                            onClick={onPrint}
                            variant="outline"
                            className="h-12 px-6 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            CETAK DATA
                        </Button>
                    )}

                    {onSave && (
                        <Button
                            onClick={onSave}
                            className="h-12 px-6 bg-primary-600 hover:bg-primary-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-600/20 text-white flex items-center gap-2 rounded-2xl"
                        >
                            <Save className="w-4 h-4" />
                            SIMPAN .TXT
                        </Button>
                    )}

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1" />

                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group font-black"
                    >
                        <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-gray-500/20 dark:bg-gray-900/50 p-10 flex items-start justify-center backdrop-blur-md">
                <div className="bg-white dark:bg-gray-950 p-12 shadow-[0_30px_60px_rgba(0,0,0,0.3)] rounded-2xl min-w-[600px] max-w-4xl border dark:border-gray-800">
                    <pre className="font-mono text-sm leading-tight text-gray-900 dark:text-gray-100 whitespace-pre overflow-x-auto">
                        {text}
                    </pre>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-6 py-3 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                    Format: Plain Text | Lebar: 80 Karakter (Standard Dot Matrix)
                </span>
            </div>
        </div>
    );
}
