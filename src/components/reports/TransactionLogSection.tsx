import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../../utils/format';

export default function TransactionLogSection({ data }: any) {
    const safeData = data || [];
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: safeData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 48,
        overscan: 5,
    });

    if (!safeData.length) return null;

    return (
        <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg font-bold">Log Transaksi Penjualan</CardTitle></CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 grid grid-cols-12 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b dark:border-gray-800">
                        <div className="col-span-2 pl-2">Invoice</div>
                        <div className="col-span-2">Waktu</div>
                        <div className="col-span-2">Metode</div>
                        <div className="col-span-4">Detail Item</div>
                        <div className="col-span-2 text-right pr-2">Total</div>
                    </div>
                    <div ref={parentRef} className="h-[300px] overflow-auto">
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const t = safeData[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.index}
                                        className="absolute top-0 left-0 w-full grid grid-cols-12 items-center p-2 text-xs border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <div className="col-span-2 font-bold pl-2 truncate" title={t.invoice_number}>{t.invoice_number}</div>
                                        <div className="col-span-2 text-gray-500">{new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="col-span-2 flex items-center gap-1">
                                            <span className="capitalize">{t.payment_method === 'cash' ? 'Tunai' : t.payment_method}</span>
                                            {t.payment_status === 'hutang' && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">Hutang</span>}
                                        </div>
                                        <div className="col-span-4 text-gray-500 truncate text-[10px]">
                                            {t.items ? t.items.map((i: any) => `${i.product_name} (${i.quantity})`).join(', ') : '-'}
                                        </div>
                                        <div className="col-span-2 text-right font-black pr-2">{formatCurrency(t.total)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
