/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { Keyboard, X, Zap, Search, ShoppingCart, CreditCard, Printer, Calculator, User, HelpCircle, Home, Package, FileText, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: { key: string; desc: string; ctrl?: boolean }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigasi Umum',
    icon: <Home className="w-4 h-4" />,
    shortcuts: [
      { key: 'Insert', desc: 'Ke Halaman Kasir' },
      { key: 'Home', desc: 'Ke Dashboard (non-cashier)' },
      { key: 'PgUp', desc: 'Ke Produk (non-cashier)' },
      { key: 'PgDn', desc: 'Ke Transaksi (non-cashier)' },
      { key: 'End', desc: 'Ke Laporan (non-cashier)' },
    ],
  },
  {
    title: 'Kasir / Transaksi',
    icon: <ShoppingCart className="w-4 h-4" />,
    shortcuts: [
      { key: 'F2', desc: 'Transaksi Baru' },
      { key: 'F3', desc: 'Cari Produk' },
      { key: 'F4', desc: 'Bayar / Checkout' },
      { key: 'Ctrl + F', desc: 'Cari Produk', ctrl: true },
      { key: 'Ctrl + N', desc: 'Transaksi Baru', ctrl: true },
    ],
  },
  {
    title: 'Operasi Tambahan',
    icon: <Zap className="w-4 h-4" />,
    shortcuts: [
      { key: 'F6', desc: 'Cetak Struk Terakhir' },
      { key: 'F7', desc: 'Buka Kalkulator' },
      { key: 'F8', desc: 'Simpan/Tampilkan Pesanan' },
      { key: 'F9', desc: 'Data Pelanggan' },
    ],
  },
  {
    title: 'Lainnya',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcuts: [
      { key: 'F1', desc: 'Tampilkan Bantuan Ini' },
      { key: 'F10', desc: 'Pengaturan' },
      { key: 'F11', desc: 'Layar Penuh' },
      { key: 'Esc', desc: 'Tutup / Batal' },
    ],
  },
];

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Keyboard className="w-6 h-6 text-primary" />
            Pintasan Keyboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Quick Tip */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                Tips untuk Kasir
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Gunakan tombol <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900/50 rounded font-mono text-xs border">F2</kbd> untuk transaksi baru, 
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900/50 rounded font-mono text-xs border mx-1">F3</kbd> untuk mencari produk, dan 
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-900/50 rounded font-mono text-xs border">F4</kbd> untuk checkout.
              </p>
            </div>
          </div>

          {/* Shortcut Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHORTCUT_GROUPS.map((group) => (
              <div 
                key={group.title}
                className="border border-border rounded-xl p-4 bg-muted/30"
              >
                <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-foreground">
                  {group.icon}
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div 
                      key={shortcut.key + shortcut.desc}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{shortcut.desc}</span>
                      <kbd className={cn(
                        "px-2 py-1 rounded font-mono text-xs font-bold",
                        "bg-card border border-border shadow-sm",
                        shortcut.ctrl && "text-xs"
                      )}>
                        {shortcut.ctrl && 'Ctrl + '}
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Pintasan dapat digunakan di seluruh aplikasi
            </p>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage help modal visibility
export function useShortcutsHelp() {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  
  return { open, setOpen };
}
