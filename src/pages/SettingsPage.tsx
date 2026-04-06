import { useState, useEffect, memo } from 'react';
import ReceiptTemplateEditor from '../components/ReceiptTemplateEditor';
import TOTPSettings from '../components/TOTPSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Store, Settings2, Paintbrush, ShieldCheck, Info, Clock, Phone, MapPin, Percent, Monitor, CheckCircle2, Image as ImageIcon, RotateCcw, Cloud, Server, Zap, Lock, ChevronRight, Sun, Moon, Type, AlertCircle, Shield, Layout, Activity, Save, ArrowDownToLine, Smartphone } from 'lucide-react';
import { RetroPrinter, RetroDatabase, RetroReceipt } from '../components/RetroIcons';
import { Transaction } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default memo(function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [printers, setPrinters] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [apiServerInfo, setApiServerInfo] = useState<any>(null);
  const [masterKeyDisplay, setMasterKeyDisplay] = useState<string | null>(null);
  const [masterKeyVisible, setMasterKeyVisible] = useState(false);
  const [masterKeyConfirming, setMasterKeyConfirming] = useState(false);
  const [printerError, setPrinterError] = useState<any>(null);

  const { hasRole } = useAuth() as any;
  const isCashier = !hasRole('admin', 'supervisor');

  const {
    appName, tagline, themeColor, darkMode, fontFamily,
    THEME_COLORS, DARK_MODES, FONTS,
    setBranding, setThemeColor, setDarkMode, setFontFamily, resetSettings: resetTheme
  } = useTheme() as any;
  const [localAppName, setLocalAppName] = useState(appName);
  const [localTagline, setLocalTagline] = useState(tagline);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setLocalAppName(appName);
    setLocalTagline(tagline);
  }, [appName, tagline]);

  const loadData = async () => {
    const promises: Promise<any>[] = [
      window.api.getSettings(),
      window.api.getPrinters(),
    ];
    if (!isCashier) promises.push(window.api.getApiServerInfo());
    const [sRes, pRes, apiInfoRes] = await Promise.all(promises);

    // Extract data handling both wrapped and raw responses
    const s = sRes?.data || sRes || {};
    const p = pRes?.data || (Array.isArray(pRes) ? pRes : []);
    const apiInfo = apiInfoRes?.data || apiInfoRes || null;

    setSettings(s);
    setPrinters(prev => {
      if (JSON.stringify(prev) === JSON.stringify(p)) return prev;
      return p;
    });
    if (!isCashier) setApiServerInfo(apiInfo);

    // Apply font size setting
    if (s.app_font_size) {
      document.documentElement.setAttribute('data-font-size', s.app_font_size);
    }

    // Cek apakah ada master key baru yang belum dikonfirmasi admin
    if (!isCashier && window.api.getMasterKeyDisplay) {
      try {
        const mkRes = await window.api.getMasterKeyDisplay();
        if (mkRes?.key) setMasterKeyDisplay(mkRes.key);
      } catch (_) { /* non-critical */ }
    }

    // Cek validasi printer (dari startup validation)
    if (window.api.getPrinterValidationError) {
      try {
        const valRes = await window.api.getPrinterValidationError();
        if (valRes?.saved) setPrinterError(valRes);
      } catch (_) { /* non-critical */ }
    }
  };

  const handleSaveBranding = async () => {
    await window.api.updateSettings({
      app_name: localAppName,
      tagline: localTagline
    });
    setBranding(localAppName, localTagline, settings.app_logo);
    setMessage('Branding berhasil disimpan');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUploadLogo = async () => {
    const result = await window.api.uploadAppLogo();
    if (result.success) {
      setSettings((prev: any) => ({ ...prev, app_logo: result.logo }));
      setBranding(localAppName, localTagline, result.logo);
      setMessage('Logo aplikasi berhasil diubah');
    } else if (result.error !== 'Cancelled') {
      setMessage('Gagal upload logo: ' + result.error);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    await window.api.updateSettings(settings);
    setMessage('Pengaturan berhasil disimpan');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTestPrint = async () => {
    const testTransaction: Transaction = {
      id: 0,
      invoice_number: 'INV-TEST-001',
      cashier_name: 'Kasir Test',
      subtotal: 100000,
      tax_amount: 11000,
      discount_amount: 0,
      total: 111000,
      payment_method: 'cash',
      amount_paid: 150000,
      change_amount: 39000,
      created_at: new Date().toISOString(),
      status: 'completed',
      payment_status: 'paid',
      remaining_balance: 0,
      items: [
        { id: 1, transaction_id: 0, product_id: 1, product_name: 'Produk Test 1', quantity: 2, price: 25000, subtotal: 50000 },
        { id: 2, transaction_id: 0, product_id: 2, product_name: 'Produk Test 2', quantity: 1, price: 50000, subtotal: 50000 }
      ]
    };
    const result = await window.api.printReceipt(testTransaction);
    if (result.success) {
      setMessage('Test print berhasil');
    } else {
      setMessage('Test print gagal: ' + (result.error || 'Unknown'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">Pengaturan</h2>
          <p className="text-sm text-muted-foreground font-medium">
            {isCashier ? 'Konfigurasi printer dan tampilan aplikasi' : 'Konfigurasi toko, perangkat, dan tema aplikasi'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-11 px-8 bg-foreground text-background hover:bg-black shadow-lg font-black transition-all">
          {saving ? <RotateCcw className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          message.includes('gagal')
            ? "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/20"
            : "bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/20"
        )}>
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-bold">{message}</p>
        </div>
      )}

      <Tabs defaultValue={isCashier ? 'printer' : 'store'} className="w-full">
        <TabsList className={cn(
          "bg-muted dark:bg-card p-1 h-12 rounded-xl w-full grid",
          isCashier ? "grid-cols-2 max-w-xs" : "grid-cols-2 lg:grid-cols-4 lg:max-w-2xl"
        )}>
          {!isCashier && (
            <TabsTrigger value="store" className="rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <Store className="w-4 h-4" /> Informasi Toko
            </TabsTrigger>
          )}
          <TabsTrigger value="printer" className="rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-muted data-[state=active]:shadow-sm">
            <RetroPrinter className="w-4 h-4" /> Informasi Printer
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-muted data-[state=active]:shadow-sm">
            <Paintbrush className="w-4 h-4" /> Tampilan & Tema
          </TabsTrigger>
          {!isCashier && (
            <TabsTrigger value="system" className="rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <RetroDatabase className="w-4 h-4" /> Sistem & API
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6 space-y-6">
          {!isCashier && <TabsContent value="store" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary-600 dark:text-primary-400" /> Identitas Toko
                  </CardTitle>
                  <CardDescription>Informasi ini akan muncul di struk dan laporan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nama Toko</label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                      <Input className="pl-10 h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={settings.store_name || ''} onChange={e => handleChange('store_name', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                      <Input className="pl-10 h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={settings.store_address || ''} onChange={e => handleChange('store_address', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Telepon / WhatsApp</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                        <Input className="pl-10 h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={settings.store_phone || ''} onChange={e => handleChange('store_phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Zona Waktu</label>
                      <div className="h-11 rounded-md bg-background dark:bg-card/50 border-none shadow-inner px-3 flex items-center text-sm text-muted-foreground">
                        Otomatis mengikuti waktu sistem
                      </div>
                      {(() => {
                        try {
                          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                          return (
                            <p className="text-[10px] px-1 text-muted-foreground">
                              OS/Sistem terdeteksi di: <span className="font-semibold text-foreground">{tz}</span>
                            </p>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" /> Pengaturan Pajak
                  </CardTitle>
                  <CardDescription>Konfigurasi PPN untuk transaksi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-background dark:bg-card/50 rounded-2xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black">Aktifkan PPN</Label>
                      <p className="text-xs text-muted-foreground">Otomatis tambahkan pajak ke struk</p>
                    </div>
                    <Switch
                      checked={settings.tax_enabled === 'true'}
                      onCheckedChange={val => handleChange('tax_enabled', val ? 'true' : 'false')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tarif Pajak (%)</label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                      <Input
                        type="number"
                        className="pl-10 h-11 bg-background dark:bg-card/50 border-none shadow-inner"
                        value={settings.tax_rate || '11'}
                        onChange={e => handleChange('tax_rate', e.target.value)}
                        min="0" max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                <MarginSettingsCard
                  defaultMargin={settings.default_margin_percent}
                  onSave={() => { loadData(); setMessage('Margin berhasil diupdate'); setTimeout(() => setMessage(''), 3000); }}
                />
              </div>
            </div>
          </TabsContent>}

          <TabsContent value="printer" className="m-0 focus-visible:outline-none">
            {/* Warning jika printer validation gagal */}
            {printerError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Printer Tidak Ditemukan</h4>
                    <p className="text-red-700 dark:text-red-400 text-xs mt-1">
                      Printer "<strong>{printerError.saved}</strong>" yang tersimpan tidak ditemukan di sistem.
                      Mungkin driver di-reinstall atau printer dicabut.
                    </p>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-2">
                      Silakan pilih ulang printer di bawah ini.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <RetroPrinter className="w-5 h-5 text-primary dark:text-primary" /> Perangkat Printer
                  </CardTitle>
                  <CardDescription>Pilih printer thermal yang tersedia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nama Printer</label>
                    <Select value={settings.printer_name || ''} onValueChange={val => handleChange('printer_name', val)}>
                      <SelectTrigger className="h-11 bg-background dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                        <SelectValue placeholder="Pilih Printer" />
                      </SelectTrigger>
                      <SelectContent>
                        {printers.map(p => (
                          <SelectItem key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Default)' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Lebar Kertas</label>
                      <Select value={settings.receipt_width || '58'} onValueChange={val => handleChange('receipt_width', val)}>
                        <SelectTrigger className="h-11 bg-background dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58">58mm (Kecil)</SelectItem>
                          <SelectItem value="80">80mm (Standar)</SelectItem>
                          <SelectItem value="cf">9.5×11" (Continuous Form)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={handleTestPrint} className="w-full h-11 font-bold gap-2">
                        <Zap className="w-4 h-4 text-orange-500" /> Test Print
                      </Button>
                    </div>
                  </div>

                  {/* Print Offset Settings */}
                  <div className="mt-6 p-4 bg-muted/30 dark:bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Layout className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Koreksi Posisi Print (mm)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Margin Atas</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          className="h-10 bg-background dark:bg-card/50 border-none shadow-inner"
                          value={settings.print_margin_top || '10'}
                          onChange={e => handleChange('print_margin_top', e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Margin Bawah</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          className="h-10 bg-background dark:bg-card/50 border-none shadow-inner"
                          value={settings.print_margin_bottom || '10'}
                          onChange={e => handleChange('print_margin_bottom', e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Margin Kiri</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          className="h-10 bg-background dark:bg-card/50 border-none shadow-inner"
                          value={settings.print_margin_left || '5'}
                          onChange={e => handleChange('print_margin_left', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Margin Kanan</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          className="h-10 bg-background dark:bg-card/50 border-none shadow-inner"
                          value={settings.print_margin_right || '5'}
                          onChange={e => handleChange('print_margin_right', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 px-1">
                      💡 Tips: Naikkan "Margin Atas" jika header struk terpotong. Sesuaikan margin kiri/kanan jika tulisan terlalu mepet tepi kertas.
                    </p>
                  </div>

                  {/* Line Height & Spacing Settings */}
                  <div className="mt-4 p-4 bg-muted/30 dark:bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Layout className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Jarak antar Baris & Item</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">
                          Jarak Baris (Line Height)
                          <span className="block text-[9px] font-normal normal-case text-muted-foreground/70">
                            {parseFloat(settings.print_line_height || '1.4') <= 1.1 ? 'Rapat (Hemat Kertas)' :
                              parseFloat(settings.print_line_height || '1.4') >= 1.6 ? 'Renggang (Mudah Baca)' : 'Normal'}
                          </span>
                        </label>
                        <Select
                          value={String(settings.print_line_height || '1.4')}
                          onValueChange={val => handleChange('print_line_height', val)}
                        >
                          <SelectTrigger className="h-10 bg-background dark:bg-card/50 border-none shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.0">1.0 - Sangat Rapat</SelectItem>
                            <SelectItem value="1.1">1.1 - Rapat</SelectItem>
                            <SelectItem value="1.2">1.2 - Semi Rapat</SelectItem>
                            <SelectItem value="1.4">1.4 - Normal (Default)</SelectItem>
                            <SelectItem value="1.6">1.6 - Renggang</SelectItem>
                            <SelectItem value="1.8">1.8 - Sangat Renggang</SelectItem>
                            <SelectItem value="2.0">2.0 - Extra Renggang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">
                          Spasi antar Item
                          <span className="block text-[9px] font-normal normal-case text-muted-foreground/70">
                            Jarak antar produk di struk
                          </span>
                        </label>
                        <Select
                          value={settings.print_item_spacing || 'normal'}
                          onValueChange={val => handleChange('print_item_spacing', val)}
                        >
                          <SelectTrigger className="h-10 bg-background dark:bg-card/50 border-none shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact - Rapat (Hemat)</SelectItem>
                            <SelectItem value="normal">Normal - Standar</SelectItem>
                            <SelectItem value="relaxed">Relaxed - Renggang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 px-1">
                      💡 Tips: Pilih "Rapat" jika struk terlalu panjang. Pilih "Renggang" jika tulisan terlalu padat dan sulit dibaca.
                    </p>
                  </div>

                  {/* Page Break & Gap Control - Untuk menghemat kertas antar struk */}
                  <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Hemat Kertas antar Struk</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase px-1">
                          Jarak antar Struk
                          <span className="block text-[9px] font-normal normal-case text-amber-700/70 dark:text-amber-300/70">
                            {settings.print_page_gap === 'none' ? 'Tanpa jarak (paling hemat)' :
                              settings.print_page_gap === 'compact' ? 'Jarak minimal' : 'Jarak standar'}
                          </span>
                        </label>
                        <Select
                          value={settings.print_page_gap || 'compact'}
                          onValueChange={val => handleChange('print_page_gap', val)}
                        >
                          <SelectTrigger className="h-10 bg-background dark:bg-card/50 border-amber-200 dark:border-amber-900/30 shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None - Rapat (Ekonomis)</SelectItem>
                            <SelectItem value="compact">Compact - Minimal (Default)</SelectItem>
                            <SelectItem value="normal">Normal - Standar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase px-1">
                          Minimal Tinggi Struk
                          <span className="block text-[9px] font-normal normal-case text-amber-700/70 dark:text-amber-300/70">
                            Untuk item sedikit agar tidak terlalu pendek
                          </span>
                        </label>
                        <Select
                          value={settings.print_min_height || 'auto'}
                          onValueChange={val => handleChange('print_min_height', val)}
                        >
                          <SelectTrigger className="h-10 bg-background dark:bg-card/50 border-amber-200 dark:border-amber-900/30 shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto - Sesuai isi</SelectItem>
                            <SelectItem value="50mm">50mm - Minimal</SelectItem>
                            <SelectItem value="80mm">80mm - Sedang</SelectItem>
                            <SelectItem value="100mm">100mm - Panjang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-3 px-1">
                      ⚠️ <strong>Tips Hemat Kertas:</strong> Pilih "None - Rapat" untuk menghemat kertas continuous form. Gunakan "Minimal Tinggi Struk" jika struk dengan item sedikit terlalu pendek.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Perilaku Cetak Otomatis</label>
                    <Select value={settings.print_after_transaction || 'preview'} onValueChange={val => handleChange('print_after_transaction', val)}>
                      <SelectTrigger className="h-11 bg-background dark:bg-card/50 border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preview">Tampilkan Preview (Manual)</SelectItem>
                        <SelectItem value="auto_print">Langsung Cetak (Auto)</SelectItem>
                        <SelectItem value="none">Jangan Cetak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm h-full bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <RetroReceipt className="w-5 h-5 text-primary-600 dark:text-primary-400" /> Konten Struk
                  </CardTitle>
                  <CardDescription>Header, footer, dan desain template struk belanja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCashier && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Header (Atas)</label>
                        <Input className="h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={settings.receipt_header || ''} onChange={e => handleChange('receipt_header', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Footer (Bawah)</label>
                        <Input className="h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={settings.receipt_footer || ''} onChange={e => handleChange('receipt_footer', e.target.value)} />
                      </div>
                    </>
                  )}
                  <Button onClick={() => setShowTemplateEditor(true)} className="w-full h-11 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 border-none shadow-none font-bold gap-2">
                    <Paintbrush className="w-4 h-4" /> Buka Desainer Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {!isCashier && (
                <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                  <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-primary-600 dark:text-primary-400" /> Branding Aplikasi
                      </CardTitle>
                      <CardDescription>Sesuaikan nama dan logo aplikasi</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { resetTheme(); setLocalAppName('POS Kasir'); setLocalTagline('Sistem Kasir Modern'); }} className="text-muted-foreground hover:text-red-500">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6 p-4 bg-background dark:bg-card/50 rounded-3xl border border-dashed border-border dark:border-border">
                      <div className="w-20 h-20 bg-card dark:bg-card rounded-2xl flex items-center justify-center border-2 border-border dark:border-border overflow-hidden shadow-inner group relative">
                        {settings.app_logo ? (
                          <img src={settings.app_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-3xl text-muted-foreground dark:text-muted-foreground font-black">{localAppName.charAt(0)}</span>
                        )}
                        <button onClick={handleUploadLogo} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-muted-foreground">Logo Aplikasi</p>
                        <Button onClick={handleUploadLogo} size="sm" variant="outline" className="h-8 font-bold text-xs uppercase">Ganti Logo</Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nama Aplikasi</label>
                        <Input className="h-11 bg-background dark:bg-card/50 border-none shadow-inner font-bold" value={localAppName} onChange={e => setLocalAppName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tagline</label>
                        <Input className="h-11 bg-background dark:bg-card/50 border-none shadow-inner" value={localTagline} onChange={e => setLocalTagline(e.target.value)} />
                      </div>
                      <Button onClick={handleSaveBranding} className="w-full h-11 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 font-bold">
                        Terapkan Branding
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className={cn("border-none shadow-sm bg-card dark:bg-background overflow-hidden", isCashier && "lg:col-span-2")}>
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-purple-600" /> Kustomisasi Tema
                  </CardTitle>
                  <CardDescription>Warna, mode, dan tipografi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Warna Aksen</label>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(THEME_COLORS).map(([key, { name, color, gradient }]: any) => (
                        <button
                          key={key}
                          onClick={() => setThemeColor(key)}
                          className={cn(
                            "w-10 h-10 rounded-2xl transition-all relative flex items-center justify-center",
                            themeColor === key ? "ring-4 ring-gray-100 dark:ring-gray-800 scale-110 shadow-lg" : "hover:scale-105"
                          )}
                          style={gradient ? { background: gradient } : { backgroundColor: color }}
                          title={name}
                        >
                          {themeColor === key && <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 text-muted-foreground">Mode Tampilan</label>
                    <div className="grid grid-cols-3 gap-2 bg-background dark:bg-card/50 p-1.5 rounded-2xl">
                      {Object.entries(DARK_MODES).map(([key, label]: any) => (
                        <button
                          key={key}
                          onClick={() => setDarkMode(key)}
                          className={cn(
                            "flex items-center justify-center gap-2 h-10 px-3 text-xs font-bold rounded-xl transition-all",
                            darkMode === key ? "bg-card dark:bg-muted text-primary-700 dark:text-primary-300 shadow-md translate-y-[-1px]" : "text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                          )}
                        >
                          {key === 'auto' && <Monitor className="w-4 h-4" />}
                          {key === 'light' && <Sun className="w-4 h-4" />}
                          {key === 'dark' && <Moon className="w-4 h-4" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tipografi (Font)</label>
                    <Select value={fontFamily || 'system'} onValueChange={setFontFamily}>
                      <SelectTrigger className="h-11 bg-background dark:bg-card/50 border-none shadow-inner font-bold data-[state=open]:bg-card dark:data-[state=open]:bg-background">
                        <Type className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FONTS).map(([key, { name, value }]: any) => (
                          <SelectItem key={key} value={key} style={{ fontFamily: value }}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Font Size Settings Card */}
              <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Ukuran Font Aplikasi
                  </CardTitle>
                  <CardDescription>Sesuaikan ukuran teks tampilan aplikasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FontSizeSettings
                    currentSize={settings.app_font_size || 'md'}
                    onChange={(size) => {
                      handleChange('app_font_size', size);
                      // Apply immediately
                      document.documentElement.setAttribute('data-font-size', size);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {!isCashier && <TabsContent value="system" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Server className="w-5 h-5 text-green-600" /> Server PWA & Price Checker
                  </CardTitle>
                  <CardDescription>Akses PWA Admin & cek harga via smartphone/tablet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {apiServerInfo ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/20">
                        <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
                        <p className="text-sm font-black text-green-700 dark:text-green-400">API Server Aktif</p>
                      </div>
                      <div className="space-y-2 p-4 bg-background dark:bg-card/50 rounded-2xl border border-border dark:border-border">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border dark:border-border pb-1 mb-2">Price Checker</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-bold uppercase text-[10px]">Local URL:</span>
                          <code className="bg-card dark:bg-background px-3 py-1 rounded-lg font-sans text-xs">{apiServerInfo.localUrl}</code>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-4">
                          <span className="text-muted-foreground font-bold uppercase text-[10px]">Network URL:</span>
                          <code className="bg-primary-50 dark:bg-primary-950/30 px-3 py-1 rounded-lg font-bold text-primary-700 dark:text-primary-400 text-xs">{apiServerInfo.networkUrl}</code>
                        </div>

                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border dark:border-border pb-1 mb-2 mt-4">Aplikasi Admin PWA</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-bold uppercase text-[10px]">Local URL:</span>
                          <code className="bg-card dark:bg-background px-3 py-1 rounded-lg font-sans text-xs">{apiServerInfo.localUrl}/admin</code>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-bold uppercase text-[10px]">Network URL:</span>
                          <code className="bg-primary-50 dark:bg-primary-950/30 px-3 py-1 rounded-lg font-bold text-primary-700 dark:text-primary-400 text-xs">{apiServerInfo.networkUrl}/admin</code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl border border-yellow-100 dark:border-yellow-900/20 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Server Tidak Aktif</p>
                    </div>
                  )}

                  <div className="p-4 bg-primary/50 dark:bg-primary/10 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black text-primary-foreground dark:text-primary uppercase tracking-widest">Langkah Setup:</p>
                    <ul className="text-xs space-y-2 text-primary-foreground dark:text-primary font-medium">
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Connect HP/Tablet ke WiFi yang sama</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Scan QR atau ketik URL Network di Browser</li>
                      <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Install sebagai aplikasi (Add to Home Screen)</li>
                    </ul>
                  </div>
                  <CloudflareSection />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm h-full bg-card dark:bg-background overflow-hidden">
                <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-600" /> Keamanan TOTP
                  </CardTitle>
                  <CardDescription>Google Authenticator untuk password reset</CardDescription>
                </CardHeader>
                <CardContent>
                  <TOTPSettings onMessage={setMessage} />
                </CardContent>
              </Card>

              {/* ─── Master Key Display Banner ─────────────────────────────── */}
              {/* Hanya muncul saat instalasi pertama — setelah dikonfirmasi, tidak pernah muncul lagi */}
              {masterKeyDisplay && (
                <div className="lg:col-span-2">
                  <Card className="border-2 border-amber-400 dark:border-amber-600 shadow-lg bg-amber-50 dark:bg-amber-950/40 overflow-hidden">
                    <CardHeader className="bg-amber-100/80 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/60 pb-3">
                      <CardTitle className="text-base font-black flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <Lock className="w-5 h-5" />
                        Master Key Baru Berhasil Dibuat
                      </CardTitle>
                      <CardDescription className="text-amber-700 dark:text-amber-400 font-medium">
                        Catat Master Key ini sekarang! Key ini hanya ditampilkan <strong>sekali</strong> dan tidak bisa dipulihkan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                      {/* Key Display */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest px-1">
                          Master Key Anda
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              id="master-key-display-input"
                              type={masterKeyVisible ? 'text' : 'password'}
                              readOnly
                              value={masterKeyDisplay}
                              className="w-full h-11 px-4 rounded-xl bg-white dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 font-mono text-sm font-bold tracking-widest text-amber-900 dark:text-amber-200 focus:outline-none cursor-default select-all"
                            />
                          </div>
                          {/* Toggle Visibility */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/30 shrink-0"
                            onClick={() => setMasterKeyVisible(v => !v)}
                            title={masterKeyVisible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {masterKeyVisible
                              ? <AlertCircle className="w-4 h-4" />
                              : <Shield className="w-4 h-4" />
                            }
                          </Button>
                          {/* Copy to Clipboard */}
                          <Button
                            variant="outline"
                            className="h-11 px-4 border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/30 font-bold text-xs gap-2 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(masterKeyDisplay).then(() => {
                                setMessage('Master Key berhasil disalin ke clipboard!');
                                setTimeout(() => setMessage(''), 3000);
                              });
                            }}
                          >
                            <Save className="w-4 h-4" />
                            Salin
                          </Button>
                        </div>
                      </div>

                      {/* Warning */}
                      <div className="p-3 bg-amber-200/50 dark:bg-amber-900/30 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                          ⚠️ <strong>Simpan key ini di tempat aman</strong> (password manager, catatan fisik tersembunyi). Key ini digunakan sebagai <em>last resort</em> untuk mereset password jika TOTP tidak tersedia. Setelah tombol <strong>"Sudah Dicatat"</strong> diklik, key tidak bisa dilihat lagi melalui aplikasi.
                        </p>
                      </div>

                      {/* Confirm Button */}
                      <div className="flex justify-end">
                        <Button
                          className="h-11 px-8 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-black gap-2 shadow-md shadow-amber-600/20"
                          disabled={masterKeyConfirming}
                          onClick={async () => {
                            setMasterKeyConfirming(true);
                            try {
                              await window.api.clearMasterKeyDisplay();
                              setMasterKeyDisplay(null);
                              setMasterKeyVisible(false);
                              setMessage('Master Key telah disimpan dan dihapus dari sistem. Jaga baik-baik!');
                              setTimeout(() => setMessage(''), 5000);
                            } catch (e) {
                              setMessage('Gagal konfirmasi. Coba lagi.');
                              setTimeout(() => setMessage(''), 3000);
                            } finally {
                              setMasterKeyConfirming(false);
                            }
                          }}
                        >
                          {masterKeyConfirming
                            ? <><RotateCcw className="w-4 h-4 animate-spin" /> Memproses...</>
                            : <><CheckCircle2 className="w-4 h-4" /> Sudah Dicatat, Hapus dari Sistem</>
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>}
        </div>
      </Tabs>

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
});

// Internal Components
function MarginSettingsCard({ defaultMargin, onSave }: any) {
  const [margin, setMargin] = useState(defaultMargin || '10.5');
  const [mode, setMode] = useState('new_only');
  const [stats, setStats] = useState({ total: 0, auto: 0, manual: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    setMargin(defaultMargin || '10.5');
    loadStats();
  }, [defaultMargin]);

  const loadStats = async () => {
    setLoading(true);
    const data = await window.api.getMarginStats();
    setStats(data);
    setLoading(false);
  };

  const handleApply = async () => {
    setApplyError('');
    setSaving(true);
    try {
      const result = await window.api.updateMargin(margin, mode);
      if (result.success) {
        setShowApplyDialog(false);
        onSave();
        loadStats();
      }
    } catch (err: any) {
      setApplyError('Gagal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-card dark:bg-background overflow-hidden">
      <CardHeader className="bg-background/50 dark:bg-card/50 border-b dark:border-border">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> Otomatisasi Harga & Margin
        </CardTitle>
        <CardDescription>Gunakan harga jual untuk kalkulasi otomatis harga modal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Global Margin (%)</label>
              <Input
                type="number"
                className="h-11 bg-background dark:bg-card/50 border-none shadow-inner font-black"
                value={margin}
                onChange={e => setMargin(e.target.value)}
              />
              <p className="text-[9px] text-muted-foreground font-medium px-1 uppercase tracking-tighter">Modal = Jual * (1 - Margin%)</p>
            </div>
            <div className="p-4 bg-background dark:bg-card/50 rounded-2xl border border-border dark:border-border space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cakupan Data</p>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Auto-Margin</span>
                <span className="text-green-600 dark:text-green-400">{stats.auto} Item</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Manual-Mode</span>
                <span className="text-orange-600 dark:text-orange-400">{stats.manual} Item</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 lg:col-span-2 space-y-3">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Mode Penerapan</p>
            <div className="grid grid-cols-1 gap-2">
              <ModeButton
                active={mode === 'new_only'}
                onClick={() => setMode('new_only')}
                title="Item Baru Saja"
                desc="Berlaku hanya untuk input produk di masa depan"
              />
              <ModeButton
                active={mode === 'auto_only'}
                onClick={() => setMode('auto_only')}
                title="Update Auto-Mode"
                desc={`Update ${stats.auto} produk yang saat ini mode Auto`}
              />
              <ModeButton
                active={mode === 'force_all'}
                onClick={() => setMode('force_all')}
                danger={true}
                title="Timpa SEMUA Data"
                desc={`Update ${stats.total} produk (Termasuk mode Manual)`}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-background dark:bg-card/50 p-6 border-t dark:border-border">
        <Button onClick={() => setShowApplyDialog(true)} disabled={saving} className={cn(
          "w-full h-11 font-black shadow-lg",
          mode === 'force_all' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
        )}>
          {saving ? 'Melakukan Sinkronisasi...' : 'Terapkan Aturan Margin Keren Ini'}
        </Button>
      </CardFooter>

      <Dialog open={showApplyDialog} onOpenChange={open => { setShowApplyDialog(open); setApplyError(''); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Konfirmasi Terapkan Margin</DialogTitle>
            <DialogDescription>
              Terapkan aturan margin ini sekarang? {mode === 'force_all' && <strong className="text-red-600"> Semua data akan ditimpa.</strong>}
            </DialogDescription>
          </DialogHeader>
          {applyError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowApplyDialog(false); setApplyError(''); }} className="font-bold" disabled={saving}>Batal</Button>
            <Button onClick={handleApply} disabled={saving} className={cn("font-black", mode === 'force_all' ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700")}>
              {saving ? 'Memproses...' : 'Ya, Terapkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ModeButton({ active, onClick, title, desc, danger }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-3 rounded-2xl border transition-all text-left",
        active
          ? (danger
            ? "bg-red-50 border-red-500 ring-2 ring-red-100 dark:bg-red-950/30 dark:border-red-600 dark:ring-red-900/20"
            : "bg-primary-50 border-primary-500 ring-2 ring-primary-100 dark:bg-primary-950/30 dark:border-primary-600 dark:ring-primary-900/20")
          : "bg-card dark:bg-background border-border dark:border-border hover:border-border dark:hover:border-gray-700"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className={cn("text-xs font-black", active ? (danger ? "text-red-700 dark:text-red-400" : "text-primary-700 dark:text-primary-400") : "text-foreground dark:text-foreground")}>{title}</span>
        {active && <CheckCircle2 className={cn("w-4 h-4", danger ? "text-red-500" : "text-primary-600 dark:text-primary-400")} />}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{desc}</p>
    </button>
  );
}

function CloudflareSection() {
  const [installing, setInstalling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const handleInstallService = async () => {
    setConfirmPending(false);
    setInstalling(true); setResult(null);
    try {
      const res = await window.api.installCloudflareService();
      setResult({ success: res.success, message: res.success ? 'Service Berhasil Terinstal' : 'Gagal: ' + res.error });
    } catch (err: any) { setResult({ success: false, message: err.message }); } finally { setInstalling(false); }
  };

  return (
    <div className="pt-6 border-t border-dashed border-border dark:border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          <span className="text-sm font-black">Windows Service Automation</span>
        </div>
        {result && (
          <Badge className={cn("font-bold text-[10px] shadow-none", result.success ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")}>
            {result.message}
          </Badge>
        )}
      </div>
      {confirmPending ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirmPending(false)} className="flex-1 font-bold h-11">Batal</Button>
          <Button onClick={handleInstallService} className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 font-black">Ya, Instal</Button>
        </div>
      ) : (
        <Button
          onClick={() => setConfirmPending(true)}
          disabled={installing}
          className="w-full h-11 bg-background dark:bg-card/50 text-muted-foreground dark:text-muted-foreground border border-border dark:border-border hover:bg-card dark:hover:bg-card shadow-none font-bold gap-2"
        >
          {installing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-primary-600" />}
          {installing ? 'Memproses Instalasi...' : 'Instal Cloudflare Automation Service'}
        </Button>
      )}
    </div>
  );
}

// Font Size Options
const FONT_SIZE_OPTIONS = [
  { value: 'xs', label: 'Sangat Kecil', description: '90%', className: 'text-[13px]' },
  { value: 'sm', label: 'Kecil', description: '95%', className: 'text-[14px]' },
  { value: 'md', label: 'Normal', description: '100%', className: 'text-[15px]' },
  { value: 'lg', label: 'Besar', description: '110%', className: 'text-[16px]' },
  { value: 'xl', label: 'Sangat Besar', description: '120%', className: 'text-[18px]' },
];

interface FontSizeSettingsProps {
  currentSize: string;
  onChange: (size: string) => void;
}

function FontSizeSettings({ currentSize, onChange }: FontSizeSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {FONT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
              currentSize === option.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/50 hover:bg-muted"
            )}
          >
            <span className={cn("font-bold mb-1", option.className)}>Aa</span>
            <span className="text-[10px] font-bold uppercase tracking-wide">{option.label}</span>
            <span className="text-[9px] text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="p-4 bg-muted/50 rounded-xl">
        <p className="text-xs text-muted-foreground text-center">
          Preview: <span className={cn("font-medium text-foreground",
            FONT_SIZE_OPTIONS.find(o => o.value === currentSize)?.className
          )}>
            Ukuran font saat ini
          </span>
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        💡 Tips: Ukuran font akan diterapkan ke seluruh tampilan aplikasi setelah disimpan.
      </p>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
