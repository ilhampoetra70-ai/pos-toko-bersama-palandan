import { useRef, useEffect, useState } from 'react';

interface ReceiptIframeProps {
    html: string;
    width?: string;
}

export default function ReceiptIframe({ html, width = '300px' }: ReceiptIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(300);
    const [zoom, setZoom] = useState(1);
    const [autoScale, setAutoScale] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            const containerW = entries[0].contentRect.width;
            const targetW = parseInt(width);
            if (containerW > 0 && targetW > 0) {
                // Fit to container dynamically if it's wider than container, minus a tiny padding gap
                const newScale = Math.min(1, (containerW - 10) / targetW);
                setAutoScale(newScale);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [width]);

    useEffect(() => {
        // Reset height when html changes so iframe can recalculate
        setHeight(300);
    }, [html]);

    useEffect(() => {
        const iframe = iframeRef.current;
        const checkHeight = () => {
            if (!iframe?.contentDocument?.documentElement) return;
            const doc = iframe.contentDocument;
            const contentHeight = Math.max(
                doc.body.scrollHeight,
                doc.documentElement.scrollHeight
            );
            if (contentHeight > 0) {
                setHeight(prev => {
                    if (Math.abs(prev - contentHeight) > 5) {
                        return contentHeight;
                    }
                    return prev;
                });
            }
        };

        const interval = setInterval(checkHeight, 300);
        return () => clearInterval(interval);
    }, []);

    const handleLoad = () => {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument?.documentElement) return;
        const h = Math.max(iframe.contentDocument.body.scrollHeight, iframe.contentDocument.documentElement.scrollHeight);
        if (h > 0) setHeight(h);
    };

    const zoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
    const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.6));
    const resetZoom = () => setZoom(1);

    return (
        <div ref={containerRef} className="flex flex-col items-center w-full">
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

            {/* Receipt Preview Container */}
            <div
                className="w-full relative flex justify-center"
                style={{ height: height * zoom * autoScale }}
            >
                <div
                    className="bg-card shadow-sm transition-transform origin-top overflow-hidden absolute top-0"
                    style={{
                        width: width,
                        transform: `scale(${zoom * autoScale})`,
                        transformOrigin: 'top center'
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        srcDoc={html}
                        onLoad={handleLoad}
                        sandbox="allow-same-origin"
                        scrolling="no"
                        style={{
                            width: '100%',
                            height: `${height}px`,
                            border: 'none',
                            display: 'block',
                            overflow: 'hidden',
                            colorScheme: 'light',  // belt-and-suspenders: paksa iframe render light scheme
                        }}
                        title="Receipt Preview"
                    />
                </div>
            </div>
        </div>
    );
}
