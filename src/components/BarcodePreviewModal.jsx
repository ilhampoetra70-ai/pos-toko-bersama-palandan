import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/format';

export default function BarcodePreviewModal({ product, onClose }) {
  const canvasRef = useRef(null);
  const labelRef = useRef(null);
  const [labelCount, setLabelCount] = useState(1);

  useEffect(() => {
    if (product?.barcode) {
      renderBarcode();
    }
  }, [product]);

  const renderBarcode = async () => {
    if (!canvasRef.current || !product?.barcode) return;

    try {
      const JsBarcode = (await import('jsbarcode')).default;
      JsBarcode(canvasRef.current, product.barcode, {
        format: 'CODE128',
        width: 1.5,
        height: 35,
        displayValue: true,
        fontSize: 10,
        textMargin: 2,
        margin: 5
      });
    } catch (err) {
      console.error('Failed to render barcode:', err);
    }
  };

  const handlePrint = () => {
    const printContent = labelRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Label - ${product.name}</title>
        <style>
          @page {
            size: 40mm 30mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
          }
          .label {
            width: 40mm;
            height: 30mm;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            page-break-after: always;
          }
          .label:last-child {
            page-break-after: auto;
          }
          .product-name {
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .barcode-img {
            max-width: 36mm;
            max-height: 14mm;
          }
          .price {
            font-size: 9pt;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${Array(labelCount).fill(`
          <div class="label">
            <div class="product-name">${product.name}</div>
            <img class="barcode-img" src="${canvasRef.current.toDataURL()}" />
            <div class="price">${formatCurrency(product.price)}</div>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!labelRef.current || !canvasRef.current) return;

    // Create a canvas for the full label
    const labelCanvas = document.createElement('canvas');
    const ctx = labelCanvas.getContext('2d');

    // 40x30mm at 300 DPI
    const dpi = 300;
    const mmToPx = (mm) => Math.round(mm * dpi / 25.4);
    labelCanvas.width = mmToPx(40);
    labelCanvas.height = mmToPx(30);

    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

    // Product name
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    const maxWidth = labelCanvas.width - 20;
    let name = product.name;
    if (ctx.measureText(name).width > maxWidth) {
      while (ctx.measureText(name + '...').width > maxWidth && name.length > 0) {
        name = name.slice(0, -1);
      }
      name += '...';
    }
    ctx.fillText(name, labelCanvas.width / 2, 35);

    // Barcode image
    const barcodeImg = canvasRef.current;
    const barcodeScale = Math.min(
      (labelCanvas.width - 40) / barcodeImg.width,
      (labelCanvas.height - 100) / barcodeImg.height
    );
    const barcodeWidth = barcodeImg.width * barcodeScale;
    const barcodeHeight = barcodeImg.height * barcodeScale;
    const barcodeX = (labelCanvas.width - barcodeWidth) / 2;
    const barcodeY = 50;
    ctx.drawImage(barcodeImg, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    // Price
    ctx.font = 'bold 32px Arial';
    ctx.fillText(formatCurrency(product.price), labelCanvas.width / 2, labelCanvas.height - 20);

    // Download
    const link = document.createElement('a');
    link.download = `label-${product.barcode}.png`;
    link.href = labelCanvas.toDataURL('image/png');
    link.click();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Label Barcode</h3>
            <p className="text-sm text-gray-500 truncate max-w-xs">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Label Preview */}
        <div className="p-5">
          <div
            ref={labelRef}
            className="mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-between"
            style={{ width: '160px', height: '120px' }}
          >
            {/* Product Name */}
            <div className="text-xs font-bold text-center truncate w-full">
              {product.name}
            </div>

            {/* Barcode/QR */}
            <canvas ref={canvasRef} className="max-w-full" />

            {/* Price */}
            <div className="text-sm font-bold">
              {formatCurrency(product.price)}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-2">
            Ukuran label: 40 x 30 mm (thermal)
          </p>

          {/* Options */}
          <div className="mt-4 space-y-3">
            {/* Label count */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Jumlah label:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLabelCount(c => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={labelCount}
                  onChange={e => setLabelCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => setLabelCount(c => Math.min(100, c + 1))}
                  className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              <strong>Barcode CODE128:</strong> Standar retail, kompatibel dengan semua scanner kasir
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={handleDownload}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print {labelCount > 1 ? `(${labelCount}x)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
