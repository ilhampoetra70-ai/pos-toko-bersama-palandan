import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    AlertTriangle,
    History,
    FileText,
    CreditCard,
    Users,
    Database,
    Settings,
    RefreshCw,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/cashier', label: 'Kasir', icon: ShoppingCart, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/products', label: 'Produk', icon: Package, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/low-stock', label: 'Stok Rendah', icon: AlertTriangle, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/stock-trail', label: 'Riwayat Stok', icon: History, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/transactions', label: 'Transaksi', icon: FileText, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/debts', label: 'Piutang', icon: CreditCard, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/reports', label: 'Laporan', icon: FileText, roles: ['admin', 'supervisor', 'cashier', 'kasir'] },
    { path: '/users', label: 'Pengguna', icon: Users, roles: ['admin'] },
    { path: '/database', label: 'Database', icon: Database, roles: ['admin'] },
    { path: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin', 'supervisor', 'cashier'] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { appName, tagline, appLogo } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filtered = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-background dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen shrink-0 transition-colors duration-300">
            {/* Branding */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
                {appLogo ? (
                    <img src={appLogo} alt="Logo" className="h-16 w-auto mb-3 object-contain" />
                ) : null}
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">{appName}</h1>
                {tagline && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{tagline}</p>}
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
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
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
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate">{user?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">{user?.role}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                            if (confirm('Restart aplikasi?')) {
                                try {
                                    await window.api.restartApp();
                                } catch (error: any) {
                                    alert('Gagal restart: ' + error.message + '\n\nSilakan tutup dan buka kembali aplikasi secara manual.');
                                }
                            }
                        }}
                        className="flex-1 h-9"
                        title="Restart Aplikasi"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="sr-only">Restart</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="flex-[2] h-9 justify-start gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                    </Button>
                </div>
            </div>
        </aside>
    );
}
