import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';
import ReceiptIframe from '../components/ReceiptIframe';
import { Search, Scan, User as UserIcon, ChevronDown, ChevronUp, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { RetroWallet, RetroPrinter, RetroBox, RetroCart, RetroBag, RetroTrash } from '../components/RetroIcons';
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
  unit?: string;
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const { data: productsData = [], isLoading: isLoadingProducts } = useProducts({
    search: debouncedSearch || undefined,
    category_id: filterCat || undefined,
    active: 1,
    limit: 80
  });
  const { data: categoriesData = [] } = useCategories();
  const { data: settings = {} } = useSettings();
  const createTxMutation = useCreateTransaction();

  const products: Product[] = Array.isArray(productsData) ? productsData : (productsData as any).data || [];
  const categories: any[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).data || [];

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
  const [errorDialog, setErrorDialog] = useState({ show: false, title: '', message: '' });
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const triggerAddAnimation = (productId: number) => {
    setLastAddedId(productId);
    setTimeout(() => setLastAddedId(null), 600);
  };

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;

    let animateId: number | null = null;
    let maxStockHit = false;

    setCart(prev => {
      const existing = prev.findIndex(item => item.product_id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        if (updated[existing].quantity < product.stock) {
          updated[existing].quantity += 1;
          updated[existing].subtotal = (updated[existing].price - updated[existing].discount) * updated[existing].quantity;
          animateId = product.id;
        } else {
          maxStockHit = true;
        }
        return updated;
      }
      animateId = product.id;
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

    if (animateId !== null) triggerAddAnimation(animateId);
    if (maxStockHit) setErrorDialog({
      show: true,
      title: 'Stok Maksimum',
      message: `Stok produk "${product.name}" hanya tersedia ${product.stock} ${product.unit}.`
    });
  }, []);

  const updateCartQty = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      return;
    }

    let animateId: number | null = null;
    let maxStockItem: CartItem | null = null;

    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      const prevQty = item.quantity;
      item.quantity = Math.min(qty, item.max_stock);
      item.subtotal = (item.price - item.discount) * item.quantity;
      if (item.quantity > prevQty) animateId = item.product_id;
      if (qty > item.max_stock) maxStockItem = { ...item };
      return updated;
    });

    if (animateId !== null) triggerAddAnimation(animateId);
    if (maxStockItem) setErrorDialog({
      show: true,
      title: 'Stok Maksimum',
      message: `Stok produk "${(maxStockItem as CartItem).product_name}" hanya tersedia ${(maxStockItem as CartItem).max_stock} ${(maxStockItem as CartItem).unit}.`
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setShowScanner(true);
      }
      if (e.key === ' ' && document.activeElement === document.body) {
        e.preventDefault();
        if (cart.length > 0 && total > 0 && !createTxMutation.isPending) setShowPayment(true);
      }
      if (e.key === 'k' && e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart.length, total]);

  const handleBarcodeDetected = async (code: string) => {
    setShowScanner(false);
    const result = await window.api.getProductByBarcode(code);
    if (result.success && result.data) {
      addToCart(result.data);
    } else {
      setErrorDialog({
        show: true,
        title: 'Produk Tidak Ditemukan',
        message: `Produk dengan barcode "${code}" tidak ditemukan dalam database.`
      });
    }
    searchRef.current?.focus();
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      const result = await window.api.getProductByBarcode(search.trim());
      if (result.success && result.data) {
        addToCart(result.data);
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
    const html = await window.api.getReceiptHTML(tx);
    setReceiptHtml(html);
  };

  const doPrint = async (tx: any) => {
    setPrinting(true);
    try {
      const result = await window.api.printReceipt(tx);
      setPrinting(false);
      if (!result.success) {
        setErrorDialog({
          show: true,
          title: 'Gagal Mencetak',
          message: 'Print gagal: ' + (result.error || 'Terjadi kesalahan tidak dikenal')
        });
        return false;
      }
      return true;
    } catch (err: any) {
      // Jika IPC sendiri throw exception, pastikan UI tidak stuck di state printing
      setPrinting(false);
      setErrorDialog({
        show: true,
        title: 'Gagal Mencetak',
        message: 'Print gagal: ' + (err?.message || 'Terjadi kesalahan tidak terduga')
      });
      return false;
    }
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

    // Validasi produk aktif sebelum checkout
    const productIds = items.filter(i => i.product_id != null).map(i => i.product_id);
    if (productIds.length > 0) {
      const invalidItems: string[] = [];
      for (const item of items) {
        if (!item.product_id) continue;
        const product = await window.api.getProductById(item.product_id);
        if (!product || (product as any).data?.active === 0 || (product as any).active === 0) {
          invalidItems.push(item.product_name);
        }
      }
      if (invalidItems.length > 0) {
        setErrorDialog({
          show: true,
          title: 'Produk Tidak Tersedia',
          message: `Produk berikut sudah tidak aktif dan tidak bisa dijual: ${invalidItems.join(', ')}. Hapus dari cart terlebih dahulu.`
        });
        return;
      }
    }

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
          // Jalankan print dan preview paralel. Gunakan allSettled agar
          // jika salah satu gagal, yang lainnya tetap selesai (tidak fail-fast).
          const results = await Promise.allSettled([doPrint(tx), loadReceiptPreview(tx)]);
          const printResult = results[0];
          const ok = printResult.status === 'fulfilled' && printResult.value === true;
          if (ok) setPrintDone(true);
          return;
        }

        setReceiptHtml('');
        setPrintDone(false);
        setShowTxSuccess(true);
        loadReceiptPreview(tx);
      },
      onError: (err: any) => {
        setErrorDialog({
          show: true,
          title: 'Gagal Menyimpan',
          message: 'Transaksi gagal disimpan: ' + (err.message || 'Terjadi kesalahan tidak dikenal')
        });
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
    <div className="flex h-[calc(100vh-3rem)] gap-0">

      {/* ── Left: Product Grid ── */}
      <section className="flex-1 flex flex-col min-w-0 bg-background dark:bg-background">

        {/* Search + controls area */}
        <div className="p-4 border-b border-border/50 dark:border-border/50 flex flex-col gap-3 bg-card/80 dark:bg-background/30 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                className="w-full h-12 pl-10 pr-24 bg-card dark:bg-background border border-border dark:border-border rounded-xl text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
                placeholder="Cari nama produk atau scan barcode..."
                value={search}
                onChange={e => {
                  const val = e.target.value;
                  setSearch(val);
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  searchDebounceRef.current = setTimeout(() => {
                    setDebouncedSearch(val);
                  }, 400);
                }}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              {!isLoadingProducts && products.length > 0 && (
                <div className="absolute right-[4.5rem] top-1/2 -translate-y-1/2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-bold tabular-nums">
                    {products.length}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="h-12 px-4 bg-card dark:bg-background border border-border dark:border-border rounded-xl flex items-center gap-2 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:border-border dark:hover:border-gray-600 transition-all shrink-0 font-medium text-sm"
              title="Scan Barcode (F2)"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterCat('')}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                !filterCat
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                  : "bg-card dark:bg-background border border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:border-border dark:hover:border-gray-700"
              )}
            >
              Semua
            </button>
            {Array.isArray(categories) && categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === String(cat.id) ? '' : String(cat.id))}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                  filterCat === String(cat.id)
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "bg-card dark:bg-background border border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:border-border dark:hover:border-gray-700"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {isLoadingProducts ? (
              <div className="col-span-full py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" />
              </div>
            ) : products.map(product => {
              const cartQty = cart.find(c => c.product_id === product.id)?.quantity || 0;
              return (
                <ProductCard key={product.id} product={product} onClick={addToCart} cartQty={cartQty} />
              )
            })}
            {!isLoadingProducts && products.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground dark:text-muted-foreground">
                <RetroBox className="w-14 h-14 mx-auto mb-3 opacity-15" />
                <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
                {search && <p className="text-xs mt-1">Coba kata kunci lain</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Right: Cart Panel ── */}
      <aside className="w-[360px] bg-card dark:bg-background border-l border-border dark:border-border flex flex-col shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.15)] dark:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">

        {/* Cart Header */}
        <div className="p-4 border-b border-border dark:border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-card flex items-center justify-center text-primary-500 dark:text-primary-400">
              <RetroCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground dark:text-foreground">Pesanan Baru</h2>
              {totalQty > 0 && (
                <div className="text-[10px] text-muted-foreground dark:text-muted-foreground font-medium tabular-nums">
                  {totalQty} unit &middot; {cart.length} item
                </div>
              )}
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground dark:text-muted-foreground hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition-colors"
              title="Kosongkan keranjang"
            >
              <RetroTrash className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Cart items={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onUpdateDiscount={updateCartDiscount} lastAddedId={lastAddedId} />
        </div>

        {/* Customer Info */}
        <button
          onClick={() => setShowCustomerInfo(!showCustomerInfo)}
          className="w-full px-4 py-3 border-t border-border dark:border-border bg-background/50 dark:bg-background/50 flex justify-between items-center hover:bg-muted dark:hover:bg-card transition-colors shrink-0"
        >
          <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
            <UserIcon className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {customerName ? customerName : 'Tambah Data Pelanggan'}
            </span>
            {(customerName || customerAddress) && (
              <span className="text-[9px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-wider">Terisi</span>
            )}
          </div>
          {showCustomerInfo
            ? <ChevronUp className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
          }
        </button>
        {showCustomerInfo && (
          <div className="px-4 pb-3 space-y-2 bg-card dark:bg-background border-b border-border dark:border-border shrink-0 animate-in slide-in-from-top-1 duration-200">
            <input
              className="w-full h-9 px-3 bg-background dark:bg-card border border-border dark:border-border rounded-lg text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary-500 transition-all"
              placeholder="Nama Pembeli (opsional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value.slice(0, 50))}
            />
            <textarea
              className="w-full px-3 py-2 bg-background dark:bg-card border border-border dark:border-border rounded-lg text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
              placeholder="Alamat (opsional)"
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value.slice(0, 100))}
              rows={2}
            />
          </div>
        )}

        {/* Checkout Box */}
        <div className="p-5 border-t border-border dark:border-border bg-card dark:bg-background flex flex-col gap-3 shrink-0 rounded-t-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] relative z-20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">Subtotal ({totalQty} Item)</span>
            <span className="text-sm font-bold font-mono text-foreground dark:text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
          </div>

          {taxEnabled && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">PPN ({taxRate}%)</span>
              <span className="text-sm font-bold font-mono text-foreground dark:text-foreground tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">Diskon Global</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">-Rp</span>
              <input
                type="number"
                className="w-24 text-right bg-transparent text-sm font-bold text-primary-600 dark:text-primary-400 border-b border-dashed border-primary-400/40 outline-none focus:border-primary-500 transition-colors tabular-nums"
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="w-full h-px bg-muted dark:bg-card my-1" />

          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">Total Tagihan</span>
            <span className="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tighter leading-none tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0 || total <= 0 || createTxMutation.isPending}
            className={cn(
              "w-full h-14 rounded-2xl flex items-center justify-center gap-3",
              "font-black text-base transition-all active:scale-[0.98]",
              cart.length === 0 || total <= 0 || createTxMutation.isPending
                ? "bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20"
            )}
          >
            <RetroWallet className="w-5 h-5" />
            BAYAR SEKARANG
          </button>

          <div className="grid grid-cols-3 text-center">
            <span className="text-[9px] font-mono text-muted-foreground dark:text-muted-foreground">
              <kbd className="border border-border dark:border-border px-1 rounded text-[8px]">Ctrl+K</kbd> Cari
            </span>
            <span className="text-[9px] font-mono text-muted-foreground dark:text-muted-foreground">
              <kbd className="border border-border dark:border-border px-1 rounded text-[8px]">F2</kbd> Scan
            </span>
            <span className="text-[9px] font-mono text-muted-foreground dark:text-muted-foreground">
              <kbd className="border border-border dark:border-border px-1 rounded text-[8px]">Space</kbd> Bayar
            </span>
          </div>
        </div>
      </aside>

      {/* ── Modals ── */}
      {showPayment && (
        <PaymentModal
          total={total}
          onConfirm={handlePayment}
          onClose={() => setShowPayment(false)}
          customerName={customerName}
          customerAddress={customerAddress}
          isSubmitting={createTxMutation.isPending}
        />
      )}
      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* Combined Transaction Success + Receipt Preview Dialog */}
      <Dialog open={showTxSuccess && !!lastTx} onOpenChange={handleCloseSuccess}>
        <DialogContent className={cn(
          "h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-card dark:bg-background",
          settings.receipt_width === 'cf' ? "sm:max-w-4xl" : "sm:max-w-xl"
        )}>
          <div className="p-6 border-b dark:border-border shrink-0">
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

            <div className="alert-adaptive-success rounded-xl px-5 py-4 border dark:border-border grid grid-cols-2 gap-4">
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
            <div className="flex-1 overflow-y-auto min-h-0 bg-muted dark:bg-background p-6 flex justify-center">
              {receiptHtml ? (
                <div className="bg-card w-full max-w-full p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3px] animate-in fade-in slide-in-from-bottom-4 duration-500 flex justify-center flex-shrink-0 h-fit">
                  <ReceiptIframe html={receiptHtml} width={settings.receipt_width === 'cf' ? '820px' : settings.receipt_width === '80' ? '302px' : '219px'} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                  <p className="text-sm font-medium">Memuat preview struk...</p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t dark:border-border flex gap-3 bg-background dark:bg-background shrink-0">
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
                  <RetroPrinter className="w-4 h-4" />
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
                  <RetroPrinter className="w-4 h-4 mr-1 animate-pulse" />
                )}
                {printing ? 'Mencetak...' : printDone ? 'Tercetak' : 'Mengirim ke printer...'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Alert Dialog */}
      <Dialog open={errorDialog.show} onOpenChange={(open) => !open && setErrorDialog(prev => ({ ...prev, show: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorDialog.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground dark:text-muted-foreground">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setErrorDialog(prev => ({ ...prev, show: false }))} variant="default" className="w-full sm:w-auto">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
