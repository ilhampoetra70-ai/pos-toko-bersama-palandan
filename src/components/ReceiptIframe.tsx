import { useRef, useEffect, useState } from 'react';

interface ReceiptIframeProps {
    html: string;
    width?: string;
}

export default function ReceiptIframe({ html, width = '300px' }: ReceiptIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(300);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        // Reset height when html changes so iframe can recalculate
        setHeight(300);
    }, [html]);

    const handleLoad = () => {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument?.body) return;
        const h = iframe.contentDocument.body.scrollHeight;
        if (h > 0) setHeight(h + 20);
    };

    const zoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
    const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.6));
    const resetZoom = () => setZoom(1);

    return (
        <div className="flex flex-col items-center">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 mb-4 bg-card dark:bg-background rounded-2xl px-3 py-1.5 shadow-sm border dark:border-border">
                <button
                    onClick={zoomOut}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted dark:hover:bg-background text-muted-foreground dark:text-muted-foreground font-black transition-colors"
                    title="Zoom Out"
                >
                    −
                </button>
                <button
                    onClick={resetZoom}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary-600 px-2 transition-colors"
                    title="Reset Zoom"
                >
                    {Math.round(zoom * 100)}%
                </button>
                <button
                    onClick={zoomIn}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted dark:hover:bg-background text-muted-foreground dark:text-muted-foreground font-black transition-colors"
                    title="Zoom In"
                >
                    +
                </button>
            </div>

            {/* Receipt Preview */}
            <div
                className="bg-card mx-auto shadow-sm transition-transform origin-top"
                style={{
                    maxWidth: width,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center'
                }}
            >
                <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    onLoad={handleLoad}
                    sandbox="allow-same-origin"
                    style={{
                        width: '100%',
                        height: `${height}px`,
                        border: 'none',
                        display: 'block',
                        colorScheme: 'light',  // belt-and-suspenders: paksa iframe render light scheme
                    }}
                    title="Receipt Preview"
                />
            </div>
        </div>
    );
}
