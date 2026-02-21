import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';
import ReceiptIframe from '../components/ReceiptIframe';
import {
  Search,
  Scan,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Printer,
  Check,
  Loader2,
  Package,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReceiptPreview from '../components/ReceiptPreview';
import {
  useProducts,
  useCategories,
  useSettings,
  useCreateTransaction
} from '@/lib/queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  unit: string;
  category_id?: number;
}

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

export default function CashierPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const { data: products = [], isLoading: isLoadingProducts } = useProducts({
    search: search || undefined,
    category_id: filterCat || undefined,
    active: 1
  });
  const { data: categories = [] } = useCategories();
  const { data: settings = {} } = useSettings();
  const createTxMutation = useCreateTransaction();

  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastTx, setLastTx] = useState<any>(null);
  const [showTxSuccess, setShowTxSuccess] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [printing, setPrinting] = useState(false);
  const [printDone, setPrintDone] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.findIndex(item => item.product_id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        if (updated[existing].quantity < product.stock) {
          updated[existing].quantity += 1;
          updated[existing].subtotal = (updated[existing].price - updated[existing].discount) * updated[existing].quantity;
        }
        return updated;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        cost: product.cost || 0,
        quantity: 1,
        discount: 0,
        subtotal: product.price,
        unit: product.unit,
        max_stock: product.stock
      }];
    });
  }, []);

  const updateCartQty = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      item.quantity = Math.min(qty, item.max_stock);
      item.subtotal = (item.price - item.discount) * item.quantity;
      return updated;
    });
  }, []);

  const updateCartDiscount = useCallback((index: number, disc: number) => {
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      item.discount = Math.min(Math.max(0, disc), item.price);
      item.subtotal = (item.price - item.discount) * item.quantity;
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerAddress('');
    setShowCustomerInfo(false);
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const taxEnabled = settings.tax_enabled === 'true';
  const taxRate = parseInt(settings.tax_rate || '11');
  const taxAmount = taxEnabled ? Math.round(subtotal * taxRate / 100) : 0;
  const total = subtotal + taxAmount - discount;
  const totalQty = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleBarcodeDetected = async (code: string) => {
    setShowScanner(false);
    const product = await (window as any).api.getProductByBarcode(code);
    if (product) {
      addToCart(product);
    } else {
      alert(`Produk dengan barcode "${code}" tidak ditemukan`);
    }
    searchRef.current?.focus();
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      const product = await (window as any).api.getProductByBarcode(search.trim());
      if (product) {
        addToCart(product);
        setSearch('');
        return;
      }
      if (products.length === 1) {
        addToCart(products[0]);
        setSearch('');
      }
    }
  };

  const loadReceiptPreview = async (tx: any) => {
    const html = await (window as any).api.getReceiptHTML(tx);
    setReceiptHtml(html);
  };

  const doPrint = async (tx: any) => {
    setPrinting(true);
    const result = await (window as any).api.printReceipt(tx);
    setPrinting(false);
    if (!result.success) {
      alert('Print gagal: ' + (result.error || 'Unknown error'));
      return false;
    }
    return true;
  };

  const handlePayment = async (paymentData: any) => {
    const items = cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      cost: item.cost || 0,
      quantity: item.quantity,
      discount: item.discount,
      subtotal: item.subtotal
    }));

    const txData = {
      user_id: user.id,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      total,
      payment_method: paymentData.payment_method,
      amount_paid: paymentData.amount_paid,
      change_amount: paymentData.change_amount,
      customer_name: (paymentData.customer_name || customerName).trim() || null,
      customer_address: (paymentData.customer_address || customerAddress).trim() || null,
      payment_status: paymentData.payment_status || 'lunas',
      due_date: paymentData.due_date || null,
      initial_payment: paymentData.initial_payment || null,
      payment_notes: paymentData.payment_notes || null,
      items
    };

    createTxMutation.mutate(txData, {
      onSuccess: async (tx) => {
        setLastTx(tx);
        setShowPayment(false);
        clearCart();

        const printMode = settings.print_after_transaction || 'preview';

        if (printMode === 'none') {
          searchRef.current?.focus();
          return;
        }

        if (printMode === 'auto_print') {
          setReceiptHtml('');
          setPrintDone(false);
          setShowTxSuccess(true);
          loadReceiptPreview(tx);
          const ok = await doPrint(tx);
          if (ok) setPrintDone(true);
          return;
        }

        setReceiptHtml('');
        setPrintDone(false);
        setShowTxSuccess(true);
        loadReceiptPreview(tx);
      },
      onError: (err: any) => {
        alert('Gagal menyimpan transaksi: ' + (err.message || 'Unknown error'));
      }
    });
  };

  const handlePrintFromPopup = async () => {
    if (!lastTx) return;
    const ok = await doPrint(lastTx);
    if (ok) setPrintDone(true);
  };

  const handleCloseSuccess = () => {
    setShowTxSuccess(false);
    setLastTx(null);
    setReceiptHtml('');
    setPrintDone(false);
    searchRef.current?.focus();
  };

  const printMode = settings.print_after_transaction || 'preview';

  return (
    <div className="flex gap-3 h-[calc(100vh-3rem)]">

      {/* ── Left: Product Grid ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-2">

        {/* Search + Scan bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              ref={searchRef}
              className="pl-9 h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm focus:shadow-md transition-shadow"
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowScanner(true)}
            className="h-10 shrink-0 flex items-center gap-1.5 px-3 shadow-sm"
            title="Scan Barcode"
          >
            <Scan className="w-4 h-4" />
            <span className="text-xs font-medium">Scan</span>
          </Button>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCat('')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border",
              !filterCat
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white border-transparent shadow-sm shadow-primary-500/30"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400"
            )}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(filterCat === String(cat.id) ? '' : String(cat.id))}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border",
                filterCat === String(cat.id)
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white border-transparent shadow-sm shadow-primary-500/30"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product count row */}
        {!isLoadingProducts && products.length > 0 && (
          <div className="flex items-center gap-1.5 px-0.5">
            <Package className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-600">
              {products.length} produk
              {filterCat && ' dalam kategori ini'}
              {search && ` untuk "${search}"`}
            </span>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-0.5">
            {isLoadingProducts ? (
              <div className="col-span-full py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" />
              </div>
            ) : products.map(product => (
              <ProductCard key={product.id} product={product} onClick={addToCart} />
            ))}
            {!isLoadingProducts && products.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                <Package className="w-14 h-14 mx-auto mb-3 opacity-15" />
                <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
                {search && <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">Coba kata kunci lain</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Cart Panel ── */}
      <div className="w-[340px] bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex flex-col shrink-0 overflow-hidden">

        {/* Cart Header — dark gradient */}
        <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-bold text-white">Keranjang</span>
              {totalQty > 0 && (
                <span className="bg-primary-500 text-white text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-black tabular-nums">
                  {totalQty}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-gray-500 hover:text-red-400 text-[11px] font-medium transition-colors"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        <Cart items={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onUpdateDiscount={updateCartDiscount} />

        {/* Customer Info */}
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" />
              Info Pembeli
              {(customerName || customerAddress) && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold">Terisi</Badge>
              )}
            </span>
            {showCustomerInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showCustomerInfo && (
            <div className="px-4 pb-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
              <Input
                className="h-8 text-xs"
                placeholder="Nama Pembeli (opsional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value.slice(0, 50))}
                maxLength={50}
              />
              <textarea
                className="w-full border dark:border-gray-700 dark:bg-gray-900 rounded-md px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none dark:text-gray-200"
                placeholder="Alamat Tujuan (opsional)"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value.slice(0, 100))}
                maxLength={100}
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span className="font-medium dark:text-gray-200 tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {taxEnabled && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">PPN ({taxRate}%)</span>
              <span className="font-medium dark:text-gray-200 tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Diskon</span>
            <Input
              type="number"
              className="h-7 text-right text-xs font-medium max-w-[100px] tabular-nums"
              value={discount || ''}
              onChange={e => setDiscount(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="0"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-end pt-2 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Total</div>
              <div className="text-2xl font-black text-primary-600 dark:text-primary-400 tabular-nums leading-none">
                {formatCurrency(total)}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-gray-400 dark:text-gray-500">{cart.length} item</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">{totalQty} unit</div>
              </div>
            )}
          </div>

          {/* Pay button */}
          <Button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0 || total <= 0}
            className={cn(
              "w-full h-11 text-sm font-bold mt-1 border-0 transition-all",
              cart.length === 0 || total <= 0
                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-600/25 active:scale-[0.98]"
            )}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Bayar
          </Button>
        </div>
      </div>

      {/* ── Modals ── */}
      {showPayment && (
        <PaymentModal
          total={total}
          onConfirm={handlePayment}
          onClose={() => setShowPayment(false)}
          customerName={customerName}
          customerAddress={customerAddress}
        />
      )}
      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* Combined Transaction Success + Receipt Preview Dialog */}
      <Dialog open={showTxSuccess && !!lastTx} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white dark:bg-gray-950">
          <div className="p-6 border-b dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl font-bold">Transaksi Berhasil</DialogTitle>
                  <DialogDescription className="font-sans text-xs uppercase tracking-wider">{lastTx?.invoice_number}</DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <div className="alert-adaptive-success rounded-xl px-5 py-4 border dark:border-gray-800 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-green-700/70 dark:text-green-400/70 uppercase font-black mb-1">Total</div>
                <div className="text-2xl font-black text-green-700 dark:text-green-400">{formatCurrency(lastTx?.total)}</div>
              </div>
              {lastTx?.change_amount > 0 && (
                <div className="text-right border-l border-green-200 dark:border-green-800/50 pl-4">
                  <div className="text-[10px] text-green-700/70 dark:text-green-400/70 uppercase font-black mb-1">Kembalian</div>
                  <div className="text-2xl font-black text-green-800 dark:text-green-300">{formatCurrency(lastTx?.change_amount)}</div>
                </div>
              )}
            </div>
          </div>

          {(printMode === 'preview' || printMode === 'auto_print') && (
            <div className="flex-1 overflow-y-auto min-h-0 bg-gray-100 dark:bg-gray-900 p-6 flex justify-center">
              {receiptHtml ? (
                <div className="bg-white shadow-lg rounded-sm overflow-hidden border dark:border-transparent h-fit">
                  <ReceiptIframe html={receiptHtml} width="320px" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                  <p className="text-sm font-medium">Memuat preview struk...</p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t dark:border-gray-800 flex gap-3 bg-gray-50 dark:bg-gray-900 shrink-0">
            <Button variant="outline" onClick={handleCloseSuccess} className="flex-1 h-11">
              Transaksi Baru
            </Button>

            {printMode === 'preview' && (
              <Button
                onClick={handlePrintFromPopup}
                disabled={printing || printDone}
                variant={printDone ? "secondary" : "default"}
                className={`flex-1 h-11 gap-2 ${!printDone && "bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20"}`}
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : printDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {printing ? 'Mencetak...' : printDone ? 'Tercetak' : 'Cetak Struk'}
              </Button>
            )}

            {printMode === 'auto_print' && (
              <div className={cn(
                "flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all",
                printDone ? "alert-adaptive-success" : "alert-adaptive-info"
              )}>
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : printDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Printer className="w-4 h-4 mr-1 animate-pulse" />
                )}
                {printing ? 'Mencetak...' : printDone ? 'Tercetak' : 'Mengirim ke printer...'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
