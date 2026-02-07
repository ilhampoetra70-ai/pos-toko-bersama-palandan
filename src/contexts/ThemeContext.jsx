import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext();

const THEME_COLORS = {
  blue: { name: 'Biru', color: '#3B82F6' },
  green: { name: 'Hijau', color: '#10B981' },
  purple: { name: 'Ungu', color: '#8B5CF6' },
  orange: { name: 'Oranye', color: '#F59E0B' },
  red: { name: 'Merah', color: '#EF4444' },
};

const DARK_MODES = {
  auto: 'Ikuti Sistem',
  light: 'Terang',
  dark: 'Gelap',
};

const DEFAULT_SETTINGS = {
  themeColor: 'blue',
  darkMode: 'light',
  appName: 'POS Kasir',
  tagline: 'Sistem Kasir Modern',
};

const STORAGE_KEY = 'pos-theme-settings';

// Helper to get initial settings
function getInitialSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load theme settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// Apply theme immediately to prevent flash
function applyThemeToDocument(themeColor, isDark) {
  document.documentElement.setAttribute('data-theme', themeColor);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initialize theme before React hydrates (prevents flash)
const initialSettings = getInitialSettings();
const initialIsDark = initialSettings.darkMode === 'dark' ||
  (initialSettings.darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
applyThemeToDocument(initialSettings.themeColor, initialIsDark);

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isDark, setIsDark] = useState(initialIsDark);

  // Determine if dark mode should be active
  useEffect(() => {
    const updateDarkMode = () => {
      let shouldBeDark = false;

      if (settings.darkMode === 'dark') {
        shouldBeDark = true;
      } else if (settings.darkMode === 'auto') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);
    };

    updateDarkMode();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.darkMode === 'auto') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.darkMode]);

  // Apply theme to document (use layoutEffect for synchronous update)
  useLayoutEffect(() => {
    applyThemeToDocument(settings.themeColor, isDark);
  }, [isDark, settings.themeColor]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save theme settings:', e);
    }
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const setThemeColor = (color) => {
    if (THEME_COLORS[color]) {
      updateSettings({ themeColor: color });
    }
  };

  const setDarkMode = (mode) => {
    if (DARK_MODES[mode] !== undefined) {
      updateSettings({ darkMode: mode });
    }
  };

  const toggleDarkMode = () => {
    // Quick toggle between light and dark
    const newMode = isDark ? 'light' : 'dark';
    setDarkMode(newMode);
  };

  const setBranding = (appName, tagline) => {
    updateSettings({ appName, tagline });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const value = {
    // Current state
    settings,
    isDark,
    themeColor: settings.themeColor,
    darkMode: settings.darkMode,
    appName: settings.appName,
    tagline: settings.tagline,

    // Constants
    THEME_COLORS,
    DARK_MODES,

    // Actions
    updateSettings,
    setThemeColor,
    setDarkMode,
    toggleDarkMode,
    setBranding,
    resetSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { THEME_COLORS, DARK_MODES };
