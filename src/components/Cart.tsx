import { memo } from 'react';
import { formatCurrency } from '../utils/format';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  cost: number;
  quantity: number;
  discount: number;
  subtotal: number;
  unit: string;
  max_stock: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onUpdateDiscount: (index: number, disc: number) => void;
}

const Cart = memo(function Cart({ items, onUpdateQty, onRemove, onUpdateDiscount }: CartProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-gray-300 dark:text-gray-600">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Keranjang kosong</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Tambah produk dari daftar</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item, idx) => (
            <div
              key={item.product_id || idx}
              className={cn(
                "px-3 py-2.5 transition-all group",
                "border-l-2 border-transparent hover:border-primary-400 dark:hover:border-primary-600",
                "hover:bg-gray-50 dark:hover:bg-gray-800/40"
              )}
            >
              {/* Row 1: Name + Trash */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate dark:text-gray-200 leading-tight">{item.product_name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{formatCurrency(item.price)} / {item.unit || 'pcs'}</div>
                </div>
                <button
                  onClick={() => onRemove(idx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400 shrink-0 mt-0.5 p-0.5 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Qty stepper + Disc + Subtotal */}
              <div className="flex items-center gap-2">
                {/* Qty stepper */}
                <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                  <button
                    onClick={() => onUpdateQty(idx, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 text-gray-400 transition-colors"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <input
                    type="number"
                    className="w-8 text-center text-xs bg-transparent outline-none font-bold dark:text-gray-200 border-x border-gray-200 dark:border-gray-700 h-6 tabular-nums"
                    value={item.quantity}
                    onChange={e => onUpdateQty(idx, parseInt(e.target.value) || 0)}
                    min="1"
                  />
                  <button
                    onClick={() => onUpdateQty(idx, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 text-gray-400 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-[9px] text-gray-400 shrink-0 font-medium">-Rp</span>
                  <Input
                    type="number"
                    className="h-6 text-[10px] px-1.5 py-0 min-w-0 w-full"
                    value={item.discount || 0}
                    onChange={e => onUpdateDiscount(idx, parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="0"
                  />
                </div>

                {/* Subtotal */}
                <div className="text-xs font-black text-gray-900 dark:text-white shrink-0 tabular-nums">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Cart;
