// Reports Fix - Version 18 (Dashboard Sync + Race Fix)
console.log('[REPORTS FIX v18] Starting...');

// Global state
let hourlyChartInstance = null;
let dashboardChartInstance = null;
let isProcessing = false;
let dashboardPatchApplied = false;
let dashboardRenderRetryCount = 0;
let dashboardRenderRetryTimer = null;
let lastDashboardSignature = '';
let dashboardHookRetryTimer = null;
let dashboardHookRetryCount = 0;
let chartJsLoadingPromise = null;
let reportAbortController = null;
let activeReportRequestId = 0;
let lastReportKey = '';
let lastReportLoadedAt = 0;
let reportInFlightPromise = null;
let reportInFlightKey = '';
const REPORTS_SNAPSHOT_TTL = 30000;
const REPORTS_CACHE_KEY_PREFIX = 'reports_snapshot_v1:';
const REPORTS_LAST_SNAPSHOT_KEY = REPORTS_CACHE_KEY_PREFIX + '__last__';
const reportsMemoryCache = new Map();

function perfNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function pushPerfMetric(name, payload = {}) {
  try {
    if (!window.__reportsPerfMetrics) window.__reportsPerfMetrics = [];
    window.__reportsPerfMetrics.push({
      name,
      ts: Date.now(),
      ...payload
    });
    if (window.__reportsPerfMetrics.length > 120) {
      window.__reportsPerfMetrics.splice(0, window.__reportsPerfMetrics.length - 120);
    }
  } catch (e) {}
}

function updateReportsCacheBadge(text = '', mode = '') {
  const reportsPage = document.querySelector('.reports-page');
  if (!reportsPage) return;

  let badge = document.getElementById('reports-cache-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'reports-cache-badge';
    badge.style.cssText = 'display:none;margin:8px 0 12px;padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.3;';

    const periodSelector = reportsPage.querySelector('.period-selector');
    if (periodSelector && periodSelector.parentNode) {
      periodSelector.parentNode.insertBefore(badge, periodSelector.nextSibling);
    } else {
      reportsPage.insertBefore(badge, reportsPage.firstChild);
    }
  }

  if (!text) {
    badge.style.display = 'none';
    badge.textContent = '';
    return;
  }

  if (mode === 'stale') {
    badge.style.background = 'rgba(245, 158, 11, 0.12)';
    badge.style.border = '1px solid rgba(245, 158, 11, 0.35)';
    badge.style.color = '#fbbf24';
  } else {
    badge.style.background = 'rgba(16, 185, 129, 0.12)';
    badge.style.border = '1px solid rgba(16, 185, 129, 0.35)';
    badge.style.color = '#34d399';
  }

  badge.textContent = text;
  badge.style.display = 'block';
}

function getReportsSnapshot(key) {
  const now = Date.now();
  const inMemory = reportsMemoryCache.get(key);
  if (inMemory && inMemory.expiry > now) {
    return { ...inMemory, stale: false, source: 'memory' };
  }

  try {
    const raw = sessionStorage.getItem(REPORTS_CACHE_KEY_PREFIX + key);
    let parsed = null;
    if (raw) {
      parsed = JSON.parse(raw);
    } else {
      const lastRaw = sessionStorage.getItem(REPORTS_LAST_SNAPSHOT_KEY);
      if (lastRaw) parsed = JSON.parse(lastRaw);
    }
    if (!parsed || !parsed.data || !parsed.storedAt) return null;
    const usedFallback = !raw;
    return {
      data: parsed.data,
      storedAt: parsed.storedAt,
      expiry: parsed.storedAt + REPORTS_SNAPSHOT_TTL,
      stale: now > (parsed.storedAt + REPORTS_SNAPSHOT_TTL),
      source: usedFallback ? 'session_fallback' : 'session'
    };
  } catch (e) {
    return null;
  }
}

function setReportsSnapshot(key, data) {
  const storedAt = Date.now();
  const entry = {
    data,
    storedAt,
    expiry: storedAt + REPORTS_SNAPSHOT_TTL
  };
  reportsMemoryCache.set(key, entry);
  try {
    sessionStorage.setItem(REPORTS_CACHE_KEY_PREFIX + key, JSON.stringify({ data, storedAt }));
    sessionStorage.setItem(REPORTS_LAST_SNAPSHOT_KEY, JSON.stringify({ data, storedAt }));
  } catch (e) {}
}

function applyReportsDataToUI(data, days) {
  const hourlyData = data.hourly_sales || data.hourlySales || [];

  const totalTx = hourlyData.reduce((s, h) => s + (h.transaction_count || 0), 0);
  const totalRev = hourlyData.reduce((s, h) => s + (h.total_revenue || 0), 0);
  const avgTx = totalTx > 0 ? Math.round(totalRev / totalTx) : 0;

  document.querySelectorAll('.stat-box').forEach(box => {
    const label = box.querySelector('.stat-label')?.textContent?.trim();
    const valueEl = box.querySelector('.stat-value');
    if (!valueEl) return;

    if (label?.includes('Penjualan')) {
      box.querySelector('.stat-label').textContent = 'Total Penjualan (' + days + ' Hari)';
      valueEl.textContent = formatCurrency(totalRev);
    } else if (label?.includes('Transaksi')) {
      valueEl.textContent = totalTx;
    } else if (label?.includes('Rata')) {
      valueEl.textContent = formatCurrency(avgTx);
    }
  });

  const customersList = document.getElementById('top-customers-list');
  if (customersList) {
    const customers = data.top_customers || data.topCustomers || [];
    customersList.innerHTML = customers.map((c, i) =>
      `<div class="data-item"><div class="item-rank">${i+1}</div><div class="item-info"><div class="item-name">${c.customer_name || c.name || 'Pelanggan '+(i+1)}</div><div class="item-meta">${c.transaction_count || 0} transaksi</div></div><div class="item-value">${formatCurrency(c.total_revenue || 0)}</div></div>`
    ).join('') || '<div class="empty-state">Tidak ada data</div>';
  }

  const productsList = document.getElementById('top-products-list');
  if (productsList) {
    const products = data.top_products || data.topProducts || [];
    productsList.innerHTML = products.map((p, i) =>
      `<div class="data-item"><div class="item-rank">${i+1}</div><div class="item-info"><div class="item-name">${p.product_name || p.name || 'Produk '+(i+1)}</div><div class="item-meta">${p.qty || 0} terjual</div></div><div class="item-value">${formatCurrency(p.total_revenue || 0)}</div></div>`
    ).join('') || '<div class="empty-state">Tidak ada data</div>';
  }

  return { hourlyData };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Get default dates
function getDefaultDates(days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    days: days
  };
}

// Load Chart.js
function loadChartJs() {
  if (typeof Chart !== 'undefined') return Promise.resolve(true);
  if (chartJsLoadingPromise) return chartJsLoadingPromise;

  chartJsLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-chartjs="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      setTimeout(() => resolve(typeof Chart !== 'undefined'), 2500);
      return;
    }

    // Prefer local bundled asset dulu (lebih stabil untuk PWA/offline-ish),
    // lalu fallback ke CDN jika file lokal gagal.
    const localScript = document.createElement('script');
    localScript.dataset.chartjs = '1';
    localScript.src = './assets/vendor/chart.umd.min.js?v=2026040601';
    localScript.onload = () => resolve(true);
    localScript.onerror = () => {
      const cdnScript = document.createElement('script');
      cdnScript.dataset.chartjs = '1';
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      cdnScript.onload = () => resolve(true);
      cdnScript.onerror = () => resolve(false);
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(localScript);

    // Fail-fast supaya UI data tetap cepat walau local/CDN lambat.
    setTimeout(() => resolve(typeof Chart !== 'undefined'), 3000);
  }).finally(() => {
    if (typeof Chart !== 'undefined') return;
    chartJsLoadingPromise = null;
  });

  return chartJsLoadingPromise;
}

// Destroy charts
function destroyCharts() {
  if (hourlyChartInstance) {
    try { hourlyChartInstance.destroy(); } catch(e){}
    hourlyChartInstance = null;
  }
  if (dashboardChartInstance) {
    try { dashboardChartInstance.destroy(); } catch(e){}
    dashboardChartInstance = null;
  }
  lastDashboardSignature = '';
}

function getActiveDashboardPeriod() {
  const activeBtn = document.querySelector('.chart-filter-btn.active');
  if (!activeBtn) return 'week';
  return activeBtn.dataset?.period === '30' ? 'month' : 'week';
}

function scheduleDashboardRenderRetry(period) {
  if (dashboardRenderRetryTimer) return;
  if (dashboardRenderRetryCount >= 10) return;
  dashboardRenderRetryCount += 1;
  dashboardRenderRetryTimer = setTimeout(() => {
    dashboardRenderRetryTimer = null;
    renderDashboardChart(period, { allowRetry: true, force: true });
  }, 220);
}

// PATCH: Override updateChartHeader to use our renderChart
function patchUpdateChartHeader() {
  if (window.updateChartHeader && !window.updateChartHeader._patched) {
    console.log('[REPORTS FIX] Patching updateChartHeader');
    const original = window.updateChartHeader;
    window.updateChartHeader = function(period) {
      console.log('[REPORTS FIX] updateChartHeader called with:', period);
      // Call original first to update UI elements
      original(period);
      // Then re-render with Chart.js
      setTimeout(() => renderDashboardChart(period), 10);
    };
    window.updateChartHeader._patched = true;
  }
}

// CHART RENDERER: Create actual Chart.js chart
async function renderDashboardChart(period, options = {}) {
  const allowRetry = options.allowRetry !== false;
  const force = options.force === true;
  const currentPeriod = period || getActiveDashboardPeriod();
  console.log('[REPORTS FIX] renderDashboardChart:', currentPeriod);
  
  const container = document.getElementById('dashboard-chart-container');
  if (!container) {
    console.log('[REPORTS FIX] Container not found');
    if (dashboardRenderRetryTimer) {
      clearTimeout(dashboardRenderRetryTimer);
      dashboardRenderRetryTimer = null;
    }
    return;
  }

  const data = window.dashboardData?.[currentPeriod] || [];
  if (data.length === 0) {
    console.log('[REPORTS FIX] No data for period:', currentPeriod);
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">Memuat data chart...</div>';
    if (allowRetry) scheduleDashboardRenderRetry(currentPeriod);
    return;
  }
  dashboardRenderRetryCount = 0;

  const signature = `${currentPeriod}:${data.length}:${data.map(d => d.amount || 0).join('|')}`;
  if (!force && signature === lastDashboardSignature && dashboardChartInstance) {
    console.log('[REPORTS FIX] Dashboard chart unchanged, skip render');
    return;
  }
  lastDashboardSignature = signature;
  
  // Destroy old chart
  if (dashboardChartInstance) {
    try { dashboardChartInstance.destroy(); } catch(e){}
    dashboardChartInstance = null;
  }
  
  // Clear container
  container.innerHTML = '<canvas id="dashboardChartCanvas" style="max-height:200px;width:100%;"></canvas>';
  const canvas = document.getElementById('dashboardChartCanvas');
  if (!canvas) {
    console.log('[REPORTS FIX] Canvas not found');
    return;
  }
  
  // Load Chart.js
  await loadChartJs();
  
  if (typeof Chart === 'undefined') {
    console.log('[REPORTS FIX] Chart.js not loaded');
    return;
  }
  
  try {
    const ctx = canvas.getContext('2d');
    
    dashboardChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.day || d.date?.slice(5) || ''),
        datasets: [{
          label: 'Penjualan',
          data: data.map(d => d.amount || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            ticks: { 
              callback: v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000)+'K' : v 
            } 
          },
          x: {
            ticks: {
              font: { size: 10 }
            }
          }
        }
      }
    });
    
    console.log('[REPORTS FIX] Dashboard chart rendered successfully');
  } catch(e) {
    console.error('[REPORTS FIX] Dashboard chart error:', e);
    if (allowRetry) scheduleDashboardRenderRetry(currentPeriod);
  }
}

function tryPatchDashboardHooks() {
  let patchedAny = false;

  if (window.renderChart && !window.renderChart._overridden) {
    overrideRenderChart();
    patchedAny = true;
  }

  if (window.updateChartHeader && !window.updateChartHeader._patched) {
    patchUpdateChartHeader();
    patchedAny = true;
  }

  if (window.updateChartHeader && window.updateChartHeader._patched && window.renderChart && window.renderChart._overridden) {
    dashboardPatchApplied = true;
    if (dashboardHookRetryTimer) {
      clearTimeout(dashboardHookRetryTimer);
      dashboardHookRetryTimer = null;
    }
    dashboardHookRetryCount = 0;
    return true;
  }

  if (dashboardHookRetryCount >= 12) {
    return patchedAny;
  }

  if (!dashboardHookRetryTimer) {
    dashboardHookRetryCount += 1;
    dashboardHookRetryTimer = setTimeout(() => {
      dashboardHookRetryTimer = null;
      tryPatchDashboardHooks();
    }, 180);
  }

  return patchedAny;
}

// OVERRIDE: window.renderChart to prevent original from running
function overrideRenderChart() {
  console.log('[REPORTS FIX] Overriding window.renderChart');
  
  // Store original if needed
  const originalRenderChart = window.renderChart;
  
  window.renderChart = function(period) {
    console.log('[REPORTS FIX] renderChart intercepted:', period);
    
    // Return empty string - we handle rendering in updateChartHeader patch
    return '';
  };
  
  // Mark as overridden
  window.renderChart._overridden = true;
}

// Reports Chart
async function renderReportsChart(hourlyData) {
  if (isProcessing) return;
  isProcessing = true;
  const chartStart = perfNow();
  
  let canvas = document.getElementById('hourlyChart');
  let container = document.querySelector('.chart-container');
  
  if (!canvas && container) {
    container.innerHTML = '<canvas id="hourlyChart"></canvas>';
    canvas = document.getElementById('hourlyChart');
  }
  
  if (!canvas) {
    isProcessing = false;
    pushPerfMetric('reports_chart_skip', { reason: 'canvas_not_found' });
    return;
  }
  
  if (hourlyChartInstance) {
    try { hourlyChartInstance.destroy(); } catch(e){}
  }
  
  if (hourlyData.length === 0) {
    canvas.parentElement.innerHTML = '<div style="text-align:center;padding:40px;">Tidak ada data</div>';
    isProcessing = false;
    pushPerfMetric('reports_chart_empty', { duration_ms: Math.round(perfNow() - chartStart) });
    return;
  }
  
  await loadChartJs();
  
  if (typeof Chart === 'undefined') {
    const max = Math.max(...hourlyData.map(d => d.total_revenue || 0), 1);
    let html = '<div style="display:flex;align-items:flex-end;height:180px;padding:10px;gap:2px;">';
    hourlyData.forEach(d => {
      const h = Math.max(((d.total_revenue || 0) / max) * 150, 4);
      html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:100%;background:linear-gradient(to top,#10b981,#34d399);height:${h}px;border-radius:2px;"></div>
        <div style="font-size:9px;color:#666;">${d.hour}</div>
      </div>`;
    });
    html += '</div>';
    canvas.parentElement.innerHTML = html;
    isProcessing = false;
    pushPerfMetric('reports_chart_fallback', { duration_ms: Math.round(perfNow() - chartStart), points: hourlyData.length });
    return;
  }
  
  try {
    const ctx = canvas.getContext('2d');
    hourlyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hourlyData.map(d => d.hour + ':00'),
        datasets: [{
          data: hourlyData.map(d => d.total_revenue || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000)+'K' : v } }
        }
      }
    });
  } catch(e) {
    console.error('[REPORTS FIX] Reports chart error:', e);
    pushPerfMetric('reports_chart_error', { message: e?.message || String(e), duration_ms: Math.round(perfNow() - chartStart) });
  }
  
  isProcessing = false;
  pushPerfMetric('reports_chart_done', { duration_ms: Math.round(perfNow() - chartStart), points: hourlyData.length });
}

// Load Reports Data
async function loadReportsData(start, end, days) {
  const loadStart = perfNow();
  if (!start || !end) {
    const defaults = getDefaultDates(days || 7);
    start = defaults.start;
    end = defaults.end;
    days = defaults.days;
  }
  
  console.log('[REPORTS FIX] Loading reports:', start, 'to', end, '(' + days + ' days)');

  const reportKey = `${start}|${end}|${days}`;
  const now = Date.now();
  lastReportKey = reportKey;
  lastReportLoadedAt = now;
  
  const customersList = document.getElementById('top-customers-list');
  const productsList = document.getElementById('top-products-list');
  const snapshot = getReportsSnapshot(reportKey);

  if (snapshot?.data) {
    const snapshotResult = applyReportsDataToUI(snapshot.data, days);
    updateReportsCacheBadge(
      snapshot.stale ? 'Menampilkan data cache terakhir (stale), sedang sinkronisasi...' : 'Menampilkan data cache, sinkronisasi berjalan...',
      snapshot.stale ? 'stale' : 'fresh'
    );
    pushPerfMetric('reports_cache_rendered', {
      key: reportKey,
      source: snapshot.source,
      stale: snapshot.stale,
      age_ms: Math.max(0, Date.now() - snapshot.storedAt),
      hourly_count: snapshotResult.hourlyData.length
    });

    // Chart dari snapshot dirender cepat agar UX tetap responsif saat fetch jalan.
    renderReportsChart(snapshotResult.hourlyData).catch(() => {});
  } else {
    if (customersList) customersList.innerHTML = 'Memuat...';
    if (productsList) productsList.innerHTML = 'Memuat...';
    updateReportsCacheBadge('', '');
  }
  
  destroyCharts();
  
  try {
    if (reportInFlightPromise && reportInFlightKey === reportKey) {
      pushPerfMetric('reports_load_skipped', { key: reportKey, reason: 'inflight_reuse' });
      await reportInFlightPromise;
      return;
    }

    if (reportAbortController && reportInFlightKey && reportInFlightKey !== reportKey) {
      try { reportAbortController.abort(); } catch (e) {}
    }
    reportAbortController = new AbortController();
    const requestId = ++activeReportRequestId;
    const fetchStart = perfNow();
    const timeoutId = setTimeout(() => {
      try { reportAbortController.abort(); } catch (e) {}
    }, 12000);

    reportInFlightKey = reportKey;
    reportInFlightPromise = (async () => {
      const res = await fetch('/api/reports/advanced?start_date=' + start + '&end_date=' + end, {
        signal: reportAbortController.signal,
      });
      const json = await res.json();
      const fetchDone = perfNow();
      const serverTiming = res.headers.get('server-timing') || '';
      const serverDuration = Number(res.headers.get('x-reports-duration-ms')) || null;
      const cacheStatus = res.headers.get('x-cache') || '';

      if (requestId !== activeReportRequestId) return;
      
      if (!json.success) {
        if (customersList) customersList.innerHTML = 'Error: ' + json.message;
        pushPerfMetric('reports_load_failed', {
          key: reportKey,
          reason: 'api_failed',
          fetch_ms: Math.round(fetchDone - fetchStart),
          server_timing: serverTiming,
          cache: cacheStatus
        });
        return;
      }
      
      const data = json.data || {};
      const uiResult = applyReportsDataToUI(data, days);
      const hourlyData = uiResult.hourlyData;
      setReportsSnapshot(reportKey, data);
      updateReportsCacheBadge('', '');

      const domDone = perfNow();
      pushPerfMetric('reports_load_done', {
        key: reportKey,
        fetch_ms: Math.round(fetchDone - fetchStart),
        dom_ms: Math.round(domDone - fetchDone),
        total_ms: Math.round(domDone - loadStart),
        server_timing: serverTiming,
        server_ms: serverDuration,
        cache: cacheStatus,
        top_products_count: (data.top_products || data.topProducts || []).length,
        top_customers_count: (data.top_customers || data.topCustomers || []).length,
        hourly_count: hourlyData.length
      });

      // Render chart di background agar list data tampil lebih cepat.
      renderReportsChart(hourlyData).catch((e) => {
        console.error('[REPORTS FIX] Background chart render error:', e);
      });
    })();

    await reportInFlightPromise;
    clearTimeout(timeoutId);
    
  } catch(err) {
    if (err && err.name === 'AbortError') return;
    console.error('[REPORTS FIX] Error:', err);
    if (!snapshot?.data && customersList) customersList.innerHTML = 'Error: ' + err.message;
    if (snapshot?.data) {
      updateReportsCacheBadge('Koneksi bermasalah. Menampilkan data cache terakhir.', 'stale');
    }
    pushPerfMetric('reports_load_error', {
      key: reportKey,
      message: err?.message || String(err),
      total_ms: Math.round(perfNow() - loadStart)
    });
  } finally {
    if (reportInFlightKey === reportKey) {
      reportInFlightKey = '';
      reportInFlightPromise = null;
    }
  }
}

// Override window.loadAdvancedData
window.loadAdvancedData = function(start, end) {
  if (!start || !end) {
    console.warn('[REPORTS FIX] Invalid dates, using defaults');
    const defaults = getDefaultDates(7);
    start = defaults.start;
    end = defaults.end;
  }
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('[REPORTS FIX] Invalid date values:', start, end);
    const defaults = getDefaultDates(7);
    loadReportsData(defaults.start, defaults.end, defaults.days);
    return;
  }
  
  const days = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
  destroyCharts();
  loadReportsData(start, end, days);
};

// Setup toggles
function setupToggles() {
  if (window.__reportsFixTogglesBound) return;
  window.__reportsFixTogglesBound = true;

  document.querySelectorAll('.period-btn, [data-period]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      document.querySelectorAll('.period-btn, [data-period]').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');
      
      const days = parseInt(newBtn.dataset.period) || 7;
      const defaults = getDefaultDates(days);
      
      destroyCharts();
      loadReportsData(defaults.start, defaults.end, days);
    });
  });
}

// DASHBOARD OVERRIDE: Apply all patches
function applyDashboardPatches() {
  if (!dashboardPatchApplied) {
    console.log('[REPORTS FIX] Applying dashboard patches...');
  }
  tryPatchDashboardHooks();

  // 3. Selalu trigger render saat masuk dashboard agar tidak tertinggal versi lama.
  const period = getActiveDashboardPeriod();
  setTimeout(() => renderDashboardChart(period, { allowRetry: true, force: true }), 50);
  setTimeout(() => renderDashboardChart(period, { allowRetry: true }), 300);
  setTimeout(() => {
    if (window.updateChartHeader && !window.updateChartHeader._patched) {
      try { window.updateChartHeader(period); } catch (e) {}
      tryPatchDashboardHooks();
    }
  }, 420);
}

// Expose functions
window.loadRealReportsData = loadReportsData;
window.renderDashboardChart = renderDashboardChart;

// INIT FUNCTION
function init() {
  console.log('[REPORTS FIX] Init running...');
  
  // Check if we're on dashboard page
  if (document.getElementById('dashboard-chart-container')) {
    console.log('[REPORTS FIX] Dashboard page detected');
    applyDashboardPatches();
  }
  
  // Check if we're on reports page
  if (document.getElementById('top-customers-list')) {
    console.log('[REPORTS FIX] Reports page detected');
    if (!window.__reportsFixReportsLoadedOnce) {
      window.__reportsFixReportsLoadedOnce = true;
      loadReportsData();
    }
    setupToggles();
  }
}

let initTimer = null;
function scheduleInit(delay = 120) {
  if (initTimer) clearTimeout(initTimer);
  initTimer = setTimeout(() => {
    initTimer = null;
    init();
  }, delay);
}

// MULTIPLE INIT ATTEMPTS
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    scheduleInit(60);
  });
} else {
  scheduleInit(40);
}

// Also listen for navigation changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    window.__reportsFixReportsLoadedOnce = false;
    window.__reportsFixTogglesBound = false;
    if (dashboardRenderRetryTimer) {
      clearTimeout(dashboardRenderRetryTimer);
      dashboardRenderRetryTimer = null;
    }
    if (dashboardHookRetryTimer) {
      clearTimeout(dashboardHookRetryTimer);
      dashboardHookRetryTimer = null;
    }
    dashboardHookRetryCount = 0;
    dashboardRenderRetryCount = 0;
    console.log('[REPORTS FIX] URL changed, re-init');
    scheduleInit(220);
  }
}).observe(document, { subtree: true, childList: true });

console.log('[REPORTS FIX v18] Ready');
