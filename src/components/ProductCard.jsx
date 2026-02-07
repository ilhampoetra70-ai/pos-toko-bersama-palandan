import { formatCurrency } from '../utils/format';

export default function ProductCard({ product, onClick }) {
  return (
    <button
      onClick={() => onClick(product)}
      className="bg-white rounded-xl border border-gray-200 p-3 hover:border-primary-400 hover:shadow-md transition-all text-left w-full"
    >
      <div className="text-sm font-medium truncate mb-1">{product.name}</div>
      <div className="text-xs text-gray-500 mb-2">{product.category_name || 'No Category'}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary-600">{formatCurrency(product.price)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
          {product.stock} {product.unit}
        </span>
      </div>
    </button>
  );
}
