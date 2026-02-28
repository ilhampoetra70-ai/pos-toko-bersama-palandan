import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/format';
import { Product } from '@/lib/types';
import { esc } from '@/lib/escape';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Note: Card is used in original but not here
import { X, Download } from 'lucide-react';
import { RetroPrinter } from '../components/RetroIcons';

interface BarcodePreviewModalProps {
    product: Product;
    onClose: () => void;
}

export default function BarcodePreviewModal({ product, onClose }: BarcodePreviewModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);
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
        if (!printContent || !canvasRef.current) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Label - ${esc(product.name)}</title>
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
        ${Array(labelCount).fill(`
          <div class="label">
            <div class="product-name">${esc(product.name)}</div>
            <img class="barcode-img" src="${canvasRef.current.toDataURL()}" />
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

        const labelCanvas = document.createElement('canvas');
        const ctx = labelCanvas.getContext('2d');
        if (!ctx) return;

        const dpi = 300;
        const mmToPx = (mm: number) => Math.round(mm * dpi / 25.4);
        labelCanvas.width = mmToPx(40);
        labelCanvas.height = mmToPx(30);

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

        ctx.fillStyle = '#000';
        const activeFont = getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'Arial';
        ctx.font = `bold 28px ${activeFont}`;
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

        const link = document.createElement('a');
        link.download = `label-${product.barcode}.png`;
        link.href = labelCanvas.toDataURL('image/png');
        link.click();
    };

    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-card dark:bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b dark:border-border flex items-center justify-between bg-background dark:bg-background text-foreground dark:text-foreground">
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tight">Label Barcode</h3>
                        <p className="text-xs text-muted-foreground font-medium truncate max-w-[250px]">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div
                        ref={labelRef}
                        className="mx-auto bg-card border-2 border-dashed border-border dark:border-border rounded-3xl p-6 flex flex-col items-center justify-between shadow-inner"
                        style={{ width: '220px', height: '160px' }}
                    >
                        <div className="text-[10px] font-black text-center truncate w-full uppercase tracking-tighter text-foreground">
                            {product.name}
                        </div>

                        <canvas ref={canvasRef} className="max-w-full" />
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            Ukuran Standar Thermal
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                            40 x 30 mm
                        </p>
                    </div>

                    <div className="bg-background dark:bg-background rounded-2xl p-6 space-y-4 border dark:border-border">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jumlah Salinan</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setLabelCount(c => Math.max(1, c - 1))}
                                    className="w-10 h-10 rounded-xl bg-card dark:bg-card border dark:border-border shadow-sm flex items-center justify-center font-black text-muted-foreground dark:text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    -
                                </button>
                                <div className="w-12 text-center font-black text-xl">
                                    {labelCount}
                                </div>
                                <button
                                    onClick={() => setLabelCount(c => Math.min(100, c + 1))}
                                    className="w-10 h-10 rounded-xl bg-card dark:bg-card border dark:border-border shadow-sm flex items-center justify-center font-black text-muted-foreground dark:text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground font-bold bg-card dark:bg-background rounded-xl p-3 border dark:border-border flex gap-2">
                            <span className="text-primary-600 flex-shrink-0">ⓘ</span>
                            <span><strong>Barcode CODE128:</strong> Standar industri yang kompatibel dengan semua jenis scanner kasir laser / digital.</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t dark:border-border bg-background dark:bg-background flex gap-4">
                    <button
                        onClick={handleDownload}
                        className="flex-1 h-14 bg-card dark:bg-card border dark:border-border rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-muted dark:hover:bg-muted transition-all text-muted-foreground dark:text-muted-foreground"
                    >
                        <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                        <RetroPrinter className="w-4 h-4" /> Print {labelCount > 1 ? `(${labelCount}x)` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
