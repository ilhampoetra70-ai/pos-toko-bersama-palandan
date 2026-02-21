import { memo } from 'react';
import { formatCurrency } from '../utils/format';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    unit: string;
    category_name?: string;
}

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onClick }: ProductCardProps) {
    const isLowStock = product.stock > 0 && product.stock <= 5;
    const isOutOfStock = product.stock <= 0;

    return (
        <button
            onClick={() => !isOutOfStock && onClick(product)}
            disabled={isOutOfStock}
            className={cn(
                "group relative rounded-xl border text-left w-full flex flex-col overflow-hidden transition-all duration-200",
                isOutOfStock
                    ? "bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 opacity-55 cursor-not-allowed"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary-500/10 active:scale-[0.97] cursor-pointer"
            )}
        >
            {/* Top accent gradient bar */}
            <div className={cn(
                "h-[3px] w-full transition-all duration-200",
                isOutOfStock
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 opacity-30 group-hover:opacity-100"
            )} />

            <div className="p-2.5 flex flex-col flex-1 gap-1">
                {/* Category */}
                <div className="text-[9px] font-black uppercase tracking-widest truncate text-primary-500 dark:text-primary-400 opacity-70 group-hover:opacity-100 transition-opacity">
                    {product.category_name || 'Umum'}
                </div>

                {/* Product Name */}
                <div className="text-[11px] font-semibold leading-tight line-clamp-2 dark:text-gray-200 flex-1 min-h-[2rem]">
                    {product.name}
                </div>

                {/* Price + Stock */}
                <div className="flex items-end justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800 mt-auto gap-1">
                    <span className="text-[13px] font-black text-primary-600 dark:text-primary-400 leading-none tabular-nums">
                        {formatCurrency(product.price)}
                    </span>
                    <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none shrink-0",
                        isOutOfStock
                            ? "bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400"
                            : isLowStock
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                        {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                    </span>
                </div>
            </div>

            {/* Floating + button appears on hover */}
            {!isOutOfStock && (
                <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-150">
                    <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/40">
                        <Plus className="w-3 h-3" strokeWidth={3} />
                    </div>
                </div>
            )}
        </button>
    );
});

export default ProductCard;
