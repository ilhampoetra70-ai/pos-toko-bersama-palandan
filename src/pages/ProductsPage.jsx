import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime, formatDateTimeFull } from '../utils/format';
import ExcelManager from '../components/ExcelManager';
import BarcodePreviewModal from '../components/BarcodePreviewModal';
import BatchBarcodeModal from '../components/BatchBarcodeModal';

// Format number with dot separator (1000 → 1.000)
const formatNumber = (value) => {
  const num = String(value).replace(/\D/g, '');
  if (!num) return '';
  return parseInt(num).toLocaleString('id-ID');
};

// Parse formatted number back to raw digits
const parseNumber = (formatted) => {
  return String(formatted).replace(/\D/g, '');
};

export default function ProductsPage() {
  const { hasRole, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showExcel, setShowExcel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ barcode: '', name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [error, setError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState(null);
  const [showBatchBarcode, setShowBatchBarcode] = useState(false);
  const barcodeCanvasRef = useRef(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadProducts(); }, [search, filterCategory]);

  const loadData = async () => {
    const cats = await window.api.getCategories();
    setCategories(cats);
    loadProducts();
  };

  const loadProducts = async () => {
    const data = await window.api.getProducts({ search, category_id: filterCategory || undefined, active: 1 });
    setProducts(data);
    setSelectedProducts([]);
  };

  const resetForm = () => {
    setForm({ barcode: '', name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
    setEditing(null);
    setShowForm(false);
    setShowNewCatInput(false);
    setNewCatName('');
    setError('');
  };

  const handleAddNew = async () => {
    const barcode = await window.api.generateBarcode();
    setForm({ barcode, name: '', category_id: '', price: '', cost: '', stock: '', unit: 'pcs' });
    setEditing(null);
    setShowNewCatInput(false);
    setNewCatName('');
    setError('');
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({
      barcode: product.barcode || '',
      name: product.name,
      category_id: product.category_id || '',
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      unit: product.unit
    });
    setShowNewCatInput(false);
    setNewCatName('');
    setShowForm(true);
  };

  const handleNumberChange = (field, value) => {
    const raw = parseNumber(value);
    setForm(f => ({ ...f, [field]: raw }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let categoryId = form.category_id || null;

      // Create or get existing category
      if (showNewCatInput && newCatName.trim()) {
        const cat = await window.api.createCategory(newCatName.trim(), '');
        categoryId = cat.id;
        const cats = await window.api.getCategories();
        setCategories(cats);
      }

      const data = {
        ...form,
        price: parseInt(form.price) || 0,
        cost: parseInt(form.cost) || 0,
        stock: parseInt(form.stock) || 0,
        category_id: categoryId
      };

      if (editing) {
        // Check if stock changed - use audit logging
        const stockChanged = editing.stock !== data.stock;
        if (stockChanged && user) {
          await window.api.updateProductWithAudit(editing.id, data, {
            userId: user.id,
            userName: user.name,
            source: 'manual'
          });
        } else {
          await window.api.updateProduct(editing.id, data);
        }
      } else {
        await window.api.createProduct(data);
      }
      resetForm();
      loadProducts();
      // Refresh stock history if viewing
      if (expandedProduct === editing?.id) {
        loadStockHistory(editing.id);
      }
    } catch (err) {
      setError('Gagal menyimpan: ' + (err.message || 'Error'));
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;
    await window.api.deleteProduct(product.id);
    loadProducts();
    if (expandedProduct === product.id) {
      setExpandedProduct(null);
      setStockHistory([]);
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      await window.api.createCategory(catForm.name, catForm.description);
      setCatForm({ name: '', description: '' });
      const cats = await window.api.getCategories();
      setCategories(cats);
    } catch (err) {
      alert('Gagal: ' + err.message);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
    await window.api.deleteCategory(cat.id);
    const cats = await window.api.getCategories();
    setCategories(cats);
  };

  const handleRegenerateBarcode = async () => {
    const barcode = await window.api.generateBarcode();
    setForm(f => ({ ...f, barcode }));
  };

  const showBarcodePreview = (product) => {
    if (!product.barcode) {
      alert('Produk ini tidak memiliki barcode');
      return;
    }
    setBarcodePreviewProduct(product);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Hapus ${selectedProducts.length} produk yang dipilih?`)) return;

    try {
      await window.api.bulkDeleteProducts(selectedProducts);
      loadProducts();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Stock history expandable row
  const toggleStockHistory = async (productId) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
      setStockHistory([]);
    } else {
      setExpandedProduct(productId);
      await loadStockHistory(productId);
    }
  };

  const loadStockHistory = async (productId) => {
    setLoadingHistory(true);
    try {
      const history = await window.api.getStockAuditByProduct(productId, 20);
      setStockHistory(history);
    } catch (err) {
      console.error('Failed to load stock history:', err);
      setStockHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const canEdit = hasRole('admin', 'supervisor');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Produk</h2>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button onClick={() => setShowExcel(true)} className="btn-secondary text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </span>
              </button>
              <button onClick={() => setShowCatForm(true)} className="btn-secondary text-sm">+ Kategori</button>
              <button onClick={handleAddNew} className="btn-primary text-sm">+ Tambah Produk</button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-4">
        <div className="flex gap-4">
          <input
            className="input-field flex-1"
            placeholder="Cari produk atau barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field w-48" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && canEdit && (
        <div className="card mb-4 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-700">
              {selectedProducts.length} produk dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBatchBarcode(true)}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Labels
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                Hapus Semua
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {canEdit && (
                <th className="px-4 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Barcode</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama Produk</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Modal</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Harga</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Stok</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Satuan</th>
              {canEdit && <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-gray-400">Tidak ada produk</td></tr>
            ) : products.map(p => (
              <React.Fragment key={p.id}>
                <tr className={`hover:bg-gray-50 ${selectedProducts.includes(p.id) ? 'bg-primary-50' : ''} ${expandedProduct === p.id ? 'bg-blue-50' : ''}`}>
                  {canEdit && (
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => toggleSelectProduct(p.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.barcode || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => toggleStockHistory(p.id)}
                      className={`font-medium hover:underline ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}
                      title="Klik untuk lihat riwayat perubahan stok"
                    >
                      {p.stock}
                      <svg className={`w-3 h-3 inline-block ml-1 transition-transform ${expandedProduct === p.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{p.unit}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.barcode && <button onClick={() => showBarcodePreview(p)} className="text-gray-500 hover:text-gray-700 text-sm mr-2" title="Print/download label barcode">Barcode</button>}
                      <button onClick={() => handleEdit(p)} className="text-primary-600 hover:text-primary-700 text-sm mr-2">Edit</button>
                      <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 text-sm">Hapus</button>
                    </td>
                  )}
                </tr>
                {/* Expandable Stock History Row */}
                {expandedProduct === p.id && (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="bg-gray-50 px-4 py-3">
                      <StockHistoryPanel
                        history={stockHistory}
                        loading={loadingHistory}
                        productName={p.name}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-semibold text-lg mb-4">{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
            {editing && parseInt(form.stock) !== editing.stock && (
              <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded mb-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Perubahan stok akan dicatat di audit log
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Barcode with auto-generate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / Kode Produk</label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1 font-mono tracking-wider"
                    value={form.barcode}
                    onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                    placeholder="12-digit kode produk"
                    maxLength={20}
                  />
                  {!editing && (
                    <button
                      type="button"
                      onClick={handleRegenerateBarcode}
                      className="btn-secondary text-sm shrink-0"
                      title="Generate ulang barcode"
                    >
                      Generate
                    </button>
                  )}
                </div>
                {!editing && <p className="text-xs text-gray-400 mt-1">Barcode 12-digit otomatis. Bisa diubah manual.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              {/* Category with inline add */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                {!showNewCatInput ? (
                  <div className="flex gap-2">
                    <select
                      className="input-field flex-1"
                      value={form.category_id}
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setShowNewCatInput(true); setForm(f => ({ ...f, category_id: '' })); }}
                      className="btn-secondary text-sm shrink-0"
                      title="Buat kategori baru"
                    >
                      + Baru
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      placeholder="Ketik nama kategori baru..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setShowNewCatInput(false); setNewCatName(''); }}
                      className="btn-secondary text-sm shrink-0"
                    >
                      Pilih
                    </button>
                  </div>
                )}
              </div>

              {/* Modal first, then Harga Jual */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field"
                    value={formatNumber(form.cost)}
                    onChange={e => handleNumberChange('cost', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field"
                    value={formatNumber(form.price)}
                    onChange={e => handleNumberChange('price', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok
                    {editing && (
                      <span className="text-gray-400 font-normal ml-1">(saat ini: {editing.stock})</span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input-field"
                    value={formatNumber(form.stock)}
                    onChange={e => handleNumberChange('stock', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input className="input-field" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-4">Kelola Kategori</h3>
            <form onSubmit={handleCatSubmit} className="flex gap-2 mb-4">
              <input className="input-field flex-1" placeholder="Nama kategori" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required />
              <button type="submit" className="btn-primary text-sm">Tambah</button>
            </form>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 text-sm hover:text-red-700">Hapus</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowCatForm(false)} className="btn-secondary">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Modal */}
      {showExcel && <ExcelManager onClose={() => { setShowExcel(false); loadProducts(); }} />}

      {/* Barcode Preview Modal */}
      {barcodePreviewProduct && (
        <BarcodePreviewModal
          product={barcodePreviewProduct}
          onClose={() => setBarcodePreviewProduct(null)}
        />
      )}

      {/* Batch Barcode Modal */}
      {showBatchBarcode && (
        <BatchBarcodeModal
          products={products.filter(p => selectedProducts.includes(p.id))}
          onClose={() => setShowBatchBarcode(false)}
        />
      )}

      <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

// Stock History Panel Component - Enhanced Audit Trail
function StockHistoryPanel({ history, loading, productName }) {
  const printAuditLog = () => {
    const printWindow = window.open('', '_blank');
    const now = new Date().toLocaleString('id-ID');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Trail - ${productName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          h1 { font-size: 16px; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 15px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f5f5f5; font-weight: bold; }
          .increase { color: #16a34a; }
          .decrease { color: #dc2626; }
          .arrow { font-size: 14px; }
          .change-badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; display: inline-block; }
          .change-badge.increase { background: #dcfce7; color: #16a34a; }
          .change-badge.decrease { background: #fee2e2; color: #dc2626; }
          .context-note { font-size: 10px; color: #666; margin-top: 4px; padding: 4px 6px; background: #f9fafb; border-radius: 3px; font-style: italic; }
          .retention-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 8px 12px; border-radius: 4px; margin-bottom: 15px; font-size: 10px; color: #92400e; }
          .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
          .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; text-align: center; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>AUDIT TRAIL PERUBAHAN STOK</h1>
        <div class="subtitle">
          Produk: <strong>${productName}</strong><br>
          Dicetak: ${now}
        </div>
        <div class="retention-notice">
          <strong>Catatan:</strong> Data audit trail disimpan selama 1 bulan sejak tanggal perubahan.
          Data yang lebih lama akan dihapus otomatis oleh sistem.
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px">No</th>
              <th style="width: 130px">Tanggal & Waktu</th>
              <th style="width: 80px">User</th>
              <th style="width: 100px">Perubahan</th>
              <th style="width: 60px">Selisih</th>
              <th>Catatan Konteks</th>
            </tr>
          </thead>
          <tbody>
            ${history.map((log, idx) => {
              const isIncrease = log.change_amount > 0;
              const arrow = isIncrease ? '↑' : '↓';
              const changeClass = isIncrease ? 'increase' : 'decrease';
              const sourceLabel = {
                'bulk_edit': 'Bulk Edit',
                'manual': 'Manual',
                'import': 'Import',
                'adjustment': 'Penyesuaian',
                'return': 'Retur',
                'damage': 'Rusak/Expired',
                'transfer': 'Transfer'
              }[log.source] || log.source;

              // Generate context note if not exists
              const contextNote = log.context_note || `${isIncrease ? 'Penambahan' : 'Pengurangan'} stok via ${sourceLabel.toLowerCase()}`;

              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${formatDateTimeFull(log.created_at)}</td>
                  <td>${log.user_name || '-'}</td>
                  <td>
                    <strong>${log.old_stock}</strong>
                    <span class="arrow ${changeClass}"> → </span>
                    <strong>${log.new_stock}</strong>
                  </td>
                  <td>
                    <span class="change-badge ${changeClass}">
                      ${arrow} ${isIncrease ? '+' : ''}${log.change_amount}
                    </span>
                  </td>
                  <td>
                    <div style="font-size:10px;color:#374151;">${contextNote}</div>
                    <div style="font-size:9px;color:#9ca3af;margin-top:2px;">Sumber: ${sourceLabel}</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Dokumen ini dicetak dari sistem POS sebagai bukti audit perubahan stok.</p>
          <p>Total perubahan tercatat: ${history.length} entri</p>
        </div>
        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line">Diperiksa Oleh</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Disetujui Oleh</div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
        Memuat riwayat...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-2 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Belum ada riwayat perubahan stok manual untuk produk ini
      </div>
    );
  }

  // Get source label
  const getSourceLabel = (source) => {
    const labels = {
      'bulk_edit': 'Bulk Edit',
      'manual': 'Manual',
      'import': 'Import',
      'adjustment': 'Penyesuaian'
    };
    return labels[source] || source;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Audit Trail Stok</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{history.length} perubahan</span>
        </div>
        <button
          onClick={printAuditLog}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak
        </button>
      </div>

      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50 rounded-t-lg border border-b-0 border-gray-200">
        <div className="col-span-3">Waktu</div>
        <div className="col-span-2">User</div>
        <div className="col-span-3">Perubahan</div>
        <div className="col-span-2">Selisih</div>
        <div className="col-span-2">Sumber</div>
      </div>

      <div className="space-y-0 max-h-72 overflow-y-auto border border-gray-200 rounded-b-lg sm:rounded-t-none rounded-t-lg">
        {history.map((log, idx) => {
          const isIncrease = log.change_amount > 0;
          // Generate context note if not exists in old data
          const contextNote = log.context_note ||
            `${isIncrease ? 'Penambahan' : 'Pengurangan'} stok via ${getSourceLabel(log.source).toLowerCase()}`;

          return (
            <div
              key={log.id}
              className={`px-3 py-2.5 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              } hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-b-0`}
            >
              {/* Main Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-sm">
                {/* Timestamp */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-xs">
                    {formatDateTimeFull(log.created_at)}
                  </span>
                </div>

                {/* User */}
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-gray-700 font-medium truncate" title={log.user_name}>
                    {log.user_name || '-'}
                  </span>
                </div>

                {/* Stock Change: From → To */}
                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <span className="font-mono font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                    {log.old_stock}
                  </span>
                  <span className={`text-lg ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                    →
                  </span>
                  <span className="font-mono font-medium text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                    {log.new_stock}
                  </span>
                </div>

                {/* Change Amount with Arrow */}
                <div className="sm:col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded ${
                    isIncrease
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span className="text-base">{isIncrease ? '↑' : '↓'}</span>
                    {isIncrease ? '+' : ''}{log.change_amount}
                  </span>
                </div>

                {/* Source */}
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {getSourceLabel(log.source)}
                  </span>
                </div>
              </div>

              {/* Context Note Row */}
              <div className="mt-1.5 text-xs text-gray-500 italic pl-0 sm:pl-0 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{contextNote}</span>
              </div>

              {/* Mobile: Additional Info */}
              <div className="sm:hidden text-xs text-gray-400 flex items-center gap-2 mt-1">
                <span>{log.user_name}</span>
                <span>•</span>
                <span>{getSourceLabel(log.source)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Retention Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 text-xs">
        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1">
            <span className="text-green-500">↑</span> Stok bertambah
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-500">↓</span> Stok berkurang
          </span>
        </div>
        <div className="text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Data disimpan 1 bulan</span>
        </div>
      </div>
    </div>
  );
}
