import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

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
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-base font-bold text-card-foreground">Log Mutasi Stok (Histori Pergerakan)</h3>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Menampilkan {safeData.length} histori
                </span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="bg-muted/50 p-2 grid grid-cols-12 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 z-10">
                        <div className="col-span-2 pl-3">Waktu</div>
                        <div className="col-span-3">Produk</div>
                        <div className="col-span-2 text-center">Event</div>
                        <div className="col-span-2 text-right">Alur</div>
                        <div className="col-span-1 text-right">Ubah</div>
                        <div className="col-span-2 text-right pr-3">Oleh</div>
                    </div>
                    <div ref={parentRef} className="h-[300px] overflow-auto custom-scrollbar relative">
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const t = safeData[virtualRow.index];
                                const isEven = virtualRow.index % 2 === 0;
                                return (
                                    <div
                                        key={virtualRow.index}
                                        className={cn(
                                            "absolute top-0 left-0 w-full grid grid-cols-12 items-center p-2 text-xs border-b border-border hover:bg-[var(--table-hover)] transition-colors",
                                            !isEven && "bg-[var(--table-zebra)]"
                                        )}
                                        style={{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px` }}
                                    >
                                        <div className="col-span-2 text-muted-foreground pl-3 text-[10px]">{new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="col-span-3 font-bold text-foreground truncate" title={t.product_name}>{t.product_name}</div>
                                        <div className="col-span-2 text-center">
                                            <span className="px-2 py-0.5 bg-muted rounded text-[10px] uppercase font-bold text-muted-foreground">{t.event_type}</span>
                                        </div>
                                        <div className="col-span-2 text-right text-muted-foreground tabular-nums text-[10px]">{t.quantity_before} &rarr; {t.quantity_after}</div>
                                        <div className={`col-span-1 text-right font-black tabular-nums ${t.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                                        </div>
                                        <div className="col-span-2 text-right pr-3 text-muted-foreground truncate">{t.user_name || '-'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
