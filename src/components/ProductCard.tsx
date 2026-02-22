import { memo } from 'react';
import { formatCurrency } from '../utils/format';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    unit?: string;
    category_id?: number;
    category_name?: string;
}

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

const CATEGORY_COLORS = [
    { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10' },
    { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-400/10' },
    { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-400/10' },
    { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-400/10' },
    { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-400/10' },
    { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-400/10' },
];

const ProductCard = memo(function ProductCard({ product, onClick }: ProductCardProps) {
    const isLowStock = product.stock > 0 && product.stock <= 5;
    const isOutOfStock = product.stock <= 0;

    const catColor = CATEGORY_COLORS[(product.category_id || 0) % CATEGORY_COLORS.length];

    return (
        <button
            onClick={() => !isOutOfStock && onClick(product)}
            disabled={isOutOfStock}
            className={cn(
                "group flex flex-col text-left bg-white dark:bg-gray-900 border rounded-2xl p-4 relative overflow-hidden transition-all",
                isOutOfStock
                    ? "border-gray-200 dark:border-gray-800 opacity-40 cursor-not-allowed"
                    : isLowStock
                        ? "border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98]"
                        : "border-gray-200 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/80 active:scale-[0.98]"
            )}
        >
            {/* Low Stock Decorative Triangle */}
            {!isOutOfStock && isLowStock && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10 group-hover:bg-red-500/20 transition-colors" />
            )}

            {/* Category Badge */}
            <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit mb-2",
                isOutOfStock
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    : `${catColor.bg} ${catColor.text}`
            )}>
                {isOutOfStock ? 'Habis' : (product.category_name || 'Umum')}
            </span>

            {/* Product Name */}
            <h3 className={cn(
                "font-bold leading-tight line-clamp-2 min-h-[2.5rem] text-sm mb-1",
                isOutOfStock
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white"
            )}>
                {product.name}
            </h3>

            {/* Stock Info */}
            <div className={cn(
                "mt-auto mb-3",
                isLowStock && !isOutOfStock
                    ? "text-[10px] font-bold flex items-center gap-1 text-red-500 dark:text-red-400"
                    : "text-[10px] text-gray-400 dark:text-gray-500 font-medium"
            )}>
                {!isOutOfStock && isLowStock && <AlertCircle className="w-3 h-3" />}
                {isOutOfStock
                    ? 'Stok Habis'
                    : isLowStock
                        ? `Sisa ${product.stock} ${product.unit}`
                        : `Stok: ${product.stock} ${product.unit}`
                }
            </div>

            {/* Price Area */}
            <div className={cn(
                "w-full mt-auto pt-3 border-t",
                isOutOfStock
                    ? "border-gray-100 dark:border-gray-800"
                    : isLowStock
                        ? "border-red-100 dark:border-red-900/30 group-hover:border-red-200 dark:group-hover:border-red-500/30"
                        : "border-gray-100 dark:border-gray-800/50 group-hover:border-primary-100 dark:group-hover:border-primary-500/20"
            )}>
                <div className={cn(
                    "text-lg font-black tracking-tight tabular-nums",
                    isOutOfStock
                        ? "text-gray-400 dark:text-gray-500"
                        : isLowStock
                            ? "text-red-500 dark:text-red-400"
                            : "text-primary-600 dark:text-primary-400"
                )}>
                    {formatCurrency(product.price)}
                </div>
            </div>
        </button>
    );
});

export default ProductCard;
