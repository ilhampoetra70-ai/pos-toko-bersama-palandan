import { useState, useEffect, useRef, useCallback } from 'react';
import ReceiptIframe from './ReceiptIframe';
import { Settings, Transaction } from '@/lib/types';
import { X, Save, Upload, Trash2, Smartphone, Monitor, Type, Layout as LayoutIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReceiptTemplateEditorProps {
    onClose: () => void;
}

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

const SECTION_LABELS: Record<string, string> = {
    logo: 'Logo Toko',
    store_name: 'Nama Toko',
    store_address: 'Alamat Toko',
    store_phone: 'Telepon Toko',
    invoice_info: 'Info Invoice',
    tax_line: 'Baris Pajak',
    discount_line: 'Baris Diskon',
    payment_info: 'Info Pembayaran',
    header_text: 'Teks Header',
    footer_text: 'Teks Footer'
};

const SAMPLE_TRANSACTION: Partial<Transaction> = {
    invoice_number: 'INV-20260204-0001',
    items: [
        { product_name: 'Nasi Goreng Spesial', quantity: 2, price: 25000, discount: 2500, subtotal: 45000 } as any,
        { product_name: 'Es Teh Manis', quantity: 3, price: 8000, discount: 0, subtotal: 24000 } as any,
        { product_name: 'Kerupuk', quantity: 4, price: 4000, discount: 0, subtotal: 16000 } as any,
    ],
    subtotal: 85000,
    tax_amount: 9350,
    discount_amount: 5000,
    total: 89350,
    amount_paid: 100000,
    change_amount: 10650,
    payment_method: 'cash',
    created_at: new Date().toISOString(),
};

export default function ReceiptTemplateEditor({ onClose }: ReceiptTemplateEditorProps) {
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [template, setTemplate] = useState<any>(DEFAULT_TEMPLATE);
    const [logo, setLogo] = useState('');
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [receiptWidth, setReceiptWidth] = useState('58');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [previewHTML, setPreviewHTML] = useState('');
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await (window as any).api.getSettings();
        const allTemplates = await (window as any).api.getReceiptTemplates();
        setTemplates(allTemplates);
        setSettings(s);
        setHeaderText(s.receipt_header || '');
        setFooterText(s.receipt_footer || '');
        setReceiptWidth(s.receipt_width || '58');
        setLogo(s.receipt_logo || '');
        setSelectedTemplateId(s.receipt_template_id || null);

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

    const getFilteredTemplates = () => {
        const widthKey = receiptWidth === '80' ? '80mm' : '58mm';
        return templates.filter(t => t.width === widthKey);
    };

    const buildPreviewSettings = useCallback(() => {
        return {
            ...settings,
            receipt_template: JSON.stringify(template),
            receipt_logo: logo,
            receipt_header: headerText,
            receipt_footer: footerText,
            receipt_width: receiptWidth,
            receipt_template_id: selectedTemplateId
        };
    }, [settings, template, logo, headerText, footerText, receiptWidth, selectedTemplateId]);

    const updatePreview = useCallback(async () => {
        const previewSettings = buildPreviewSettings();
        const html = await (window as any).api.getReceiptHTMLWithSettings(SAMPLE_TRANSACTION, previewSettings);
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
    }, [template, logo, headerText, footerText, receiptWidth, selectedTemplateId, updatePreview]);

    const handleSectionToggle = (key: string) => {
        setTemplate((prev: any) => ({
            ...prev,
            sections: { ...prev.sections, [key]: !prev.sections[key] }
        }));
    };

    const handleFontSizeChange = (size: string) => {
        setTemplate((prev: any) => ({ ...prev, font_size: size }));
    };

    const handleUploadLogo = async () => {
        const result = await (window as any).api.uploadLogo();
        if (result.success) {
            setLogo(result.logo);
        }
    };

    const handleRemoveLogo = () => {
        setLogo('');
    };

    const handleSave = async () => {
        setSaving(true);
        await (window as any).api.updateSettings({
            receipt_template: JSON.stringify(template),
            receipt_logo: logo,
            receipt_header: headerText,
            receipt_footer: footerText,
            receipt_width: receiptWidth,
            receipt_template_id: selectedTemplateId
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">Editor Template Struk</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Personalisasi tampilan bukti transaksi Anda</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left panel - Controls */}
                    <div className="w-[45%] border-r dark:border-gray-800 overflow-y-auto p-10 space-y-10">
                        {/* Paper width */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <LayoutIcon className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Ukuran Kertas</h3>
                            </div>
                            <div className="flex gap-3">
                                {['58', '80'].map(width => (
                                    <button
                                        key={width}
                                        onClick={() => {
                                            setReceiptWidth(width);
                                            setSelectedTemplateId(null);
                                        }}
                                        className={cn(
                                            "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all",
                                            receiptWidth === width
                                                ? "border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                                : "border-gray-100 dark:border-gray-800 text-gray-400 dark:bg-gray-900 hover:border-gray-200"
                                        )}
                                    >
                                        {width}mm {width === '58' ? '(Kecil)' : '(Standar)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Pilih Desain Basis</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {getFilteredTemplates().map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.id)}
                                        className={cn(
                                            "p-4 text-[10px] font-black uppercase tracking-widest border-2 rounded-2xl text-left transition-all",
                                            selectedTemplateId === t.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 ring-4 ring-primary-500/10"
                                                : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                                        )}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Komponen Tampilan</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl cursor-pointer group transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{label}</span>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={template.sections[key]}
                                                onChange={() => handleSectionToggle(key)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Logo upload */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Identitas Visual</h3>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center gap-4">
                                {logo ? (
                                    <div className="relative group">
                                        <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border dark:border-gray-800">
                                            <img src={logo} alt="Logo" className="max-h-20 max-w-[150px] object-contain" />
                                        </div>
                                        <button onClick={handleRemoveLogo} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-white dark:bg-gray-950 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner border dark:border-gray-800">
                                            <Upload className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo Belum Diatur</p>
                                    </div>
                                )}
                                <Button onClick={handleUploadLogo} variant="secondary" className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]">
                                    {logo ? 'Ganti Logo Toko' : 'Upload Logo Toko'}
                                </Button>
                                {!template.sections.logo && logo && (
                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center">Catatan: Komponen Logo sedang dinonaktifkan di atas</p>
                                )}
                            </div>
                        </div>

                        {/* Header/Footer text */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Type className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Informasi Tambahan</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Teks Header</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-sm font-bold resize-none shadow-inner focus:ring-2 focus:ring-primary-500/20"
                                        value={headerText}
                                        onChange={e => setHeaderText(e.target.value)}
                                        placeholder="Contoh: Selamat Datang!"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Teks Footer</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-sm font-bold resize-none shadow-inner focus:ring-2 focus:ring-primary-500/20"
                                        value={footerText}
                                        onChange={e => setFooterText(e.target.value)}
                                        placeholder="Contoh: Barang tidak dapat dikembalikan"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Font size */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Type className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Ukuran Tipografi</h3>
                            </div>
                            <div className="flex gap-2">
                                {['small', 'medium', 'large'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => handleFontSizeChange(size)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all",
                                            template.font_size === size
                                                ? "bg-gray-900 text-white dark:bg-primary-600 dark:border-primary-500 shadow-md"
                                                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:bg-gray-100"
                                        )}
                                    >
                                        {size === 'small' ? 'Kecil' : size === 'medium' ? 'Normal' : 'Besar'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right panel - Preview */}
                    <div className="w-[55%] overflow-y-auto bg-gray-100/80 dark:bg-gray-900/80 p-10 flex flex-col items-center">
                        <div className="sticky top-0 w-full mb-8 flex justify-between items-center bg-white/40 dark:bg-black/20 backdrop-blur-sm p-4 rounded-2xl border dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300">Live Preview</h3>
                            </div>
                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest bg-white dark:bg-gray-950">
                                Real-time Render
                            </Badge>
                        </div>
                        <div className="flex-1 w-full flex items-start justify-center pb-20">
                            <div className="bg-white p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3px]">
                                <ReceiptIframe html={previewHTML} width={receiptWidth === '80' ? '302px' : '219px'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 px-10 py-8 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <Button variant="ghost" onClick={onClose} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:text-gray-600">Batal</Button>
                    <Button onClick={handleSave} disabled={saving} className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-primary-600/20">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'MENYIMPAN...' : 'TERAPKAN PERUBAHAN'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
