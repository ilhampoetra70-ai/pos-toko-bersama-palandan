import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';

export type ThemeColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
export type DarkModeKey = 'auto' | 'light' | 'dark';

export interface ThemeSettings {
    themeColor: ThemeColorKey;
    darkMode: DarkModeKey;
    fontFamily: string;
    appName: string;
    tagline: string;
    appLogo: string;
}

interface ThemeContextType {
    settings: ThemeSettings;
    isDark: boolean;
    themeColor: ThemeColorKey;
    darkMode: DarkModeKey;
    fontFamily: string;
    appName: string;
    tagline: string;
    appLogo: string;
    THEME_COLORS: typeof THEME_COLORS;
    DARK_MODES: typeof DARK_MODES;
    FONTS: typeof FONTS;
    updateSettings: (updates: Partial<ThemeSettings>) => void;
    setThemeColor: (color: ThemeColorKey) => void;
    setFontFamily: (fontKey: string) => void;
    setDarkMode: (mode: DarkModeKey) => void;
    toggleDarkMode: () => void;
    setBranding: (appName: string, tagline: string, appLogo: string) => void;
    resetSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_COLORS = {
    blue: { name: 'Biru', color: '#3B82F6' },
    green: { name: 'Hijau', color: '#10B981' },
    purple: { name: 'Ungu', color: '#8B5CF6' },
    orange: { name: 'Oranye', color: '#F59E0B' },
    red: { name: 'Merah', color: '#EF4444' },
    emerald: { name: 'Emerald Metalik', color: '#00C47E', gradient: 'linear-gradient(135deg, #25DAA0 0%, #00C47E 40%, #009F65 100%)' },
};

const DARK_MODES = {
    auto: 'Ikuti Sistem',
    light: 'Terang',
    dark: 'Gelap',
};

const FONTS: Record<string, { name: string, value: string }> = {
    system: { name: 'System UI (Default)', value: "'Segoe UI', system-ui, -apple-system, sans-serif" },
    modern: { name: 'Modern Sans', value: "'Inter', 'Helvetica Neue', Arial, sans-serif" },
    classic: { name: 'Classic Sans', value: "'Verdana', 'Geneva', sans-serif" },
    formal: { name: 'Formal', value: "'Tahoma', 'Geneva', sans-serif" },
    elegant: { name: 'Elegant', value: "'Trebuchet MS', sans-serif" },
    minimal: { name: 'Minimalist', value: "'Calibri', 'Candara', sans-serif" },
    serif: { name: 'Professional Serif', value: "'Georgia', serif" },
    print: { name: 'Print Style', value: "'Garamond', 'Times New Roman', serif" },
    mono: { name: 'Data Mono', value: "'Consolas', 'Monaco', monospace" },
    roboto: { name: 'Roboto (Google Fonts)', value: "'Roboto', sans-serif" },
    rounded: { name: 'Rounded', value: "'Arial Rounded MT Bold', 'Quicksand', sans-serif" },
};

const DEFAULT_SETTINGS: ThemeSettings = {
    themeColor: 'blue',
    darkMode: 'light',
    fontFamily: 'roboto',
    appName: 'POS Kasir',
    tagline: 'Sistem Kasir Modern',
    appLogo: '',
};

const STORAGE_KEY = 'pos-theme-settings';

function getInitialSettings(): ThemeSettings {
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

function applyThemeToDocument(themeColor: ThemeColorKey, isDark: boolean, fontFamily: string) {
    document.documentElement.setAttribute('data-theme', themeColor);

    const fontValue = FONTS[fontFamily]?.value || FONTS.system.value;
    document.documentElement.style.setProperty('--font-family', fontValue);

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

const initialSettings = getInitialSettings();
const initialIsDark = initialSettings.darkMode === 'dark' ||
    (initialSettings.darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
applyThemeToDocument(initialSettings.themeColor, initialIsDark, initialSettings.fontFamily);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ThemeSettings>(initialSettings);

    useEffect(() => {
        const loadDbSettings = async () => {
            try {
                if (window.api) {
                    const dbSettings = await window.api.getSettings();
                    setSettings(prev => ({
                        ...prev,
                        appName: dbSettings.app_name || prev.appName,
                        tagline: dbSettings.tagline || prev.tagline,
                        appLogo: dbSettings.app_logo || prev.appLogo
                    }));
                }
            } catch (e) {
                console.error('Failed to load DB settings:', e);
            }
        };
        loadDbSettings();
    }, []);

    const getEffectiveDarkMode = (mode: DarkModeKey) => {
        if (mode === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return mode === 'dark';
    };

    const [isDark, setIsDark] = useState(() => getEffectiveDarkMode(initialSettings.darkMode));

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (settings.darkMode === 'auto') {
                setIsDark(mediaQuery.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [settings.darkMode]);

    useEffect(() => {
        setIsDark(getEffectiveDarkMode(settings.darkMode));
    }, [settings.darkMode]);

    useLayoutEffect(() => {
        applyThemeToDocument(settings.themeColor, isDark, settings.fontFamily);
    }, [isDark, settings.themeColor, settings.fontFamily]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save theme settings:', e);
        }
    }, [settings]);

    const updateSettings = (updates: Partial<ThemeSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    const setThemeColor = (color: ThemeColorKey) => {
        if (THEME_COLORS[color]) {
            updateSettings({ themeColor: color });
        }
    };

    const setFontFamily = (fontKey: string) => {
        if (FONTS[fontKey]) {
            updateSettings({ fontFamily: fontKey });
        }
    };

    const setDarkMode = (mode: DarkModeKey) => {
        if (DARK_MODES[mode] !== undefined) {
            updateSettings({ darkMode: mode });
        }
    };

    const toggleDarkMode = () => {
        let newMode: DarkModeKey;
        if (settings.darkMode === 'auto') {
            newMode = isDark ? 'light' : 'dark';
        } else {
            newMode = settings.darkMode === 'dark' ? 'light' : 'dark';
        }
        setDarkMode(newMode);
    };

    const setBranding = (appName: string, tagline: string, appLogo: string) => {
        updateSettings({ appName, tagline, appLogo });
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    const value: ThemeContextType = {
        settings,
        isDark,
        themeColor: settings.themeColor,
        darkMode: settings.darkMode,
        fontFamily: settings.fontFamily,
        appName: settings.appName,
        tagline: settings.tagline,
        appLogo: settings.appLogo,
        THEME_COLORS,
        DARK_MODES,
        FONTS,
        updateSettings,
        setThemeColor,
        setFontFamily,
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
