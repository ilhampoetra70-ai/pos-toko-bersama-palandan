import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/format';

export default function BatchBarcodeModal({ products, onClose }) {
  const sampleCanvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);
  const [printing, setPrinting] = useState(false);

  // Filter products with barcodes
  const validProducts = products.filter(p => p.barcode);
  const skippedCount = products.length - validProducts.length;

  useEffect(() => {
    renderSampleBarcode();
  }, [validProducts]);

  const renderSampleBarcode = async () => {
    if (!sampleCanvasRef.current || validProducts.length === 0) {
      setRendering(false);
      return;
    }

    try {
      const JsBarcode = (await import('jsbarcode')).default;
      JsBarcode(sampleCanvasRef.current, validProducts[0].barcode, {
        format: 'CODE128',
        width: 1.5,
        height: 35,
        displayValue: true,
        fontSize: 10,
        textMargin: 2,
        margin: 5
      });
    } catch (err) {
      console.error('Failed to render sample barcode:', err);
    }
    setRendering(false);
  };

  const handlePrint = async () => {
    if (validProducts.length === 0) return;

    setPrinting(true);

    try {
      const JsBarcode = (await import('jsbarcode')).default;

      // Generate barcode images for all products
      const barcodeImages = await Promise.all(
        validProducts.map(async (product) => {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, product.barcode, {
            format: 'CODE128',
            width: 1.5,
            height: 35,
            displayValue: true,
            fontSize: 10,
            textMargin: 2,
            margin: 5
          });
          return {
            product,
            dataUrl: canvas.toDataURL()
          };
        })
      );

      // Create print window with all labels
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print ${validProducts.length} Labels</title>
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
          ${barcodeImages.map(({ product, dataUrl }) => `
            <div class="label">
              <div class="product-name">${product.name}</div>
              <img class="barcode-img" src="${dataUrl}" />
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
    } catch (err) {
      console.error('Failed to print:', err);
      alert('Gagal mencetak: ' + err.message);
    }

    setPrinting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Cetak Label Batch</h3>
            <p className="text-sm text-gray-500">{validProducts.length} label siap dicetak</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{validProducts.length}</div>
              <div className="text-xs text-green-700">Labels</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{validProducts.length}</div>
              <div className="text-xs text-blue-700">Halaman</div>
            </div>
          </div>

          {skippedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{skippedCount} produk dilewati (tidak punya barcode)</span>
              </div>
            </div>
          )}

          {/* Sample Preview */}
          {validProducts.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Contoh label:</div>
              <div
                className="mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-between"
                style={{ width: '160px', height: '120px' }}
              >
                <div className="text-xs font-bold text-center truncate w-full">
                  {validProducts[0].name}
                </div>
                {rendering ? (
                  <div className="text-gray-400 text-xs">Loading...</div>
                ) : (
                  <canvas ref={sampleCanvasRef} className="max-w-full" />
                )}
                <div className="text-sm font-bold">
                  {formatCurrency(validProducts[0].price)}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                40 x 30 mm (thermal label)
              </p>
            </div>
          )}

          {/* Product List Preview */}
          {validProducts.length > 1 && (
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Daftar produk ({validProducts.length}):</div>
              <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                {validProducts.slice(0, 10).map((p, i) => (
                  <div key={p.id} className="px-3 py-2 text-sm flex justify-between">
                    <span className="truncate flex-1 mr-2">{p.name}</span>
                    <span className="text-gray-500 font-mono text-xs">{p.barcode}</span>
                  </div>
                ))}
                {validProducts.length > 10 && (
                  <div className="px-3 py-2 text-sm text-gray-400 text-center">
                    ...dan {validProducts.length - 10} produk lainnya
                  </div>
                )}
              </div>
            </div>
          )}

          {validProducts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Tidak ada produk dengan barcode yang bisa dicetak</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            disabled={validProducts.length === 0 || printing}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {printing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyiapkan...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak {validProducts.length} Label
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
