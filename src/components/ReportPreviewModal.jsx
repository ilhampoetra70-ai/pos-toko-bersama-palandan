import { useState, useRef, useEffect } from 'react';

const ZOOM_LEVELS = [
  { value: 'fit', label: 'Sesuaikan' },
  { value: 100, label: '100%' },
  { value: 150, label: '150%' },
];

export default function ReportPreviewModal({ html, onClose, onPrint, onDownloadPdf }) {
  const [zoom, setZoom] = useState('fit');
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // A4 dimensions in pixels at 96 DPI
  const A4_WIDTH = 794; // 210mm
  const A4_HEIGHT = 1123; // 297mm

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);

  const getScale = () => {
    if (zoom === 'fit' && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      const containerHeight = containerRef.current.clientHeight - 48;
      const scaleX = containerWidth / A4_WIDTH;
      const scaleY = containerHeight / A4_HEIGHT;
      return Math.min(scaleX, scaleY, 1);
    }
    return (zoom || 100) / 100;
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
    <div className="fixed inset-0 bg-black/70 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold dark:text-gray-100">Preview Laporan</h2>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {ZOOM_LEVELS.map(level => (
              <button
                key={level.value}
                onClick={() => setZoom(level.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  zoom === level.value
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={printing || downloading}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {printing ? 'Mencetak...' : 'Cetak'}
          </button>

          <button
            onClick={handleDownload}
            disabled={printing || downloading}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading ? 'Menyimpan...' : 'Download PDF'}
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-500 dark:bg-gray-900 p-6 flex items-start justify-center"
      >
        <div
          className="bg-white shadow-2xl transition-transform origin-top"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <iframe
            ref={iframeRef}
            title="Report Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-center shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Ukuran kertas: A4 (210 x 297 mm) | Zoom: {zoom === 'fit' ? `${Math.round(scale * 100)}%` : `${zoom}%`}
        </span>
      </div>
    </div>
  );
}
