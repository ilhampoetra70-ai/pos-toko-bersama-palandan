import { Suspense, lazy, ReactNode, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { UserRole } from './lib/types';
import { useKeyboardShortcuts, createNavigationShortcuts } from './hooks/useKeyboardShortcuts';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CashierPage = lazy(() => import('./pages/CashierPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const LowStockPage = lazy(() => import('./pages/LowStockPage'));
const StockTrailPage = lazy(() => import('./pages/StockTrailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const DatabasePage = lazy(() => import('./pages/DatabasePage'));
const DebtManagementPage = lazy(() => import('./pages/DebtManagementPage'));
const InsightPage = lazy(() => import('./pages/InsightPage'));

const PageLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
);

interface ProtectedRouteProps {
    children: ReactNode;
    roles?: UserRole[];
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    
    if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-lg text-muted-foreground">Loading...</div></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role as UserRole)) return <Navigate to="/" replace />;
    return children as React.ReactElement;
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.308-3.856M6.527 6.527A9.966 9.966 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.969 9.969 0 01-4.069 5.405M15 12a3 3 0 11-4.243-4.243M3 3l18 18" />
        </svg>
    );
}

function ForcePasswordChangeModal() {
    const { user, requirePasswordChange, setRequirePasswordChange } = useAuth();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const toggleShow = useCallback(() => setShowPassword(v => !v), []);
    const toggleConfirm = useCallback(() => setShowConfirm(v => !v), []);

    if (!user || !requirePasswordChange) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) return setError('Password minimal 6 karakter.');
        if (password !== confirm) return setError('Konfirmasi password tidak cocok.');

        setLoading(true);
        try {
            const data = await window.api.updateUser(user.id, { password });
            if (data.success) {
                await window.api.markPasswordChanged(user.id);
                setRequirePasswordChange(false);
            } else {
                setError(data.error || 'Gagal mengubah password.');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>Ganti Password Default</DialogTitle>
                </DialogHeader>
                <div className="py-2 text-sm text-muted-foreground">
                    Demi keamanan, Anda wajib mengubah password default sebelum melanjutkan penggunaan aplikasi.
                </div>
                {error && <div className="text-red-500 text-sm font-semibold mb-2">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Input autoFocus type={showPassword ? 'text' : 'password'} placeholder="Password Baru" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className="pr-10" />
                        <button type="button" onClick={toggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                    <div className="relative">
                        <Input type={showConfirm ? 'text' : 'password'} placeholder="Konfirmasi Password Baru" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} className="pr-10" />
                        <button type="button" onClick={toggleConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !password || !confirm}>
                        {loading ? 'Menyimpan...' : 'Simpan Password'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AppContent() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Global navigation shortcuts
    useKeyboardShortcuts(
        createNavigationShortcuts(navigate, user?.role === 'cashier'),
        [navigate, user?.role]
    );

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><div className="text-lg text-muted-foreground">Loading...</div></div>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="cashier" element={<CashierPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="low-stock" element={<LowStockPage />} />
                        <Route path="stock-trail" element={
                            <ProtectedRoute roles={['admin', 'supervisor', 'cashier']}>
                                <StockTrailPage />
                            </ProtectedRoute>
                        } />
                        <Route path="transactions" element={<TransactionsPage />} />
                        <Route path="reports" element={
                            <ProtectedRoute roles={['admin', 'supervisor', 'cashier']}>
                                <ReportsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="debts" element={
                            <ProtectedRoute roles={['admin', 'supervisor', 'cashier']}>
                                <DebtManagementPage />
                            </ProtectedRoute>
                        } />
                        <Route path="users" element={
                            <ProtectedRoute roles={['admin']}>
                                <UsersPage />
                            </ProtectedRoute>
                        } />
                        <Route path="database" element={
                            <ProtectedRoute roles={['admin']}>
                                <DatabasePage />
                            </ProtectedRoute>
                        } />
                        <Route path="settings" element={
                            <ProtectedRoute roles={['admin', 'supervisor', 'cashier']}>
                                <SettingsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="insight" element={<InsightPage />} />
                    </Route>
                </Routes>
            </Suspense>
            <ReactQueryDevtools initialIsOpen={false} />
            <ForcePasswordChangeModal />
        </QueryClientProvider>
    );
}

export default function App() {
    return <AppContent />;
}
