import { useEffect, useRef, useState } from 'react';
import { Product } from '@/lib/types';
import { X, Printer, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BatchBarcodeModalProps {
    products: Product[];
    onClose: () => void;
}

export default function BatchBarcodeModal({ products, onClose }: BatchBarcodeModalProps) {
    const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
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
            if (!printWindow) throw new Error('Popup blocked');

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
              font-family: var(--font-family, 'Roboto', 'Segoe UI', system-ui, sans-serif);
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
          </style>
        </head>
        <body>
          ${barcodeImages.map(({ product, dataUrl }) => `
            <div class="label">
              <div class="product-name">${product.name}</div>
              <img class="barcode-img" src="${dataUrl}" />
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
        } catch (err: any) {
            console.error('Failed to print:', err);
            alert('Gagal mencetak: ' + err.message);
        }

        setPrinting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 uppercase tracking-tight">Cetak Batch</h3>
                        <p className="text-xs text-gray-500 font-medium">{validProducts.length} label siap diproses</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{validProducts.length}</div>
                            <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Total Label</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 text-center border border-blue-100 dark:border-blue-900/50">
                            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{validProducts.length}</div>
                            <div className="text-[10px] font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest">Total Halaman</div>
                        </div>
                    </div>

                    {skippedCount > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
                            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-bold leading-tight">
                                    <span className="font-black">{skippedCount} produk</span> dilewati karena tidak memiliki data barcode yang valid.
                                </p>
                            </div>
                        </div>
                    )}

                    {validProducts.length > 0 && (
                        <div className="space-y-4">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pratinjau Format</div>
                            <div
                                className="mx-auto bg-white border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-between shadow-inner"
                                style={{ width: '180px', height: '140px' }}
                            >
                                <div className="text-[10px] font-black text-center truncate w-full uppercase tracking-tighter text-gray-900">
                                    {validProducts[0].name}
                                </div>
                                {rendering ? (
                                    <div className="flex flex-col items-center gap-2 text-gray-400 opacity-50">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-[8px] font-black">RENDERING...</span>
                                    </div>
                                ) : (
                                    <canvas ref={sampleCanvasRef} className="max-w-full" />
                                )}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">
                                40 x 30 mm • Thermal Label Stock
                            </p>
                        </div>
                    )}

                    {validProducts.length > 1 && (
                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Daftar Item ({validProducts.length})</div>
                            <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 divide-y dark:divide-gray-800 shadow-inner">
                                {validProducts.slice(0, 50).map((p) => (
                                    <div key={p.id} className="px-4 py-3 flex justify-between items-center group hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate flex-1 mr-4">{p.name}</span>
                                        <Badge variant="outline" className="font-mono text-[9px] font-black opacity-50 group-hover:opacity-100 transition-opacity">
                                            {p.barcode}
                                        </Badge>
                                    </div>
                                ))}
                                {validProducts.length > 50 && (
                                    <div className="px-4 py-3 text-[10px] text-gray-400 font-black text-center uppercase tracking-widest bg-gray-100/50 dark:bg-gray-800/50">
                                        ...dan {validProducts.length - 50} PRODUK lainnya
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {validProducts.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800 flex flex-col items-center gap-4">
                            <AlertTriangle className="w-12 h-12 text-gray-200 dark:text-gray-800" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-loose text-center px-8">
                                Tidak ditemukan data barcode yang valid pada pilihan produk Anda.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={validProducts.length === 0 || printing}
                        className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {printing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Proses...</span>
                            </>
                        ) : (
                            <>
                                <Printer className="w-4 h-4" />
                                <span>Cetak {validProducts.length} Label</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
