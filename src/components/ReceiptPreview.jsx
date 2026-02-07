import { useState, useEffect } from 'react';
import ReceiptIframe from './ReceiptIframe';

export default function ReceiptPreview({ transaction, onClose }) {
  const [html, setHtml] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadPreview();
  }, [transaction]);

  const loadPreview = async () => {
    let tx = transaction;
    if (transaction.id) {
      const fresh = await window.api.getTransactionById(transaction.id);
      if (fresh) tx = fresh;
    }
    const result = await window.api.getReceiptHTML(tx);
    setHtml(result);
  };

  const handlePrint = async () => {
    setPrinting(true);
    let tx = transaction;
    if (transaction.id) {
      const fresh = await window.api.getTransactionById(transaction.id);
      if (fresh) tx = fresh;
    }
    const result = await window.api.printReceipt(tx);
    if (!result.success) {
      alert('Print gagal: ' + (result.error || 'Unknown error'));
    }
    setPrinting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Preview Struk</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4 mb-4">
          <ReceiptIframe html={html} width="300px" />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Tutup</button>
          <button onClick={handlePrint} disabled={printing} className="btn-primary">
            {printing ? 'Mencetak...' : 'Cetak Struk'}
          </button>
        </div>
      </div>
    </div>
  );
}
