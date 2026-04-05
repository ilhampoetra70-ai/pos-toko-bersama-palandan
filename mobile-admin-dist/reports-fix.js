// Reports Fix - Version 7 (Complete Statbox Fix)
console.log('[REPORTS FIX v7] Starting...');

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Current period tracker
let currentPeriodDays = 7;

async function loadRealReportsData(startDate, endDate, periodDays) {
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const days = periodDays || currentPeriodDays;
  currentPeriodDays = days;
  
  console.log('[REPORTS FIX] Loading data from', start, 'to', end, 'period:', days, 'days');
  
  const hourlyLoading = document.getElementById('hourly-loading');
  const productsList = document.getElementById('top-products-list');
  const customersList = document.getElementById('top-customers-list');
  
  if (hourlyLoading) {
    hourlyLoading.style.display = 'block';
    hourlyLoading.innerHTML = 'Memuat data<br><small>' + start + ' s/d ' + end + '</small>';
  }
  if (productsList) productsList.innerHTML = '<div class="loading-placeholder">Memuat data...</div>';
  if (customersList) customersList.innerHTML = '<div class="loading-placeholder">Memuat data...</div>';
  
  try {
    const res = await fetch('/api/reports/advanced?start_date=' + start + '&end_date=' + end);
    const json = await res.json();
    
    console.log('[REPORTS FIX] API response:', json);
    window.debugReportData = json;
    
    if (!json.success) {
      console.error('[REPORTS FIX] API failed:', json.message);
      if (customersList) customersList.innerHTML = '<div class="empty-state">Error: ' + json.message + '</div>';
      return;
    }
    
    const data = json.data || {};
    
    // Calculate summary from hourly data
    const hourlyData = data.hourly_sales || data.hourlySales || [];
    const totalTransactions = hourlyData.reduce((sum, h) => sum + (h.transaction_count || 0), 0);
    const totalRevenue = hourlyData.reduce((sum, h) => sum + (h.total_revenue || 0), 0);
    const avgTransaction = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
    
    console.log('[REPORTS FIX] Calculated stats:', { totalRevenue, totalTransactions, avgTransaction, days });
    
    // Update ALL Statboxes
    updateStatboxes(totalRevenue, totalTransactions, avgTransaction, days);
    
    // Fix Customers
    if (customersList) {
      const customers = data.top_customers || data.topCustomers || [];
      if (customers.length > 0) {
        customersList.innerHTML = customers.map((c, i) => {
          const name = c.customer_name || c.name || 'Pelanggan ' + (i + 1);
          const tx = c.transaction_count || 0;
          const rev = c.total_revenue || c.total_spent || 0;
          return '<div class="data-item"><div class="item-rank">' + (i + 1) + '</div><div class="item-info"><div class="item-name">' + name + '</div><div class="item-meta">' + tx + ' transaksi</div></div><div class="item-value">' + formatCurrency(rev) + '</div></div>';
        }).join('');
      } else {
        customersList.innerHTML = '<div class="empty-state">Tidak ada data pelanggan</div>';
      }
    }
    
    // Fix Products
    if (productsList) {
      const products = data.top_products || data.topProducts || [];
      if (products.length > 0) {
        productsList.innerHTML = products.map((p, i) => {
          const name = p.product_name || p.name || 'Produk ' + (i + 1);
          const qty = p.qty || p.total_qty || 0;
          const tx = p.transaction_count || 0;
          const rev = p.total_revenue || 0;
          return '<div class="data-item"><div class="item-rank">' + (i + 1) + '</div><div class="item-info"><div class="item-name">' + name + '</div><div class="item-meta">' + qty + ' terjual • ' + tx + ' transaksi</div></div><div class="item-value">' + formatCurrency(rev) + '</div></div>';
        }).join('');
      } else {
        productsList.innerHTML = '<div class="empty-state">Tidak ada data produk</div>';
      }
    }
    
    if (hourlyLoading) hourlyLoading.style.display = 'none';
    
  } catch (err) {
    console.error('[REPORTS FIX] Error:', err);
    if (customersList) customersList.innerHTML = '<div class="empty-state">Error: ' + err.message + '</div>';
    if (hourlyLoading) hourlyLoading.style.display = 'none';
  }
}

function updateStatboxes(totalRevenue, totalTransactions, avgTransaction, days) {
  console.log('[REPORTS FIX] Updating statboxes with:', { totalRevenue, totalTransactions, avgTransaction, days });
  
  // Find all statboxes
  const statBoxes = document.querySelectorAll('.stat-box');
  console.log('[REPORTS FIX] Found statboxes:', statBoxes.length);
  
  statBoxes.forEach((box, index) => {
    const labelEl = box.querySelector('.stat-label');
    const valueEl = box.querySelector('.stat-value');
    
    if (!labelEl || !valueEl) return;
    
    const label = labelEl.textContent.trim();
    console.log('[REPORTS FIX] Statbox', index, ':', label);
    
    if (label.includes('Penjualan') || label.includes('Total')) {
      // Update label to show correct period
      labelEl.textContent = 'Total Penjualan (' + days + ' Hari)';
      valueEl.textContent = formatCurrency(totalRevenue);
      console.log('[REPORTS FIX] Updated Total Penjualan:', formatCurrency(totalRevenue));
    }
    else if (label === 'Transaksi' || label.includes('Transaksi')) {
      valueEl.textContent = totalTransactions;
      console.log('[REPORTS FIX] Updated Transaksi:', totalTransactions);
    }
    else if (label === 'Rata-rata' || label.includes('Rata')) {
      valueEl.textContent = formatCurrency(avgTransaction);
      console.log('[REPORTS FIX] Updated Rata-rata:', formatCurrency(avgTransaction));
    }
    // Piutang tidak diupdate karena datanya tidak ada di API reports/advanced
  });
}

// Override window.loadAdvancedData
window.loadAdvancedData = function(start, end) {
  // Detect period from date range
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log('[REPORTS FIX] Detected period:', diffDays, 'days');
  loadRealReportsData(start, end, diffDays);
};

console.log('[REPORTS FIX] window.loadAdvancedData overridden!');

// Setup toggle buttons
function setupToggleListeners() {
  const toggleBtns = document.querySelectorAll('.period-btn, .period-toggle .toggle-btn, [data-period]');
  console.log('[REPORTS FIX] Found toggle buttons:', toggleBtns.length);
  
  toggleBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Update active state
      document.querySelectorAll('.period-btn, .period-toggle .toggle-btn, [data-period]').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');
      
      const days = parseInt(newBtn.dataset.period);
      console.log('[REPORTS FIX] Toggle clicked, days:', days);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      loadRealReportsData(startDate, endDate, days);
    });
  });
}

window.loadRealReportsData = loadRealReportsData;

// Run setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      loadRealReportsData();
      setupToggleListeners();
    }, 1000);
  });
} else {
  setTimeout(function() {
    loadRealReportsData();
    setupToggleListeners();
  }, 1000);
}

setTimeout(setupToggleListeners, 3000);

console.log('[REPORTS FIX v7] Setup done');
