import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';
import SalesTrendChart from '../components/charts/SalesTrendChart';

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartPeriod, setChartPeriod] = useState(7);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const data = await window.api.getEnhancedDashboardStats();
    setStats(data);
  };

  if (!stats) return <LoadingState />;

  const chartData = chartPeriod === 7 ? stats.last_7_days : stats.last_30_days;

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <KPICardsSection stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChartSection
          chartData={chartData}
          chartPeriod={chartPeriod}
          setChartPeriod={setChartPeriod}
          stats={stats}
        />
        <QuickActionsSection hasRole={hasRole} navigate={navigate} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsSection topProducts={stats.top_products_today} navigate={navigate} />
        <AlertsSection stats={stats} navigate={navigate} />
      </div>
      <SlowMovingDashboardSection navigate={navigate} />
      <RecentTransactionsSection transactions={stats.recent_transactions} navigate={navigate} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span className="text-gray-500">Memuat dashboard...</span>
      </div>
    </div>
  );
}

function DashboardHeader() {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">{today}</p>
      </div>
    </div>
  );
}

function KPICardsSection({ stats }) {
  // Calculate comparisons
  const salesGrowth = stats.yesterday_sales_total > 0
    ? ((stats.today_sales_total - stats.yesterday_sales_total) / stats.yesterday_sales_total * 100)
    : stats.today_sales_total > 0 ? 100 : 0;

  const avgTransaction = stats.today_sales_count > 0
    ? Math.round(stats.today_sales_total / stats.today_sales_count)
    : 0;

  const profitMargin = stats.today_revenue > 0
    ? (stats.today_profit / stats.today_revenue * 100)
    : 0;

  const weeklyGrowth = stats.last_week_total > 0
    ? ((stats.this_week_total - stats.last_week_total) / stats.last_week_total * 100)
    : stats.this_week_total > 0 ? 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <EnhancedStatCard
        title="Penjualan Hari Ini"
        value={formatCurrency(stats.today_sales_total)}
        subtitle={`vs kemarin: ${formatCurrency(stats.yesterday_sales_total)}`}
        comparison={salesGrowth}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <EnhancedStatCard
        title="Transaksi Hari Ini"
        value={formatNumber(stats.today_sales_count)}
        subtitle={`Rata-rata: ${formatCurrency(avgTransaction)}`}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
      />
      <EnhancedStatCard
        title="Laba Hari Ini"
        value={formatCurrency(stats.today_profit)}
        subtitle={`Margin: ${profitMargin.toFixed(1)}%`}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
        iconBg="bg-green-50"
        iconColor="text-green-600"
        progressBar={{ value: profitMargin, max: 100, color: 'bg-green-500' }}
      />
      <EnhancedStatCard
        title="Penjualan Minggu Ini"
        value={formatCurrency(stats.this_week_total)}
        subtitle={`vs minggu lalu: ${formatCurrency(stats.last_week_total)}`}
        comparison={weeklyGrowth}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
      />
    </div>
  );
}

function EnhancedStatCard({ title, value, subtitle, comparison, icon, iconBg, iconColor, progressBar }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {comparison !== undefined && (
          <ComparisonBadge value={comparison} />
        )}
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
      </div>
      {progressBar && (
        <div className="mt-3">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressBar.color} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(progressBar.value, progressBar.max)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonBadge({ value }) {
  const isPositive = value >= 0;
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
      isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {displayValue}%
    </span>
  );
}

function SalesChartSection({ chartData, chartPeriod, setChartPeriod, stats }) {
  // Calculate trend
  const currentPeriodTotal = chartData.reduce((sum, d) => sum + d.total, 0);
  const halfPoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, halfPoint).reduce((sum, d) => sum + d.total, 0);
  const secondHalf = chartData.slice(halfPoint).reduce((sum, d) => sum + d.total, 0);
  const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;

  return (
    <div className="lg:col-span-2 card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Tren Penjualan</h3>
          <p className="text-sm text-gray-500">
            Total: {formatCurrency(currentPeriodTotal)}
            {trend !== 0 && (
              <span className={`ml-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartPeriod(7)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartPeriod === 7
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setChartPeriod(30)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartPeriod === 30
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>
      <SalesTrendChart data={chartData} hideCard={true} />
    </div>
  );
}

function QuickActionsSection({ hasRole, navigate }) {
  const actions = [
    {
      label: 'Buka Kasir',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      path: '/cashier',
      color: 'bg-primary-500 hover:bg-primary-600 text-white',
      roles: ['admin', 'supervisor', 'cashier']
    },
    {
      label: 'Tambah Produk',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      path: '/products',
      color: 'bg-green-500 hover:bg-green-600 text-white',
      roles: ['admin', 'supervisor']
    },
    {
      label: 'Lihat Laporan',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
      path: '/reports',
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      roles: ['admin', 'supervisor']
    },
    {
      label: 'Pengaturan',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600 text-white',
      roles: ['admin']
    }
  ];

  const visibleActions = actions.filter(action =>
    action.roles.some(role => hasRole(role))
  );

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
      <div className="space-y-3">
        {visibleActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${action.color}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TopProductsSection({ topProducts, navigate }) {
  const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.qty)) : 1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Produk Terlaris Hari Ini</h3>
        <button
          onClick={() => navigate('/reports')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Lihat Semua →
        </button>
      </div>
      {topProducts.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-400 text-sm">Belum ada penjualan hari ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topProducts.map((product, index) => {
            const percentage = (product.qty / maxQty) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                    {product.product_name}
                  </span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {product.qty} terjual
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-20 text-right">
                    {formatCurrency(product.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertsSection({ stats, navigate }) {
  const alerts = [];

  // Overdue debts alert (highest priority)
  if (stats.debt_overdue_count > 0) {
    alerts.push({
      type: 'error',
      title: 'Piutang Jatuh Tempo',
      message: `${stats.debt_overdue_count} transaksi jatuh tempo (${formatCurrency(stats.debt_overdue_total)})`,
      action: () => navigate('/debts'),
      actionLabel: 'Lihat Piutang',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    });
  }

  // Outstanding debts alert
  if (stats.debt_total_count > 0 && stats.debt_overdue_count === 0) {
    alerts.push({
      type: 'info',
      title: 'Piutang Belum Lunas',
      message: `${stats.debt_total_count} transaksi belum lunas (${formatCurrency(stats.debt_total_outstanding)})`,
      action: () => navigate('/debts'),
      actionLabel: 'Lihat Piutang',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      )
    });
  }

  // Low stock alert
  if (stats.low_stock_count > 0) {
    alerts.push({
      type: 'warning',
      title: 'Stok Menipis',
      message: `${stats.low_stock_count} produk dengan stok <= 5`,
      action: () => navigate('/products'),
      actionLabel: 'Lihat Produk',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      products: stats.low_stock_products
    });
  }

  // Backup alert
  const daysSinceBackup = stats.last_backup_date
    ? Math.floor((Date.now() - new Date(stats.last_backup_date).getTime()) / 86400000)
    : null;

  if (daysSinceBackup === null || daysSinceBackup > 3) {
    alerts.push({
      type: daysSinceBackup === null ? 'error' : 'warning',
      title: 'Backup Diperlukan',
      message: daysSinceBackup === null
        ? 'Belum pernah melakukan backup'
        : `Backup terakhir ${daysSinceBackup} hari yang lalu`,
      action: () => navigate('/settings/database'),
      actionLabel: 'Backup Sekarang',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      )
    });
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Notifikasi</h3>
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-600 font-medium">Semua Baik!</p>
          <p className="text-gray-400 text-sm mt-1">Tidak ada peringatan saat ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const colorClasses = {
              error: { bg: 'bg-red-50 border-red-200', icon: 'text-red-500', title: 'text-red-800', text: 'text-red-600', action: 'text-red-700 hover:text-red-800' },
              warning: { bg: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', title: 'text-yellow-800', text: 'text-yellow-600', action: 'text-yellow-700 hover:text-yellow-800' },
              info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-500', title: 'text-blue-800', text: 'text-blue-600', action: 'text-blue-700 hover:text-blue-800' },
            };
            const colors = colorClasses[alert.type] || colorClasses.warning;

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${colors.bg}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${colors.icon}`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${colors.title}`}>
                      {alert.title}
                    </p>
                    <p className={`text-sm mt-0.5 ${colors.text}`}>
                      {alert.message}
                    </p>
                    {alert.products && alert.products.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {alert.products.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-0.5 rounded text-gray-600">
                            {p.name} ({p.stock})
                          </span>
                        ))}
                        {alert.products.length > 3 && (
                          <span className="text-xs text-gray-500">+{alert.products.length - 3} lainnya</span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={alert.action}
                      className={`mt-2 text-sm font-medium ${colors.action}`}
                    >
                      {alert.actionLabel} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SlowMovingDashboardSection({ navigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlowMoving();
  }, []);

  const loadSlowMoving = async () => {
    try {
      const data = await window.api.getSlowMovingProducts(120, 10);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load slow moving products:', err);
    }
    setLoading(false);
  };

  // Calculate total estimated value
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🐌</span>
          <h3 className="font-semibold text-gray-900">Produk Slow Moving</h3>
        </div>
        <div className="py-6 text-center bg-green-50 border border-green-200 rounded-lg">
          <span className="text-2xl mb-2 block">✅</span>
          <p className="text-green-700 font-medium">Semua produk aktif terjual!</p>
          <p className="text-green-600 text-sm">Tidak ada produk slow moving (120+ hari)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐌</span>
          <div>
            <h3 className="font-semibold text-gray-900">Produk Slow Moving</h3>
            <p className="text-xs text-gray-500">Tidak terjual 120+ hari</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-orange-600">{formatCurrency(totalValue)}</div>
            <div className="text-xs text-gray-400">Nilai Tertahan</div>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Lihat Detail →
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-orange-600">{products.length}</span>
          <span className="text-sm text-orange-700">Produk</span>
        </div>
        <div className="h-6 w-px bg-orange-200" />
        <div className="text-sm text-orange-600">
          Stok total: <span className="font-semibold">{formatNumber(products.reduce((s, p) => s + p.stock, 0))} pcs</span>
        </div>
      </div>

      {/* Product list with scroll */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Produk</th>
              <th className="text-center py-2 px-2 text-gray-500 font-medium">Stok</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">Harga</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Terakhir Terjual</th>
              <th className="text-center py-2 px-2 text-gray-500 font-medium">Hari</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const lastSaleDate = p.last_sale_date
                ? new Date(p.last_sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                : 'Belum pernah';
              const daysText = p.days_inactive >= 9999 ? '∞' : p.days_inactive;

              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</div>
                    {p.category_name && <div className="text-xs text-gray-400">{p.category_name}</div>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-xs">{p.stock}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-gray-600">{formatCurrency(p.price)}</td>
                  <td className="py-2.5 px-2 text-gray-500 text-xs">{lastSaleDate}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-semibold text-red-600">{daysText}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentTransactionsSection({ transactions, navigate }) {
  const paymentMethodLabels = {
    cash: 'Tunai',
    debit: 'Debit',
    credit: 'Kredit',
    qris: 'QRIS',
    transfer: 'Transfer'
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Transaksi Terakhir</h3>
        <button
          onClick={() => navigate('/reports')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Lihat Semua →
        </button>
      </div>
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="text-gray-400 text-sm">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Waktu</th>
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium text-center">Items</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-right">Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-600">
                    {formatDateTime(tx.created_at)}
                  </td>
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{tx.invoice_number}</span>
                    {tx.status === 'voided' && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">VOID</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-600">
                    {tx.items?.length || '-'}
                  </td>
                  <td className={`py-3 text-right font-medium ${
                    tx.status === 'voided' ? 'text-red-500 line-through' : 'text-gray-900'
                  }`}>
                    {formatCurrency(tx.total)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {paymentMethodLabels[tx.payment_method] || tx.payment_method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
