import { memo, useState } from 'react';
import { formatCurrency } from '../utils/format';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
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
  const [expandedDiscount, setExpandedDiscount] = useState<Set<number>>(new Set());

  const toggleDiscount = (idx: number) => {
    setExpandedDiscount(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const density: 'spacious' | 'compact' | 'dense' =
    items.length <= 3 ? 'spacious' :
      items.length <= 6 ? 'compact' : 'dense';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-gray-400 dark:text-gray-500">
          <ShoppingCart className="w-12 h-12 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-300 dark:text-gray-600">Keranjang kosong</p>
        </div>
      ) : (
        <div className={cn(
          density === 'spacious' && "space-y-2 p-3",
          density === 'compact' && "space-y-1.5 p-2",
          density === 'dense' && "space-y-1 p-2"
        )}>
          {items.map((item, idx) => (
            <div
              key={item.product_id || idx}
              className={cn(
                "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 relative overflow-hidden transition-all duration-150",
                (density === 'spacious' || density === 'compact') && "flex flex-col group",
                density === 'spacious' && "rounded-xl p-3 gap-3",
                density === 'compact' && "rounded-lg p-2 gap-1.5",
                density === 'dense' && "rounded-lg px-2 py-1.5 flex flex-row items-center gap-2 group"
              )}
            >
              <div className={cn(
                "absolute top-0 bottom-0 w-1 bg-primary-500",
                density === 'spacious' ? "left-0 rounded-l-xl" : "left-0 rounded-l-lg"
              )} />

              {/* TIER: SPACIOUS ATAU COMPACT (2 BARIS) */}
              {(density === 'spacious' || density === 'compact') && (
                <>
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className={cn(
                        "font-bold leading-tight",
                        density === 'spacious' ? "text-sm text-gray-800 dark:text-gray-200" : "text-xs text-gray-800 dark:text-gray-200"
                      )}>
                        {item.product_name}
                      </h4>
                      <div className={cn(
                        "font-mono mt-1",
                        density === 'spacious' ? "text-[11px] text-gray-500 dark:text-gray-400 block" : "hidden"
                      )}>
                        {formatCurrency(item.price)} / {item.unit || 'pcs'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "font-black text-gray-900 dark:text-gray-100",
                        density === 'spacious' ? "text-sm" : "text-xs"
                      )}>
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pl-2">
                    <div className="flex flex-col items-start gap-1 min-h-[24px] justify-center">
                      {(item.discount > 0 || expandedDiscount.has(idx)) ? (
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-orange-500 dark:text-orange-400 font-bold",
                            density === 'spacious' ? "text-[10px]" : "text-[9px]"
                          )}>
                            Disc: -{formatCurrency(item.discount)}
                          </span>
                          {expandedDiscount.has(idx) && (
                            <input
                              type="number"
                              className={cn(
                                "px-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-200 outline-none focus:border-primary-500 ml-1",
                                density === 'spacious' ? "w-16 h-6 text-[10px]" : "w-14 h-5 text-[9px]"
                              )}
                              value={item.discount || ''}
                              onChange={e => onUpdateDiscount(idx, parseInt(e.target.value) || 0)}
                              onBlur={() => { if (!item.discount) toggleDiscount(idx); }}
                              placeholder="0"
                              autoFocus
                            />
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleDiscount(idx)}
                          className={cn(
                            "text-primary-500 dark:text-primary-400 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity",
                            density === 'spacious' ? "text-[10px]" : "text-[9px]"
                          )}
                        >
                          Edit Diskon
                        </button>
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
                      density === 'spacious' ? "p-1" : "p-0.5"
                    )}>
                      <button
                        onClick={() => {
                          if (item.quantity === 1) onRemove(idx);
                          else onUpdateQty(idx, item.quantity - 1);
                        }}
                        className={cn(
                          "flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors",
                          density === 'spacious' ? "w-8 h-8" : "w-7 h-7"
                        )}
                      >
                        {item.quantity === 1
                          ? <Trash2 className={cn("text-red-500 dark:text-red-400", density === 'spacious' ? "w-4 h-4" : "w-3.5 h-3.5")} />
                          : <Minus className={density === 'spacious' ? "w-4 h-4" : "w-3.5 h-3.5"} />
                        }
                      </button>
                      <input
                        type="number"
                        className={cn(
                          "text-center font-bold tabular-nums bg-transparent border-none outline-none text-gray-900 dark:text-gray-100",
                          density === 'spacious' ? "w-9 text-sm" : "w-8 text-xs"
                        )}
                        value={item.quantity}
                        onChange={e => onUpdateQty(idx, parseInt(e.target.value) || 0)}
                        min="1"
                      />
                      <button
                        onClick={() => onUpdateQty(idx, item.quantity + 1)}
                        className={cn(
                          "flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors",
                          density === 'spacious' ? "w-8 h-8" : "w-7 h-7"
                        )}
                      >
                        <Plus className={density === 'spacious' ? "w-4 h-4" : "w-3.5 h-3.5"} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* TIER: DENSE (1 BARIS HORIZONTAL) */}
              {density === 'dense' && (
                <>
                  {/* Nama dan diskon */}
                  <div className="flex flex-col flex-1 min-w-0 pl-2">
                    <h4 className="font-bold text-[11px] text-gray-800 dark:text-gray-200 leading-none truncate">
                      {item.product_name}
                    </h4>
                    {item.discount > 0 && (
                      <span className="text-[9px] text-orange-500 dark:text-orange-400 mt-0.5 leading-none">
                        Disc: -{formatCurrency(item.discount)}
                      </span>
                    )}
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shrink-0">
                    <button
                      onClick={() => {
                        if (item.quantity === 1) onRemove(idx);
                        else onUpdateQty(idx, item.quantity - 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                    >
                      {item.quantity === 1
                        ? <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
                        : <Minus className="w-3 h-3" />
                      }
                    </button>
                    <input
                      type="number"
                      className="w-7 text-[11px] text-center font-bold tabular-nums bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
                      value={item.quantity}
                      onChange={e => onUpdateQty(idx, parseInt(e.target.value) || 0)}
                      min="1"
                    />
                    <button
                      onClick={() => onUpdateQty(idx, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-black text-xs text-gray-900 dark:text-gray-100 shrink-0 min-w-[60px] text-right">
                    {formatCurrency(item.subtotal)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Cart;
