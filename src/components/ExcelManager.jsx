import { useState } from 'react';

export default function ExcelManager({ onClose }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
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

    // Step 1: Preview import
    const res = await window.api.previewImport();
    setImporting(false);

    if (res.error === 'Cancelled') return;

    if (!res.success) {
      setResult({ type: 'error', message: `Import gagal: ${res.error}` });
      return;
    }

    // Step 2: Show preview modal
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
      if (res.autoBarcode > 0) msg.push(`${res.autoBarcode} barcode auto-generate`);
      setResult({
        type: 'success',
        message: `Berhasil import ${res.created} produk (${msg.join(', ')})`
      });
    } else {
      setResult({ type: 'error', message: `Import gagal: ${res.error}` });
    }
    setPreview(null);
  };

  const handleCancelPreview = () => {
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Excel Import / Export</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {result && (
          <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.message}
          </div>
        )}

        {/* Import Preview Modal */}
        {preview && (
          <div className="mb-4 border-2 border-primary-300 rounded-lg overflow-hidden">
            <div className="bg-primary-50 px-4 py-3 border-b border-primary-200">
              <h4 className="font-medium text-primary-800">Preview Import</h4>
              <p className="text-xs text-primary-600 mt-0.5">{preview.fileName}</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{preview.newProducts.length}</div>
                  <div className="text-xs text-green-700">Produk Baru</div>
                  <div className="text-xs text-green-600 opacity-75">dengan barcode</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{preview.needBarcode.length}</div>
                  <div className="text-xs text-blue-700">Auto-Barcode</div>
                  <div className="text-xs text-blue-600 opacity-75">tanpa barcode</div>
                </div>
              </div>

              {preview.existingProducts.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-800">{preview.existingProducts.length} produk dilewati</span>
                  </div>
                  <p className="text-xs text-amber-700">Produk sudah ada di database (tidak akan di-overwrite)</p>
                  {preview.existingProducts.length <= 5 && (
                    <ul className="mt-2 text-xs text-amber-600 space-y-0.5">
                      {preview.existingProducts.map((p, i) => (
                        <li key={i}>• {p.name} - {p.reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {preview.invalidRows.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">{preview.invalidRows.length} baris tidak valid</span>
                  </div>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {preview.invalidRows.slice(0, 3).map((r, i) => (
                      <li key={i}>• Baris {r.row}: {r.reason}</li>
                    ))}
                    {preview.invalidRows.length > 3 && (
                      <li>• ...dan {preview.invalidRows.length - 3} lainnya</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCancelPreview}
                  disabled={confirming}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={confirming || totalToImport === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {confirming ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>Import {totalToImport} Produk</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Options (hidden during preview) */}
        {!preview && (
          <div className="space-y-4">
            {/* Download Template */}
            <div className="p-4 border-2 border-dashed border-primary-300 bg-primary-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-primary-800 mb-1">Download Template</h4>
                  <p className="text-xs text-primary-600 mb-3">Download file Excel template dengan contoh data dan petunjuk pengisian. Isi datanya, lalu import kembali.</p>
                  <button onClick={handleDownloadTemplate} disabled={downloadingTemplate} className="btn-primary text-sm w-full">
                    {downloadingTemplate ? 'Downloading...' : 'Download Template Excel'}
                  </button>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium mb-2">Export Data Produk</h4>
              <p className="text-sm text-gray-500 mb-3">Download semua produk aktif ke file Excel (.xlsx)</p>
              <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm w-full">
                {exporting ? 'Exporting...' : 'Export Produk'}
              </button>
            </div>

            {/* Import */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium mb-2">Import dari Excel</h4>
              <p className="text-sm text-gray-500 mb-2">Import produk dari file Excel/CSV yang sudah diisi.</p>
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Produk baru akan ditambahkan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Barcode kosong akan di-generate otomatis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>Produk yang sudah ada akan dilewati</span>
                </div>
              </div>
              <button onClick={handleImport} disabled={importing} className="btn-success text-sm w-full">
                {importing ? 'Membaca file...' : 'Pilih File & Preview'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="btn-secondary">Tutup</button>
        </div>
      </div>
    </div>
  );
}
