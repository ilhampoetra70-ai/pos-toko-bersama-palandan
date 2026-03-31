import { useState, useEffect, useRef, useCallback } from 'react';
import ReceiptIframe from './ReceiptIframe';
import { Settings, Transaction } from '@/lib/types';
import { X, Save, Upload, Smartphone, Monitor, Type, Layout as LayoutIcon, Loader2 } from 'lucide-react';
import { RetroTrash } from '../components/RetroIcons';
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
    cashier_name: 'Budi Santoso',
    customer_name: 'AHMAD YANI',
    customer_address: 'JL. MERDEKA NO.1',
    payment_status: 'lunas' as any,
    payment_notes: '',
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
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [previewHTML, setPreviewHTML] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sRes = (await window.api.getSettings()) || {};
            const allTemplates = (await window.api.getReceiptTemplates()) || [];

            setTemplates(allTemplates);
            setSettings(sRes);
            setHeaderText(sRes.receipt_header || '');
            setFooterText(sRes.receipt_footer || '');
            setReceiptWidth(sRes.receipt_width ? String(sRes.receipt_width) : '58');
            setLogo(sRes.receipt_logo || '');
            setSelectedTemplateId(sRes.receipt_template_id || null);

            try {
                const tmpl = JSON.parse(sRes.receipt_template || '{}');
                setTemplate({
                    sections: { ...DEFAULT_TEMPLATE.sections, ...(tmpl.sections || {}) },
                    font_size: tmpl.font_size || 'medium'
                });
            } catch {
                setTemplate(DEFAULT_TEMPLATE);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getFilteredTemplates = () => {
        const widthKey = receiptWidth === '80' ? '80mm' : receiptWidth === 'cf' ? 'cf' : '58mm';
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
        const html = await window.api.getReceiptHTMLWithSettings(SAMPLE_TRANSACTION as any, previewSettings as any);
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
        setSaveError('');
        try {
            await window.api.updateSettings({
                receipt_template: JSON.stringify(template),
                receipt_logo: logo,
                receipt_header: headerText,
                receipt_footer: footerText,
                receipt_width: receiptWidth,
                receipt_template_id: selectedTemplateId ?? ''
            });
            onClose();
        } catch (err: any) {
            setSaveError('Gagal menyimpan pengaturan: ' + (err?.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b dark:border-border bg-background/50 dark:bg-background/50">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground dark:text-foreground">Editor Template Struk</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Personalisasi tampilan bukti transaksi Anda</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-all font-black"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left panel - Controls */}
                    <div className="w-[45%] border-r dark:border-border overflow-y-auto p-10 space-y-10">
                        {/* Paper width */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <LayoutIcon className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Ukuran Kertas</h3>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {[
                                    { id: '58', label: '58mm', desc: 'Kecil' },
                                    { id: '80', label: '80mm', desc: 'Standar' },
                                    { id: 'cf', label: '9.5×11"', desc: 'Continuous' },
                                ].map(({ id, label, desc }) => (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            setReceiptWidth(id);
                                            setSelectedTemplateId(null);
                                        }}
                                        className={cn(
                                            "flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all leading-tight",
                                            receiptWidth === id
                                                ? "border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                                : "border-border dark:border-border text-muted-foreground dark:bg-background hover:border-border"
                                        )}
                                    >
                                        {label}<br /><span className="text-[9px] opacity-70">({desc})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pilih Desain Basis</h3>
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
                                                : "border-border dark:border-border text-muted-foreground dark:text-muted-foreground hover:bg-background dark:hover:bg-background"
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
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Komponen Tampilan</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                                    <label key={key} className="flex items-center justify-between p-4 bg-background dark:bg-background rounded-2xl cursor-pointer group transition-colors hover:bg-muted dark:hover:bg-card">
                                        <span className="text-xs font-bold text-muted-foreground dark:text-muted-foreground group-hover:text-primary-600 transition-colors uppercase tracking-tight">{label}</span>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={template.sections[key]}
                                                onChange={() => handleSectionToggle(key)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-border peer-checked:bg-primary-600"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Logo upload */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-primary-500" />
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Identitas Visual</h3>
                            </div>
                            <div className="bg-background dark:bg-background rounded-[2rem] p-6 border-2 border-dashed border-border dark:border-border flex flex-col items-center gap-4">
                                {logo ? (
                                    <div className="relative group">
                                        <div className="p-4 bg-card dark:bg-background rounded-2xl shadow-sm border dark:border-border">
                                            <img src={logo} alt="Logo" className="max-h-20 max-w-[150px] object-contain" />
                                        </div>
                                        <button onClick={handleRemoveLogo} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100">
                                            <RetroTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-card dark:bg-background rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner border dark:border-border">
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logo Belum Diatur</p>
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
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Informasi Tambahan</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Teks Header</label>
                                    <textarea
                                        className="w-full bg-background dark:bg-background border-none rounded-2xl p-4 text-sm font-bold resize-none shadow-inner focus:ring-2 focus:ring-primary-500/20"
                                        value={headerText}
                                        onChange={e => setHeaderText(e.target.value)}
                                        placeholder="Contoh: Selamat Datang!"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Teks Footer</label>
                                    <textarea
                                        className="w-full bg-background dark:bg-background border-none rounded-2xl p-4 text-sm font-bold resize-none shadow-inner focus:ring-2 focus:ring-primary-500/20"
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
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Ukuran Tipografi</h3>
                            </div>
                            <div className="flex gap-2">
                                {['small', 'medium', 'large'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => handleFontSizeChange(size)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all",
                                            template.font_size === size
                                                ? "bg-foreground text-background text-white dark:bg-primary-600 dark:border-primary-500 shadow-md"
                                                : "bg-card dark:bg-background border-border dark:border-border text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {size === 'small' ? 'Kecil' : size === 'medium' ? 'Normal' : 'Besar'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right panel - Preview */}
                    <div className="w-[55%] overflow-y-auto bg-muted/80 dark:bg-background/80 p-10 flex flex-col items-center">
                        <div className="sticky top-0 w-full mb-8 flex justify-between items-center bg-card/40 dark:bg-black/20 backdrop-blur-sm p-4 rounded-2xl border dark:border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">Live Preview</h3>
                            </div>
                            <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest bg-card dark:bg-background">
                                Real-time Render
                            </Badge>
                        </div>
                        <div className="flex-1 w-full pb-20 flex items-start justify-center">
                            <div className="bg-card w-full max-w-full p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3px] flex-shrink-0 flex justify-center">
                                <ReceiptIframe
                                    html={previewHTML}
                                    width={receiptWidth === 'cf' ? '820px' : receiptWidth === '80' ? '302px' : '219px'}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 px-10 py-8 border-t dark:border-border bg-background/50 dark:bg-background/50">
                    {saveError && (
                        <p className="text-xs font-bold text-red-500 text-right">{saveError}</p>
                    )}
                    <div className="flex justify-end gap-4">
                    <Button variant="ghost" onClick={onClose} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground hover:text-muted-foreground">Batal</Button>
                    <Button onClick={handleSave} disabled={saving} className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-primary-600/20">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'MENYIMPAN...' : 'TERAPKAN PERUBAHAN'}
                    </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
