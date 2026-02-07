import { formatCurrency } from '../utils/format';

export default function Cart({ items, onUpdateQty, onRemove, onUpdateDiscount }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-sm">Keranjang kosong</p>
          <p className="text-xs mt-1">Tambah produk dari daftar</p>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {items.map((item, idx) => (
            <div key={item.product_id || idx} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.product_name}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.price)} / {item.unit || 'pcs'}</div>
                </div>
                <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 ml-2 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => onUpdateQty(idx, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-200 text-sm">-</button>
                  <input
                    type="number"
                    className="w-12 text-center text-sm py-1 border-x outline-none"
                    value={item.quantity}
                    onChange={e => onUpdateQty(idx, parseInt(e.target.value) || 0)}
                    min="1"
                  />
                  <button onClick={() => onUpdateQty(idx, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-200 text-sm">+</button>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Disc:</span>
                  <input
                    type="number"
                    className="w-16 border rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                    value={item.discount || 0}
                    onChange={e => onUpdateDiscount(idx, parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="Rp"
                  />
                </div>
                <div className="ml-auto text-sm font-semibold">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
