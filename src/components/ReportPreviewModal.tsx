import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer, FileDown, Maximize, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ZOOM_LEVELS = [
    { value: 'fit', label: 'Sesuaikan' },
    { value: 100, label: '100%' },
    { value: 150, label: '150%' },
] as const;

type ZoomLevel = typeof ZOOM_LEVELS[number]['value'];

interface ReportPreviewModalProps {
    html: string;
    onClose: () => void;
    onPrint: () => Promise<void>;
    onDownloadPdf: () => Promise<void>;
}

export default function ReportPreviewModal({ html, onClose, onPrint, onDownloadPdf }: ReportPreviewModalProps) {
    const [zoom, setZoom] = useState<ZoomLevel | number>('fit');
    const [printing, setPrinting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // A4 dimensions in pixels at 96 DPI
    const A4_WIDTH = 794; // 210mm
    const A4_HEIGHT = 1123; // 297mm

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const getScale = () => {
        if (zoom === 'fit' && containerSize.width > 0) {
            const availableWidth = containerSize.width - 48; // padding
            const availableHeight = containerSize.height - 48;
            const scaleX = availableWidth / A4_WIDTH;
            const scaleY = availableHeight / A4_HEIGHT;
            return Math.min(scaleX, scaleY, 1);
        }
        return (typeof zoom === 'number' ? zoom : 100) / 100;
    };

    const handlePrint = async () => {
        setPrinting(true);
        try {
            await onPrint();
        } finally {
            setPrinting(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await onDownloadPdf();
        } finally {
            setDownloading(false);
        }
    };

    const scale = getScale();

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col z-50 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-8 py-5 flex items-center justify-between shrink-0 shadow-lg z-10">
                <div className="flex items-center gap-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary-600" />
                            </div>
                            Preview Laporan
                        </h2>
                    </div>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-2xl p-1.5 border dark:border-gray-800 shadow-inner">
                        {ZOOM_LEVELS.map(level => (
                            <button
                                key={level.value}
                                onClick={() => setZoom(level.value)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    zoom === level.value
                                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                                )}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handlePrint}
                        disabled={printing || downloading}
                        variant="outline"
                        className="h-12 px-6 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        {printing ? 'MENCETAK...' : 'CETAK LAPORAN'}
                    </Button>

                    <Button
                        onClick={handleDownload}
                        disabled={printing || downloading}
                        className="h-12 px-6 bg-primary-600 hover:bg-primary-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-600/20 text-white flex items-center gap-2 rounded-2xl"
                    >
                        <FileDown className="w-4 h-4 text-white" />
                        {downloading ? 'MENYIMPAN...' : 'DOWNLOAD PDF'}
                    </Button>

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
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-500/20 dark:bg-gray-900/50 p-10 flex items-start justify-center backdrop-blur-md"
            >
                <div
                    className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-transform origin-top"
                    style={{
                        width: A4_WIDTH,
                        height: A4_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        srcDoc={html}
                        title="Report Preview"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-same-origin allow-scripts"
                    />
                </div>
            </div>

            {/* Footer info */}
            <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-6 py-3 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                    A4 Document Format • Render Zoom: {zoom === 'fit' ? `${Math.round(scale * 100)}%` : `${zoom}%`}
                </span>
            </div>
        </div>
    );
}
