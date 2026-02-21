import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
    const { isDark, toggleDarkMode } = useTheme();

    if (compact) {
        return (
            <button
                onClick={toggleDarkMode}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-gray-500"
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
                {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                ) : (
                    <Moon className="w-5 h-5 text-blue-600 fill-blue-600/10" />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={toggleDarkMode}
            className="flex items-center justify-between w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isDark ? "bg-yellow-400/10" : "bg-blue-600/10"
                )}>
                    {isDark ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-blue-600" />
                    )}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </span>
            </div>
            <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                isDark ? "bg-primary-600" : "bg-gray-300"
            )}>
                <div className={cn(
                    "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                    isDark ? "left-5" : "left-1"
                )} />
            </div>
        </button>
    );
}
