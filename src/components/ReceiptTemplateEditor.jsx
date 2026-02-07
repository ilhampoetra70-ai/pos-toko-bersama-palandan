import { useState, useEffect, useRef, useCallback } from 'react';
import ReceiptIframe from './ReceiptIframe';

const DEFAULT_TEMPLATE = {
  sections: {
    logo: false,
    store_name: true,
    store_address: true,
    store_phone: true,
    invoice_info: true,
    tax_line: true,
    discount_line: true,
    payment_info: true,
    header_text: true,
    footer_text: true
  },
  font_size: 'medium'
};

const SECTION_LABELS = {
  logo: 'Logo Toko',
  store_name: 'Nama Toko',
  store_address: 'Alamat Toko',
  store_phone: 'Telepon Toko',
  invoice_info: 'Info Invoice (No, Kasir, Tanggal)',
  tax_line: 'Baris Pajak',
  discount_line: 'Baris Diskon',
  payment_info: 'Info Pembayaran (Tunai/Kembali)',
  header_text: 'Teks Header',
  footer_text: 'Teks Footer'
};

const SAMPLE_TRANSACTION = {
  invoice_number: 'INV-20260204-0001',
  cashier_name: 'Kasir Demo',
  subtotal: 85000,
  tax_amount: 9350,
  discount_amount: 5000,
  total: 89350,
  payment_method: 'cash',
  amount_paid: 100000,
  change_amount: 10650,
  created_at: new Date().toLocaleString('id-ID'),
  items: [
    { product_name: 'Nasi Goreng Spesial', quantity: 2, price: 25000, discount: 2500, subtotal: 45000 },
    { product_name: 'Es Teh Manis', quantity: 3, price: 8000, discount: 0, subtotal: 24000 },
    { product_name: 'Kerupuk', quantity: 4, price: 4000, discount: 0, subtotal: 16000 },
  ]
};

export default function ReceiptTemplateEditor({ onClose }) {
  const [settings, setSettings] = useState({});
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [logo, setLogo] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [receiptWidth, setReceiptWidth] = useState('58');
  const [previewHTML, setPreviewHTML] = useState('');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await window.api.getSettings();
    setSettings(s);
    setHeaderText(s.receipt_header || '');
    setFooterText(s.receipt_footer || '');
    setReceiptWidth(s.receipt_width || '58');
    setLogo(s.receipt_logo || '');

    try {
      const tmpl = JSON.parse(s.receipt_template || '{}');
      setTemplate({
        sections: { ...DEFAULT_TEMPLATE.sections, ...(tmpl.sections || {}) },
        font_size: tmpl.font_size || 'medium'
      });
    } catch {
      setTemplate(DEFAULT_TEMPLATE);
    }
  };

  const buildPreviewSettings = useCallback(() => {
    return {
      ...settings,
      receipt_template: JSON.stringify(template),
      receipt_logo: logo,
      receipt_header: headerText,
      receipt_footer: footerText,
      receipt_width: receiptWidth
    };
  }, [settings, template, logo, headerText, footerText, receiptWidth]);

  const updatePreview = useCallback(async () => {
    const previewSettings = buildPreviewSettings();
    const html = await window.api.getReceiptHTMLWithSettings(SAMPLE_TRANSACTION, previewSettings);
    setPreviewHTML(html);
  }, [buildPreviewSettings]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePreview();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [template, logo, headerText, footerText, receiptWidth, updatePreview]);

  const handleSectionToggle = (key) => {
    setTemplate(prev => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections[key] }
    }));
  };

  const handleFontSizeChange = (size) => {
    setTemplate(prev => ({ ...prev, font_size: size }));
  };

  const handleUploadLogo = async () => {
    const result = await window.api.uploadLogo();
    if (result.success) {
      setLogo(result.logo);
    }
  };

  const handleRemoveLogo = () => {
    setLogo('');
  };

  const handleSave = async () => {
    setSaving(true);
    await window.api.updateSettings({
      receipt_template: JSON.stringify(template),
      receipt_logo: logo,
      receipt_header: headerText,
      receipt_footer: footerText,
      receipt_width: receiptWidth
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Desain Template Struk</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left panel - Controls */}
          <div className="w-1/2 border-r overflow-y-auto p-5 space-y-5">
            {/* Section toggles */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Bagian yang Ditampilkan</h3>
              <div className="space-y-2">
                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.sections[key]}
                      onChange={() => handleSectionToggle(key)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Logo Toko</h3>
              <div className="flex items-center gap-3">
                <button onClick={handleUploadLogo} className="btn-secondary text-sm">
                  Upload Logo
                </button>
                {logo && (
                  <button onClick={handleRemoveLogo} className="text-red-500 hover:text-red-700 text-sm">
                    Hapus
                  </button>
                )}
              </div>
              {logo && (
                <div className="mt-2 p-2 bg-gray-50 rounded inline-block">
                  <img src={logo} alt="Logo" className="max-h-12" />
                </div>
              )}
              {!template.sections.logo && logo && (
                <p className="text-xs text-amber-600 mt-1">Logo tersimpan tapi tidak ditampilkan. Aktifkan toggle "Logo Toko" di atas.</p>
              )}
            </div>

            {/* Header/Footer text */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Teks Struk</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header</label>
                  <input
                    className="input-field text-sm"
                    value={headerText}
                    onChange={e => setHeaderText(e.target.value)}
                    placeholder="Terima Kasih Atas Kunjungan Anda"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Footer</label>
                  <input
                    className="input-field text-sm"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                    placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                  />
                </div>
              </div>
            </div>

            {/* Font size */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Ukuran Font</h3>
              <select
                className="input-field text-sm"
                value={template.font_size}
                onChange={e => handleFontSizeChange(e.target.value)}
              >
                <option value="small">Kecil (9px)</option>
                <option value="medium">Sedang (10px)</option>
                <option value="large">Besar (11px)</option>
              </select>
            </div>

            {/* Paper width */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Lebar Kertas</h3>
              <select
                className="input-field text-sm"
                value={receiptWidth}
                onChange={e => setReceiptWidth(e.target.value)}
              >
                <option value="58">58mm (Thermal kecil)</option>
                <option value="80">80mm (Thermal standar)</option>
              </select>
            </div>
          </div>

          {/* Right panel - Preview */}
          <div className="w-1/2 overflow-y-auto bg-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Preview Struk</h3>
            <div className="flex justify-center">
              <ReceiptIframe html={previewHTML} width={receiptWidth === '80' ? '302px' : '219px'} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Menyimpan...' : 'Simpan Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
