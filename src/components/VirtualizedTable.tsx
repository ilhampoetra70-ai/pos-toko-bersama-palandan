import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { cn } from '@/lib/utils';

interface Column {
    header: string;
    accessor: string | ((item: any) => React.ReactNode);
    className?: string;
    headerClassName?: string;
}

interface VirtualizedTableProps {
    data: any[];
    columns: Column[];
    rowHeight?: number;
    maxHeight?: string;
    onRowClick?: (item: any) => void;
    className?: string;
    tableClassName?: string;
}

export function VirtualizedTable({
    data,
    columns,
    rowHeight = 56,
    maxHeight = '400px',
    onRowClick,
    className,
    tableClassName,
    emptyMessage = "Tidak ada data"
}: VirtualizedTableProps & { emptyMessage?: string }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 10,
    });

    const items = virtualizer.getVirtualItems();

    // Helper to get consistent grid template
    // If columns don't have explicit width, we use minmax(0, 1fr) for equal distribution
    // or we can stick to flex. Flex is easier if we want 'flex-1'.
    // The previous implementation used flex-1. Let's stick to flex but with consistent div structure.

    return (
        <div
            ref={parentRef}
            className={cn("overflow-auto relative border rounded-md bg-background", className)}
            style={{ maxHeight }}
        >
            {/* Header - Sticky */}
            <div className={cn(
                "sticky top-0 z-20 flex items-center border-b bg-muted/90 backdrop-blur-sm dark:bg-muted/90 min-w-full font-medium text-muted-foreground",
                tableClassName
            )}
                style={{ height: rowHeight }}
            >
                {columns.map((col, idx) => (
                    <div
                        key={idx}
                        className={cn("flex-1 px-4 text-sm font-medium", col.headerClassName)}
                    >
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Virtualized List Container */}
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        {emptyMessage}
                    </div>
                )}

                {items.map((virtualRow) => {
                    const item = data[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "absolute top-0 left-0 w-full flex items-center border-b last:border-0 hover:bg-muted/50 transition-colors",
                                onRowClick && "cursor-pointer"
                            )}
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {columns.map((col, idx) => (
                                <div
                                    key={idx}
                                    className={cn("flex-1 px-4 text-sm", col.className)}
                                >
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(item)
                                        : item[col.accessor]}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
