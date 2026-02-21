import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StockAuditSection({ data }: any) {
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
            <CardHeader><CardTitle className="text-lg font-bold">Audit Trail Perubahan Stok Manual</CardTitle></CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 grid grid-cols-12 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b dark:border-gray-800">
                        <div className="col-span-4 pl-2">Produk</div>
                        <div className="col-span-2 text-center">Netto</div>
                        <div className="col-span-3">Diubah Oleh</div>
                        <div className="col-span-3 text-right pr-2">Waktu</div>
                    </div>
                    <div ref={parentRef} className="h-[250px] overflow-auto">
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const log = safeData[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.index}
                                        className="absolute top-0 left-0 w-full grid grid-cols-12 items-center p-2 text-xs border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <div className="col-span-4 font-bold pl-2 truncate" title={log.product_name}>{log.product_name}</div>
                                        <div className={`col-span-2 text-center font-bold ${log.total_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.total_change > 0 ? '+' : ''}{log.total_change}
                                        </div>
                                        <div className="col-span-3 text-gray-500 truncate" title={log.user_names}>{log.user_names}</div>
                                        <div className="col-span-3 text-right text-gray-400 pr-2">{new Date(log.last_change).toLocaleString('id-ID')}</div>
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
