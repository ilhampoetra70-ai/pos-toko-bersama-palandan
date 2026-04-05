// Reports Fix - Version 15 (Fix Invalid Date Error)
console.log('[REPORTS FIX v15] Starting...');

// Global state
let hourlyChartInstance = null;
let dashboardChartInstance = null;
let isProcessing = false;

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
  return new Promise((resolve) => {
    if (typeof Chart !== 'undefined') {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
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
}

// OVERRIDE: Dashboard renderChart
function overrideDashboardChart() {
  console.log('[REPORTS FIX] Overriding dashboard renderChart');
  
  window.renderChart = function(period) {
    console.log('[REPORTS FIX] renderChart called with:', period);
    
    const data = window.dashboardData?.[period] || [];
    if (data.length === 0) return '<div style="text-align:center;padding:20px;">Tidak ada data</div>';
    
    setTimeout(async () => {
      const container = document.getElementById('dashboard-chart-container');
      if (!container) return;
      
      container.innerHTML = '<canvas id="dashboardChartCanvas" style="max-height:200px;"></canvas>';
      const canvas = document.getElementById('dashboardChartCanvas');
      if (!canvas) return;
      
      await loadChartJs();
      
      if (typeof Chart === 'undefined') {
        let html = '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:150px;padding:10px;gap:4px;">';
        const max = Math.max(...data.map(d => d.amount || 0), 1);
        data.forEach(d => {
          const h = Math.max(((d.amount || 0) / max) * 120, 4);
          html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:100%;background:#3b82f6;border-radius:2px;height:${h}px;"></div>
            <div style="font-size:8px;color:#666;">${d.day || d.date?.slice(5) || ''}</div>
          </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        return;
      }
      
      try {
        const ctx = canvas.getContext('2d');
        
        if (dashboardChartInstance) {
          dashboardChartInstance.destroy();
        }
        
        dashboardChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map(d => d.day || d.date?.slice(5) || ''),
            datasets: [{
              label: 'Penjualan',
              data: data.map(d => d.amount || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
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
        console.error('[REPORTS FIX] Dashboard chart error:', e);
      }
    }, 10);
    
    return '<canvas id="dashboardChartCanvas" style="max-height:200px;"></canvas>';
  };
  
  if (window.initDashboardChart) {
    window.initDashboardChart = function() {
      window.renderChart('week');
    };
  }
  
  if (document.getElementById('dashboard-chart-container')) {
    window.renderChart('week');
  }
}

// Reports Chart
async function renderReportsChart(hourlyData) {
  if (isProcessing) return;
  isProcessing = true;
  
  let canvas = document.getElementById('hourlyChart');
  let container = document.querySelector('.chart-container');
  
  if (!canvas && container) {
    container.innerHTML = '<canvas id="hourlyChart"></canvas>';
    canvas = document.getElementById('hourlyChart');
  }
  
  if (!canvas) {
    isProcessing = false;
    return;
  }
  
  if (hourlyChartInstance) {
    try { hourlyChartInstance.destroy(); } catch(e){}
  }
  
  if (hourlyData.length === 0) {
    canvas.parentElement.innerHTML = '<div style="text-align:center;padding:40px;">Tidak ada data</div>';
    isProcessing = false;
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
  }
  
  isProcessing = false;
}

// Load Reports Data
async function loadReportsData(start, end, days) {
  // FIX: Use default dates if not provided
  if (!start || !end) {
    const defaults = getDefaultDates(days || 7);
    start = defaults.start;
    end = defaults.end;
    days = defaults.days;
  }
  
  console.log('[REPORTS FIX] Loading reports:', start, 'to', end, '(' + days + ' days)');
  
  const customersList = document.getElementById('top-customers-list');
  const productsList = document.getElementById('top-products-list');
  
  if (customersList) customersList.innerHTML = 'Memuat...';
  if (productsList) productsList.innerHTML = 'Memuat...';
  
  destroyCharts();
  
  try {
    const res = await fetch('/api/reports/advanced?start_date=' + start + '&end_date=' + end);
    const json = await res.json();
    
    if (!json.success) {
      if (customersList) customersList.innerHTML = 'Error: ' + json.message;
      return;
    }
    
    const data = json.data || {};
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
    
    await renderReportsChart(hourlyData);
    
    if (customersList) {
      const customers = data.top_customers || data.topCustomers || [];
      customersList.innerHTML = customers.map((c, i) => 
        `<div class="data-item"><div class="item-rank">${i+1}</div><div class="item-info"><div class="item-name">${c.customer_name || c.name || 'Pelanggan '+(i+1)}</div><div class="item-meta">${c.transaction_count || 0} transaksi</div></div><div class="item-value">${formatCurrency(c.total_revenue || 0)}</div></div>`
      ).join('') || '<div class="empty-state">Tidak ada data</div>';
    }
    
    if (productsList) {
      const products = data.top_products || data.topProducts || [];
      productsList.innerHTML = products.map((p, i) => 
        `<div class="data-item"><div class="item-rank">${i+1}</div><div class="item-info"><div class="item-name">${p.product_name || p.name || 'Produk '+(i+1)}</div><div class="item-meta">${p.qty || 0} terjual</div></div><div class="item-value">${formatCurrency(p.total_revenue || 0)}</div></div>`
      ).join('') || '<div class="empty-state">Tidak ada data</div>';
    }
    
  } catch(err) {
    console.error('[REPORTS FIX] Error:', err);
    if (customersList) customersList.innerHTML = 'Error: ' + err.message;
  }
}

// Override window.loadAdvancedData
window.loadAdvancedData = function(start, end) {
  // FIX: Validate dates
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

// Init
window.loadRealReportsData = loadReportsData;

function init() {
  console.log('[REPORTS FIX] Init');
  
  if (document.getElementById('dashboard-chart-container')) {
    overrideDashboardChart();
  }
  
  if (document.getElementById('top-customers-list')) {
    loadReportsData();
    setupToggles();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
} else {
  setTimeout(init, 300);
}

setTimeout(init, 1500);

console.log('[REPORTS FIX v15] Ready');
