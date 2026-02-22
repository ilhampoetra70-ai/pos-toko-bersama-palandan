import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

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
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-base font-bold text-card-foreground">Audit Trail Perubahan Stok Manual</h3>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Menampilkan {safeData.length} histori
                </span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    <div className="bg-muted/50 p-2 grid grid-cols-12 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 z-10">
                        <div className="col-span-4 pl-3">Produk</div>
                        <div className="col-span-2 text-center">Netto</div>
                        <div className="col-span-3">Diubah Oleh</div>
                        <div className="col-span-3 text-right pr-3">Waktu</div>
                    </div>
                    <div ref={parentRef} className="h-[250px] overflow-auto custom-scrollbar relative">
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const log = safeData[virtualRow.index];
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
                                        <div className="col-span-4 font-bold pl-3 truncate text-foreground" title={log.product_name}>{log.product_name}</div>
                                        <div className={`col-span-2 text-center font-bold ${log.total_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.total_change > 0 ? '+' : ''}{log.total_change}
                                        </div>
                                        <div className="col-span-3 text-muted-foreground truncate" title={log.user_names}>{log.user_names}</div>
                                        <div className="col-span-3 text-right text-muted-foreground pr-3">{new Date(log.last_change).toLocaleString('id-ID')}</div>
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
