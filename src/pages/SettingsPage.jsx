import { useState, useEffect } from 'react';
import ReceiptTemplateEditor from '../components/ReceiptTemplateEditor';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [printers, setPrinters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [apiServerInfo, setApiServerInfo] = useState(null);

  // Theme settings
  const {
    appName, tagline, themeColor, darkMode,
    THEME_COLORS, DARK_MODES,
    setBranding, setThemeColor, setDarkMode, resetSettings: resetTheme
  } = useTheme();
  const [localAppName, setLocalAppName] = useState(appName);
  const [localTagline, setLocalTagline] = useState(tagline);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setLocalAppName(appName);
    setLocalTagline(tagline);
  }, [appName, tagline]);

  const handleSaveBranding = () => {
    setBranding(localAppName, localTagline);
    setMessage('Branding berhasil disimpan');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadData = async () => {
    const [s, p, apiInfo] = await Promise.all([
      window.api.getSettings(),
      window.api.getPrinters(),
      window.api.getApiServerInfo()
    ]);
    setSettings(s);
    setPrinters(p);
    setApiServerInfo(apiInfo);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    await window.api.updateSettings(settings);

    // Update window title with store name
    await window.api.setWindowTitle(settings.store_name || '');

    setMessage('Pengaturan berhasil disimpan');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTestPrint = async () => {
    const testTx = {
      invoice_number: 'TEST-001',
      cashier_name: 'Test',
      subtotal: 50000,
      tax_amount: 5500,
      discount_amount: 0,
      total: 55500,
      payment_method: 'cash',
      amount_paid: 60000,
      change_amount: 4500,
      created_at: new Date().toLocaleString('id-ID'),
      items: [
        { product_name: 'Produk Test 1', quantity: 2, price: 15000, subtotal: 30000 },
        { product_name: 'Produk Test 2', quantity: 1, price: 20000, subtotal: 20000 },
      ]
    };
    const result = await window.api.printReceipt(testTx);
    if (result.success) {
      setMessage('Test print berhasil');
    } else {
      setMessage('Test print gagal: ' + (result.error || 'Unknown'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pengaturan</h2>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.includes('gagal') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="card">
          <h3 className="font-semibold mb-4">Informasi Toko</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
              <input className="input-field" value={settings.store_name || ''} onChange={e => handleChange('store_name', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Nama toko juga akan tampil di judul jendela aplikasi</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input className="input-field" value={settings.store_address || ''} onChange={e => handleChange('store_address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input className="input-field" value={settings.store_phone || ''} onChange={e => handleChange('store_phone', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="card">
          <h3 className="font-semibold mb-4">Pajak</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tax_enabled === 'true'}
                  onChange={e => handleChange('tax_enabled', e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Aktifkan Pajak (PPN)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Pajak (%)</label>
              <input
                type="number"
                className="input-field"
                value={settings.tax_rate || '11'}
                onChange={e => handleChange('tax_rate', e.target.value)}
                min="0" max="100"
              />
            </div>
          </div>
        </div>

        {/* Printer Settings */}
        <div className="card">
          <h3 className="font-semibold mb-4">Printer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Printer Struk</label>
              <select
                className="input-field"
                value={settings.printer_name || ''}
                onChange={e => handleChange('printer_name', e.target.value)}
              >
                <option value="">-- Pilih Printer --</option>
                {printers.map(p => (
                  <option key={p.name} value={p.name}>{p.name}{p.isDefault ? ' (Default)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lebar Kertas (mm)</label>
              <select
                className="input-field"
                value={settings.receipt_width || '58'}
                onChange={e => handleChange('receipt_width', e.target.value)}
              >
                <option value="58">58mm (Thermal kecil)</option>
                <option value="80">80mm (Thermal standar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setelah Transaksi Selesai</label>
              <select
                className="input-field"
                value={settings.print_after_transaction || 'preview'}
                onChange={e => handleChange('print_after_transaction', e.target.value)}
              >
                <option value="preview">Tampilkan preview struk</option>
                <option value="auto_print">Langsung cetak struk</option>
                <option value="none">Tidak cetak (langsung transaksi baru)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Mengatur perilaku otomatis setelah pembayaran berhasil</p>
            </div>
            <button onClick={handleTestPrint} className="btn-secondary text-sm">Test Print</button>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="card">
          <h3 className="font-semibold mb-4">Struk</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Struk</label>
              <input className="input-field" value={settings.receipt_header || ''} onChange={e => handleChange('receipt_header', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Struk</label>
              <input className="input-field" value={settings.receipt_footer || ''} onChange={e => handleChange('receipt_footer', e.target.value)} />
            </div>
            <button
              onClick={() => setShowTemplateEditor(true)}
              className="btn-secondary text-sm"
            >
              Desain Template Struk
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-4">Tampilan Aplikasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branding */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Branding</h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nama Aplikasi</label>
                <input
                  className="input-field"
                  value={localAppName}
                  onChange={e => setLocalAppName(e.target.value)}
                  placeholder="POS Kasir"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tagline</label>
                <input
                  className="input-field"
                  value={localTagline}
                  onChange={e => setLocalTagline(e.target.value)}
                  placeholder="Sistem Kasir Modern"
                />
              </div>
              <button onClick={handleSaveBranding} className="btn-secondary text-sm">
                Simpan Branding
              </button>
            </div>

            {/* Theme & Dark Mode */}
            <div className="space-y-4">
              {/* Theme Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Warna Tema</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(THEME_COLORS).map(([key, { name, color }]) => (
                    <button
                      key={key}
                      onClick={() => setThemeColor(key)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        themeColor === key
                          ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tema saat ini: <span className="font-medium">{THEME_COLORS[themeColor]?.name}</span>
                </p>
              </div>

              {/* Dark Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode Tampilan</label>
                <div className="flex gap-2">
                  {Object.entries(DARK_MODES).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setDarkMode(key)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        darkMode === key
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary-400 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {key === 'auto' && '🖥️ '}
                      {key === 'light' && '☀️ '}
                      {key === 'dark' && '🌙 '}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  resetTheme();
                  setLocalAppName('POS Kasir');
                  setLocalTagline('Sistem Kasir Modern');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Reset ke default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Checker API */}
      <div className="card mt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Self-Service Price Checker
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Hubungkan tablet atau HP untuk cek harga mandiri. API server berjalan otomatis saat aplikasi dibuka.
        </p>
        {apiServerInfo ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">Server Aktif</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat Lokal:</span>
                <code className="bg-white px-2 py-0.5 rounded text-gray-800">{apiServerInfo.localUrl}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat Jaringan:</span>
                <code className="bg-white px-2 py-0.5 rounded text-primary-600 font-semibold">{apiServerInfo.networkUrl}</code>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">Cara Setup Price Checker:</p>
              <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                <li>Buka browser di tablet/HP yang terhubung WiFi sama</li>
                <li>Akses <strong>{apiServerInfo.networkUrl.replace('/api', '')}/price-checker</strong></li>
                <li>Masukkan alamat server: <strong>{apiServerInfo.networkUrl}</strong></li>
                <li>Klik "Add to Home Screen" untuk install sebagai app</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-yellow-700">Server tidak aktif</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {showTemplateEditor && (
        <ReceiptTemplateEditor
          onClose={() => {
            setShowTemplateEditor(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
