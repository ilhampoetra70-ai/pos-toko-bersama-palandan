import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatCurrency } from '../../utils/format';
import { cn } from '@/lib/utils';

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
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-base font-bold text-card-foreground">Log Transaksi Penjualan</h3>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Menampilkan {safeData.length} transaksi
                </span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="bg-muted/50 p-2 grid grid-cols-12 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0 z-10">
                        <div className="col-span-2 pl-3">Invoice</div>
                        <div className="col-span-2">Waktu</div>
                        <div className="col-span-2">Metode</div>
                        <div className="col-span-4">Detail Item</div>
                        <div className="col-span-2 text-right pr-3">Total</div>
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
                                        <div className="col-span-2 font-bold tabular-nums pl-3 truncate" title={t.invoice_number}>{t.invoice_number}</div>
                                        <div className="col-span-2 text-muted-foreground">{new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="col-span-2 flex flex-wrap items-center gap-1">
                                            <span className={cn(
                                                "inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold",
                                                t.payment_method === 'cash' ? "bg-green-100/50 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                                                    t.payment_method === 'qris' ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" :
                                                        t.payment_method === 'debit' ? "bg-purple-100/50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" :
                                                            "bg-gray-100/50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
                                            )}>
                                                {t.payment_method === 'cash' ? 'TUNAI' : String(t.payment_method).toUpperCase()}
                                            </span>
                                            {t.payment_status === 'hutang' && <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Hutang</span>}
                                        </div>
                                        <div className="col-span-4 text-muted-foreground truncate text-[11px]">
                                            {t.items ? t.items.map((i: any) => `${i.product_name} (${i.quantity})`).join(', ') : '-'}
                                        </div>
                                        <div className="col-span-2 text-right font-bold tabular-nums text-foreground pr-3">{formatCurrency(t.total)}</div>
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
