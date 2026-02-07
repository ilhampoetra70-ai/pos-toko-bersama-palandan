import { useState, useEffect } from 'react';
import ReportPreviewModal from './ReportPreviewModal';

export default function PrintConfigModal({
  onClose,
  onExportPdf,
  onPrintText,
  onSaveText,
  getReportHtml // Function to get report HTML for preview
}) {
  const [mode, setMode] = useState('pdf');
  const [textAction, setTextAction] = useState('save');
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (mode === 'text' && textAction === 'print') {
      setLoadingPrinters(true);
      window.api.getPrinters().then(list => {
        setPrinters(list || []);
        if (list && list.length > 0) setSelectedPrinter(list[0].name);
      }).finally(() => setLoadingPrinters(false));
    }
  }, [mode, textAction]);

  const handleSubmit = () => {
    if (mode === 'pdf') {
      // Show preview instead of direct export
      const html = getReportHtml ? getReportHtml() : null;
      if (!html) {
        alert('Tampilkan laporan terlebih dahulu');
        return;
      }
      setPreviewHtml(html);
      setShowPreview(true);
    } else if (textAction === 'save') {
      onSaveText();
      onClose();
    } else {
      onPrintText(selectedPrinter);
      onClose();
    }
  };

  const handlePrintFromPreview = async () => {
    // Print using browser print
    const result = await window.api.printReportHtml(previewHtml);
    if (result && !result.success && result.error !== 'Cancelled') {
      alert('Gagal mencetak: ' + result.error);
    }
  };

  const handleDownloadPdf = async () => {
    const result = await onExportPdf();
    if (result) {
      // Close preview after successful download
      setShowPreview(false);
      onClose();
    }
  };

  const getButtonLabel = () => {
    if (mode === 'pdf') return 'Preview';
    if (textAction === 'save') return 'Simpan .txt';
    return 'Cetak';
  };

  // Show preview modal if active
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 dark:text-gray-100">Cetak / Export Laporan</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setMode('pdf')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'pdf'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className={`font-semibold text-sm mb-1 ${mode === 'pdf' ? 'text-primary-700 dark:text-primary-400' : 'dark:text-gray-200'}`}>
              Visual (PDF)
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Warna, grafik CSS, layout modern</div>
          </button>
          <button
            onClick={() => setMode('text')}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              mode === 'text'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className={`font-semibold text-sm mb-1 ${mode === 'text' ? 'text-primary-700 dark:text-primary-400' : 'dark:text-gray-200'}`}>
              Teks (Dot Matrix)
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">80 kolom, monospace, tanpa grafik</div>
          </button>
        </div>

        {mode === 'pdf' && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Akan menampilkan preview laporan dalam format A4. Anda bisa mencetak langsung atau download sebagai PDF.
              </p>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="textAction" value="save"
                checked={textAction === 'save'} onChange={() => setTextAction('save')}
                className="text-primary-600" />
              <span className="text-sm dark:text-gray-200">Simpan sebagai file .txt</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="textAction" value="print"
                checked={textAction === 'print'} onChange={() => setTextAction('print')}
                className="text-primary-600" />
              <span className="text-sm dark:text-gray-200">Cetak langsung ke printer</span>
            </label>

            {textAction === 'print' && (
              <div className="ml-6">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Pilih Printer</label>
                {loadingPrinters ? (
                  <p className="text-sm text-gray-400">Memuat daftar printer...</p>
                ) : printers.length === 0 ? (
                  <p className="text-sm text-red-500">Tidak ada printer ditemukan</p>
                ) : (
                  <select value={selectedPrinter} onChange={e => setSelectedPrinter(e.target.value)}
                    className="input-field w-full text-sm">
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSubmit} className="btn-primary"
            disabled={mode === 'text' && textAction === 'print' && !selectedPrinter}>
            {getButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
