import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';
import PaymentModal from '../components/PaymentModal';
import BarcodeScanner from '../components/BarcodeScanner';
import ReceiptIframe from '../components/ReceiptIframe';

export default function CashierPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [settings, setSettings] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [showTxSuccess, setShowTxSuccess] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [printing, setPrinting] = useState(false);
  const [printDone, setPrintDone] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, filterCat]);

  const loadInitial = async () => {
    const [cats, s] = await Promise.all([
      window.api.getCategories(),
      window.api.getSettings()
    ]);
    setCategories(cats);
    setSettings(s);
    loadProducts();
  };

  const loadProducts = async () => {
    const data = await window.api.getProducts({
      search: search || undefined,
      category_id: filterCat || undefined,
      active: 1
    });
    setProducts(data);
  };

  // ─── Cart Operations ───────────────────────────────
  const addToCart = (product) => {
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
        quantity: 1,
        discount: 0,
        subtotal: product.price,
        unit: product.unit,
        max_stock: product.stock
      }];
    });
  };

  const updateCartQty = (index, qty) => {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      item.quantity = Math.min(qty, item.max_stock);
      item.subtotal = (item.price - item.discount) * item.quantity;
      return updated;
    });
  };

  const updateCartDiscount = (index, disc) => {
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      item.discount = Math.min(Math.max(0, disc), item.price);
      item.subtotal = (item.price - item.discount) * item.quantity;
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerAddress('');
    setShowCustomerInfo(false);
  };

  // ─── Calculations ──────────────────────────────────
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxEnabled = settings.tax_enabled === 'true';
  const taxRate = parseInt(settings.tax_rate || '11');
  const taxAmount = taxEnabled ? Math.round(subtotal * taxRate / 100) : 0;
  const total = subtotal + taxAmount - discount;

  // ─── Barcode Handling ──────────────────────────────
  const handleBarcodeDetected = async (code) => {
    setShowScanner(false);
    const product = await window.api.getProductByBarcode(code);
    if (product) {
      addToCart(product);
    } else {
      alert(`Produk dengan barcode "${code}" tidak ditemukan`);
    }
    searchRef.current?.focus();
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const product = await window.api.getProductByBarcode(search.trim());
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

  // ─── Receipt helpers ───────────────────────────────
  const loadReceiptPreview = async (tx) => {
    const html = await window.api.getReceiptHTML(tx);
    setReceiptHtml(html);
  };

  const doPrint = async (tx) => {
    setPrinting(true);
    const result = await window.api.printReceipt(tx);
    setPrinting(false);
    if (!result.success) {
      alert('Print gagal: ' + (result.error || 'Unknown error'));
      return false;
    }
    return true;
  };

  // ─── Payment ───────────────────────────────────────
  const handlePayment = async (paymentData) => {
    const items = cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      discount: item.discount,
      subtotal: item.subtotal
    }));

    console.log('[CashierPage] Cart items to save:', items.length, items);

    const txData = {
      user_id: user.id,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      total,
      payment_method: paymentData.payment_method,
      amount_paid: paymentData.amount_paid,
      change_amount: paymentData.change_amount,
      customer_name: customerName.trim() || null,
      customer_address: customerAddress.trim() || null,
      // Payment status fields
      payment_status: paymentData.payment_status || 'lunas',
      due_date: paymentData.due_date || null,
      initial_payment: paymentData.initial_payment || null,
      payment_notes: paymentData.payment_notes || null,
      items
    };

    let tx;
    try {
      tx = await window.api.createTransaction(txData);
      console.log('[CashierPage] Transaction created:', tx?.id, 'items:', tx?.items?.length);
    } catch (err) {
      console.error('[CashierPage] createTransaction FAILED:', err);
      alert('Gagal menyimpan transaksi: ' + (err.message || 'Unknown error'));
      return;
    }

    if (!tx) {
      console.error('[CashierPage] createTransaction returned null');
      alert('Gagal menyimpan transaksi');
      return;
    }

    setLastTx(tx);
    setShowPayment(false);
    clearCart();
    loadProducts();

    // Reload settings to get latest print_after_transaction value
    const freshSettings = await window.api.getSettings();
    setSettings(freshSettings);
    const printMode = freshSettings.print_after_transaction || 'preview';

    if (printMode === 'none') {
      // No popup, ready for next transaction
      searchRef.current?.focus();
      return;
    }

    if (printMode === 'auto_print') {
      // Show success popup briefly, auto-print in background
      setReceiptHtml('');
      setPrintDone(false);
      setShowTxSuccess(true);
      loadReceiptPreview(tx);
      const ok = await doPrint(tx);
      if (ok) setPrintDone(true);
      return;
    }

    // printMode === 'preview' (default)
    setReceiptHtml('');
    setPrintDone(false);
    setShowTxSuccess(true);
    loadReceiptPreview(tx);
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
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              ref={searchRef}
              className="input-field pl-10"
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={() => setShowScanner(true)} className="btn-secondary shrink-0 flex items-center gap-1" title="Scan Barcode">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${!filterCat ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(filterCat === String(cat.id) ? '' : String(cat.id))}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filterCat === String(cat.id) ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onClick={addToCart} />
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Tidak ada produk ditemukan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-80 bg-white rounded-xl shadow-sm border flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Keranjang</h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-red-500 text-xs hover:text-red-700">Hapus Semua</button>
            )}
          </div>
        </div>

        <Cart items={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onUpdateDiscount={updateCartDiscount} />

        {/* Customer Info (Collapsible) */}
        <div className="border-t">
          <button
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Info Pembeli
              {(customerName || customerAddress) && (
                <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Terisi</span>
              )}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showCustomerInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCustomerInfo && (
            <div className="px-4 pb-3 space-y-2">
              <input
                type="text"
                className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Nama Pembeli (opsional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value.slice(0, 50))}
                maxLength={50}
              />
              <textarea
                className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 resize-none"
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
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {taxEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">PPN ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Diskon</span>
            <input
              type="number"
              className="w-28 border rounded px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-primary-500"
              value={discount || ''}
              onChange={e => setDiscount(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary-600">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0 || total <= 0}
            className="btn-success w-full py-3 text-lg font-bold mt-2"
          >
            Bayar
          </button>
        </div>
      </div>

      {/* Modals */}
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

      {/* Combined Transaction Success + Receipt Preview Popup */}
      {showTxSuccess && lastTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header: success info */}
            <div className="p-5 border-b">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800">Transaksi Berhasil</h3>
                  <p className="text-xs text-gray-400 font-mono">{lastTx.invoice_number}</p>
                </div>
                <button onClick={handleCloseSuccess} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(lastTx.total)}</div>
                </div>
                {lastTx.change_amount > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Kembalian</div>
                    <div className="text-xl font-bold text-gray-800">{formatCurrency(lastTx.change_amount)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt preview */}
            {(printMode === 'preview' || printMode === 'auto_print') && (
              <div className="flex-1 overflow-auto bg-gray-100 p-4" style={{ minHeight: '200px' }}>
                {receiptHtml ? (
                  <ReceiptIframe html={receiptHtml} width="280px" />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat preview...</div>
                )}
              </div>
            )}

            {/* Footer buttons */}
            <div className="p-4 border-t flex gap-3">
              <button onClick={handleCloseSuccess} className="btn-secondary flex-1 py-2.5">
                Transaksi Baru
              </button>
              {printMode === 'preview' && (
                <button
                  onClick={handlePrintFromPopup}
                  disabled={printing || printDone}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-2 ${printDone ? 'bg-green-100 text-green-700 rounded-lg font-medium' : 'btn-primary'}`}
                >
                  {printing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Mencetak...
                    </>
                  ) : printDone ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Tercetak
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Cetak Struk
                    </>
                  )}
                </button>
              )}
              {printMode === 'auto_print' && (
                <div className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg font-medium ${printDone ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                  {printing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Mencetak...
                    </>
                  ) : printDone ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Tercetak
                    </>
                  ) : (
                    'Mengirim ke printer...'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
