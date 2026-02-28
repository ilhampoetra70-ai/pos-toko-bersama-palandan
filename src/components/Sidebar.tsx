import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { AlertCircle } from 'lucide-react';
import { RetroLogout, RetroRefresh } from '../components/RetroIcons';
import {
    RetroDashboard,
    RetroCart,
    RetroBox,
    RetroAlert,
    RetroHistory,
    RetroReceipt,
    RetroWallet,
    RetroChart,
    RetroSparkle,
    RetroUsers,
    RetroDatabase,
    RetroSettings
} from './RetroIcons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: RetroDashboard, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/cashier', label: 'Kasir', icon: RetroCart, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/products', label: 'Produk', icon: RetroBox, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/low-stock', label: 'Stok Rendah', icon: RetroAlert, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/stock-trail', label: 'Riwayat Stok', icon: RetroHistory, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/transactions', label: 'Transaksi', icon: RetroReceipt, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/debts', label: 'Piutang', icon: RetroWallet, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/reports', label: 'Laporan', icon: RetroChart, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/insight', label: 'AI Insight', icon: RetroSparkle, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/users', label: 'Pengguna', icon: RetroUsers, roles: ['admin'] },
    { path: '/database', label: 'Database', icon: RetroDatabase, roles: ['admin'] },
    { path: '/settings', label: 'Pengaturan', icon: RetroSettings, roles: ['admin', 'supervisor', 'cashier'] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { appName, tagline, appLogo } = useTheme();
    const navigate = useNavigate();
    const [showRestartDialog, setShowRestartDialog] = useState(false);
    const [restartError, setRestartError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const confirmRestart = async () => {
        setRestartError('');
        try {
            await window.api.restartApp();
        } catch (error: any) {
            setRestartError('Gagal restart: ' + error.message + '. Silakan tutup dan buka kembali aplikasi secara manual.');
        }
    };

    const handleCloseRestartDialog = () => {
        setShowRestartDialog(false);
        setRestartError('');
    };

    const filtered = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-background dark:bg-background border-r border-border dark:border-border flex flex-col h-screen shrink-0 transition-colors duration-300">
            {/* Branding */}
            <div className="p-6 border-b border-border dark:border-border flex flex-col items-center text-center">
                {appLogo ? (
                    <img src={appLogo} alt="Logo" className="h-16 w-auto mb-3 object-contain" />
                ) : null}
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">{appName}</h1>
                {tagline && <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 font-medium">{tagline}</p>}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
                {filtered.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-400 font-semibold shadow-sm'
                                : 'text-muted-foreground dark:text-muted-foreground hover:bg-background dark:hover:bg-card hover:text-foreground dark:hover:text-muted-foreground'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 shrink-0 transition-colors" />
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Theme Toggle */}
            <div className="px-4 py-2">
                <ThemeToggle />
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-border dark:border-border">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground dark:text-foreground truncate">{user?.name}</div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground capitalize">{user?.role}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setRestartError(''); setShowRestartDialog(true); }}
                        className="flex-1 h-9"
                        title="Restart Aplikasi"
                    >
                        <RetroRefresh className="w-5 h-5" />
                        <span className="sr-only">Restart</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="flex-[2] h-9 justify-start gap-2 text-muted-foreground hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <RetroLogout className="w-5 h-5" />
                        <span className="text-sm">Logout</span>
                    </Button>
                </div>
            </div>

            {/* Restart Confirmation Dialog */}
            <Dialog open={showRestartDialog} onOpenChange={handleCloseRestartDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restart Aplikasi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin melakukan restart aplikasi sekarang?
                        </DialogDescription>
                    </DialogHeader>
                    {restartError && (
                        <div className="flex items-start gap-2 px-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{restartError}</span>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-end gap-2 mt-2">
                        <Button type="button" variant="outline" onClick={handleCloseRestartDialog}>
                            Batal
                        </Button>
                        <Button type="button" variant="default" onClick={confirmRestart} disabled={!!restartError}>
                            Restart
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </aside>
    );
}
