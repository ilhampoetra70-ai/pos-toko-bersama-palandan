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
    cartQty?: number;
}

const CATEGORY_COLORS = [
    { text: 'text-primary dark:text-primary', bg: 'bg-primary/10 dark:bg-primary/10' },
    { text: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { text: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100/60 dark:bg-primary-900/15' },
    { text: 'text-secondary dark:text-secondary', bg: 'bg-secondary/10 dark:bg-secondary/10' },
    { text: 'text-accent dark:text-accent', bg: 'bg-accent/10 dark:bg-accent/10' },
    { text: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-50/80 dark:bg-primary-950/20' },
];

const ProductCard = memo(function ProductCard({ product, onClick, cartQty = 0 }: ProductCardProps) {
    const isLowStock = product.stock > 0 && product.stock <= 5;
    const isOutOfStock = product.stock <= 0;
    const inCart = cartQty > 0;

    const catColor = CATEGORY_COLORS[(product.category_id || 0) % CATEGORY_COLORS.length];

    return (
        <button
            onClick={() => !isOutOfStock && onClick(product)}
            disabled={isOutOfStock}
            className={cn(
                "group flex flex-col text-left bg-card dark:bg-background border rounded-2xl p-4 relative overflow-hidden transition-all",
                isOutOfStock
                    ? "border-border dark:border-border opacity-40 cursor-not-allowed"
                    : inCart
                        ? "border-primary-400 bg-primary-50/50 dark:border-primary-500/50 dark:bg-primary-900/10 hover:border-primary-500"
                        : isLowStock
                            ? "border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98]"
                            : "border-border dark:border-border hover:border-primary-400 dark:hover:border-primary-500/50 hover:bg-background dark:hover:bg-card/80 active:scale-[0.98]"
            )}
        >
            {/* Cart Qty Badge */}
            {inCart && (
                <div className="absolute top-0 right-0 z-10 bg-primary-600 text-white text-[10px] font-black min-w-[1.5rem] h-6 px-1 flex items-center justify-center rounded-bl-xl shadow-sm animate-in zoom-in-75 duration-200">
                    {cartQty}
                </div>
            )}
            {/* Low Stock Decorative Triangle */}
            {!isOutOfStock && isLowStock && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10 group-hover:bg-red-500/20 transition-colors" />
            )}

            {/* Category Badge */}
            <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit mb-2",
                isOutOfStock
                    ? "bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground"
                    : `${catColor.bg} ${catColor.text}`
            )}>
                {isOutOfStock ? 'Habis' : (product.category_name || 'Umum')}
            </span>

            {/* Product Name */}
            <h3 className={cn(
                "font-bold leading-tight line-clamp-2 min-h-[2.5rem] text-sm mb-1",
                isOutOfStock
                    ? "text-muted-foreground dark:text-muted-foreground"
                    : "text-foreground dark:text-foreground group-hover:text-foreground dark:group-hover:text-white"
            )}>
                {product.name}
            </h3>

            {/* Stock Info */}
            <div className={cn(
                "mt-auto mb-3",
                isLowStock && !isOutOfStock
                    ? "text-[10px] font-bold flex items-center gap-1 text-red-500 dark:text-red-400"
                    : "text-[10px] text-muted-foreground dark:text-muted-foreground font-medium"
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
                    ? "border-border dark:border-border"
                    : isLowStock
                        ? "border-red-100 dark:border-red-900/30 group-hover:border-red-200 dark:group-hover:border-red-500/30"
                        : "border-border dark:border-border/50 group-hover:border-primary-100 dark:group-hover:border-primary-500/20"
            )}>
                <div className={cn(
                    "text-lg font-black tracking-tight tabular-nums",
                    isOutOfStock
                        ? "text-muted-foreground dark:text-muted-foreground"
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
