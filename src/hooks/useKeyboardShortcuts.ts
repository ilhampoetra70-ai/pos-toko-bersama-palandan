/**
 * Keyboard Shortcuts Hook for POS Application
 * Provides global and page-specific keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
  condition?: () => boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  dependencies: React.DependencyList = []
) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    shortcutsRef.current.forEach((shortcut) => {
      // Check modifier keys
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      
      // Check main key (case insensitive)
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       e.code === shortcut.key;
      
      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        // Check custom condition if provided
        if (shortcut.condition && !shortcut.condition()) {
          return;
        }
        
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        
        shortcut.action();
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcut keys for common actions
export const SHORTCUT_KEYS = {
  // Function keys
  HELP: 'F1',
  NEW_TRANSACTION: 'F2',
  SEARCH_PRODUCT: 'F3',
  CHECKOUT: 'F4',
  PRINT_LAST: 'F6',
  CALCULATOR: 'F7',
  HOLD_ORDER: 'F8',
  CUSTOMER: 'F9',
  SETTINGS: 'F10',
  FULLSCREEN: 'F11',
  EXIT: 'F12',
  
  // Navigation
  GO_HOME: 'Home',
  GO_CASHIER: 'Insert',
  GO_PRODUCTS: 'PageUp',
  GO_TRANSACTIONS: 'PageDown',
  GO_REPORTS: 'End',
  
  // Actions with modifiers
  SEARCH: 'KeyF', // Ctrl+F
  NEW: 'KeyN', // Ctrl+N
  PRINT: 'KeyP', // Ctrl+P
  SAVE: 'KeyS', // Ctrl+S
  CLOSE: 'Escape',
  
  // Numbers
  NUM_1: 'Digit1',
  NUM_2: 'Digit2',
  NUM_3: 'Digit3',
  NUMPAD_1: 'Numpad1',
  NUMPAD_2: 'Numpad2',
  NUMPAD_3: 'Numpad3',
} as const;

// Common shortcuts configuration builder
export function createCashierShortcuts(
  actions: {
    onNewTransaction: () => void;
    onSearchProduct: () => void;
    onCheckout: () => void;
    onOpenScanner: () => void;
    onPrintLast: () => void;
    onHoldOrder: () => void;
    onCustomer: () => void;
    onCalculator: () => void;
    onHelp: () => void;
    canCheckout: () => boolean;
  }
): ShortcutConfig[] {
  return [
    {
      key: SHORTCUT_KEYS.NEW_TRANSACTION,
      description: 'Transaksi Baru',
      action: actions.onNewTransaction,
    },
    {
      key: SHORTCUT_KEYS.SEARCH_PRODUCT,
      description: 'Cari Produk',
      action: actions.onSearchProduct,
    },
    {
      key: SHORTCUT_KEYS.CHECKOUT,
      description: 'Bayar/Checkout',
      action: actions.onCheckout,
      condition: actions.canCheckout,
    },
    {
      key: SHORTCUT_KEYS.SEARCH,
      ctrl: true,
      description: 'Cari Produk (Ctrl+F)',
      action: actions.onSearchProduct,
    },
    {
      key: SHORTCUT_KEYS.NEW,
      ctrl: true,
      description: 'Transaksi Baru (Ctrl+N)',
      action: actions.onNewTransaction,
    },
    {
      key: SHORTCUT_KEYS.PRINT_LAST,
      description: 'Cetak Struk Terakhir',
      action: actions.onPrintLast,
    },
    {
      key: SHORTCUT_KEYS.HOLD_ORDER,
      description: 'Simpan/Tampilkan Pesanan',
      action: actions.onHoldOrder,
    },
    {
      key: SHORTCUT_KEYS.CUSTOMER,
      description: 'Data Pelanggan',
      action: actions.onCustomer,
    },
    {
      key: SHORTCUT_KEYS.CALCULATOR,
      description: 'Kalkulator',
      action: actions.onCalculator,
    },
    {
      key: SHORTCUT_KEYS.HELP,
      description: 'Bantuan Shortcut',
      action: actions.onHelp,
    },
  ];
}

export function createNavigationShortcuts(
  navigate: (path: string) => void,
  isCashier: boolean
): ShortcutConfig[] {
  return [
    {
      key: SHORTCUT_KEYS.GO_HOME,
      description: 'Ke Dashboard',
      action: () => navigate('/'),
      condition: () => !isCashier,
    },
    {
      key: SHORTCUT_KEYS.GO_CASHIER,
      description: 'Ke Kasir',
      action: () => navigate('/cashier'),
    },
    {
      key: SHORTCUT_KEYS.GO_PRODUCTS,
      description: 'Ke Produk',
      action: () => navigate('/products'),
      condition: () => !isCashier,
    },
    {
      key: SHORTCUT_KEYS.GO_TRANSACTIONS,
      description: 'Ke Transaksi',
      action: () => navigate('/transactions'),
      condition: () => !isCashier,
    },
    {
      key: SHORTCUT_KEYS.GO_REPORTS,
      description: 'Ke Laporan',
      action: () => navigate('/reports'),
      condition: () => !isCashier,
    },
  ];
}
