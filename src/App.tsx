import { Suspense, lazy, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { UserRole } from './lib/types';

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

export default function App() {
    const { user, loading } = useAuth();

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
        </QueryClientProvider>
    );
}
