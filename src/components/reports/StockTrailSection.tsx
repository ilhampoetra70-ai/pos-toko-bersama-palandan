import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StockTrailSection({ data }: any) {
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
            <CardHeader><CardTitle className="text-lg font-bold">Log Mutasi Stok (Histori Pergerakan)</CardTitle></CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 grid grid-cols-12 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b dark:border-gray-800">
                        <div className="col-span-2 pl-2">Waktu</div>
                        <div className="col-span-3">Produk</div>
                        <div className="col-span-2 text-center">Event</div>
                        <div className="col-span-2 text-right">Alur</div>
                        <div className="col-span-1 text-right">Ubah</div>
                        <div className="col-span-2 text-right pr-2">Oleh</div>
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
                                        <div className="col-span-2 text-gray-400 pl-2 text-[10px]">{new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="col-span-3 font-bold truncate" title={t.product_name}>{t.product_name}</div>
                                        <div className="col-span-2 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] uppercase font-bold text-gray-500">{t.event_type}</span>
                                        </div>
                                        <div className="col-span-2 text-right text-gray-500 text-[10px]">{t.quantity_before} &rarr; {t.quantity_after}</div>
                                        <div className={`col-span-1 text-right font-black ${t.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                                        </div>
                                        <div className="col-span-2 text-right pr-2 text-gray-400 truncate">{t.user_name || '-'}</div>
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
