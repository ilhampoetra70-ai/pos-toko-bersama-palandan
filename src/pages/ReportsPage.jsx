import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatNumber } from '../utils/format';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import PaymentPieChart from '../components/charts/PaymentPieChart';
import HourlySalesChart from '../components/charts/HourlySalesChart';
import ProfitMarginChart from '../components/charts/ProfitMarginChart';
import PrintConfigModal from '../components/PrintConfigModal';
import ComprehensiveReport from '../components/reports/ComprehensiveReport';
import { buildSalesPlainText, buildProfitPlainText, buildComparisonPlainText, buildComprehensivePlainText } from '../utils/plainTextReport';

const TABS = [
  { id: 'sales', label: 'Ringkasan Penjualan' },
  { id: 'profit', label: 'Laporan Laba' },
  { id: 'comparison', label: 'Perbandingan Periode' },
  { id: 'comprehensive', label: 'Laporan Lengkap' },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState(getMonthStart());
  const [dateTo, setDateTo] = useState(getToday());
  const [dateFrom2, setDateFrom2] = useState('');
  const [dateTo2, setDateTo2] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [showPrintConfig, setShowPrintConfig] = useState(false);
  const [stockAuditData, setStockAuditData] = useState(null);
  const [slowMovingData, setSlowMovingData] = useState(null);

  const loadReport = useCallback(async (opts = {}) => {
    const silent = opts.silent || false;
    setLoading(true);
    try {
      // Always load slow moving (120 days) for all reports
      const slowMoving = await window.api.getSlowMovingProducts(120, 30);
      setSlowMovingData(slowMoving);

      if (activeTab === 'sales') {
        const [data, hourly, stockAudit] = await Promise.all([
          window.api.getSalesReport(dateFrom, dateTo),
          window.api.getHourlySalesPattern(dateFrom, dateTo),
          window.api.getStockAuditSummary(dateFrom, dateTo),
        ]);
        setSalesData(data);
        setHourlyData(hourly);
        setStockAuditData(stockAudit);
      } else if (activeTab === 'profit') {
        const [data, stockAudit] = await Promise.all([
          window.api.getProfitReport(dateFrom, dateTo),
          window.api.getStockAuditSummary(dateFrom, dateTo),
        ]);
        setProfitData(data);
        setStockAuditData(stockAudit);
      } else if (activeTab === 'comparison') {
        if (!dateFrom2 || !dateTo2) {
          if (!silent) alert('Silakan isi tanggal Periode B');
          setLoading(false);
          return;
        }
        const data = await window.api.getPeriodComparison(dateFrom, dateTo, dateFrom2, dateTo2);
        setComparisonData(data);
      } else if (activeTab === 'comprehensive') {
        const [data, stockAudit] = await Promise.all([
          window.api.getComprehensiveReport(dateFrom, dateTo),
          window.api.getStockAuditSummary(dateFrom, dateTo),
        ]);
        setComprehensiveData(data);
        setStockAuditData(stockAudit);
      }
    } catch (err) {
      if (!silent) alert('Gagal memuat laporan: ' + err.message);
    }
    setLoading(false);
  }, [activeTab, dateFrom, dateTo, dateFrom2, dateTo2]);

  useEffect(() => {
    if (activeTab === 'comparison' && (!dateFrom2 || !dateTo2)) return;
    loadReport({ silent: true });
  }, [activeTab]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const html = buildExportHTML();
      if (!html) {
        alert('Tampilkan laporan terlebih dahulu');
        setExporting(false);
        return false;
      }
      const result = await window.api.exportReportPdf(html);
      if (result.success) {
        alert('PDF berhasil disimpan di: ' + result.path);
        setExporting(false);
        return true;
      } else if (result.error !== 'Cancelled') {
        alert('Gagal export PDF: ' + result.error);
      }
    } catch (err) {
      alert('Gagal export PDF: ' + err.message);
    }
    setExporting(false);
    return false;
  };

  const handleSaveText = async () => {
    const text = buildPlainTextReport();
    if (!text) { alert('Tampilkan laporan terlebih dahulu'); return; }
    try {
      const result = await window.api.printPlainText(text, { action: 'save' });
      if (result.success) alert('File berhasil disimpan di: ' + result.path);
      else if (result.error !== 'Cancelled') alert('Gagal menyimpan: ' + result.error);
    } catch (err) { alert('Gagal menyimpan: ' + err.message); }
  };

  const handlePrintText = async (printer) => {
    const text = buildPlainTextReport();
    if (!text) { alert('Tampilkan laporan terlebih dahulu'); return; }
    try {
      const result = await window.api.printPlainText(text, { action: 'print', printer });
      if (!result.success) alert('Gagal mencetak: ' + result.error);
    } catch (err) { alert('Gagal mencetak: ' + err.message); }
  };

  const buildPlainTextReport = () => {
    if (activeTab === 'sales' && salesData) return buildSalesPlainText(salesData, hourlyData, dateFrom, dateTo, stockAuditData);
    if (activeTab === 'profit' && profitData) return buildProfitPlainText(profitData, dateFrom, dateTo, stockAuditData);
    if (activeTab === 'comparison' && comparisonData) return buildComparisonPlainText(comparisonData, dateFrom, dateTo, dateFrom2, dateTo2);
    if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensivePlainText(comprehensiveData, dateFrom, dateTo, stockAuditData);
    return null;
  };

  const fmtCurrency = (v) => formatCurrency(v);
  const fmtNum = (v) => formatNumber(v);

  const buildExportHTML = () => {
    if (activeTab === 'sales' && salesData) return buildSalesHTML();
    if (activeTab === 'profit' && profitData) return buildProfitHTML();
    if (activeTab === 'comparison' && comparisonData) return buildComparisonHTML();
    if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensiveHTML();
    return null;
  };

  const wrapReport = (title, dateRange, body) => {
    const now = new Date().toLocaleString('id-ID');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;color:#1a1a1a;padding:20px 30px}
.report-header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #333}
.report-header h1{font-size:18px;font-weight:bold;margin-bottom:2px}
.report-header h2{font-size:14px;font-weight:600;color:#444;margin-bottom:4px}
.report-header .date-range{font-size:11px;color:#666}
table{width:100%;border-collapse:collapse;margin:10px 0}
table th,table td{padding:6px 8px;text-align:left;border-bottom:1px solid #ddd}
table th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase;color:#555}
table td{font-size:11px}
.text-right{text-align:right}
.text-center{text-align:center}
.summary-cards{display:flex;gap:15px;margin:15px 0}
.summary-card{flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}
.summary-card .label{font-size:10px;color:#666;text-transform:uppercase;margin-bottom:4px}
.summary-card .value{font-size:16px;font-weight:bold}
.section-title{font-size:13px;font-weight:600;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #eee}
.report-footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;text-align:center;font-size:9px;color:#999}
.bar-container{display:flex;align-items:center;gap:8px;margin:4px 0}
.bar-label{width:80px;font-size:11px;text-align:right}
.bar-track{flex:1;background:#eee;height:18px;border-radius:3px;overflow:hidden}
.bar-fill{background:#3b82f6;height:100%;border-radius:3px}
.bar-value{width:100px;font-size:11px}
.font-bold{font-weight:bold}
</style></head><body>
<div class="report-header"><h1>${title}</h1><h2>${dateRange}</h2></div>
${body}
<div class="report-footer">Dicetak pada ${now}</div>
</body></html>`;
  };

  const buildSalesHTML = () => {
    const d = salesData;
    const summaryCards = `<div class="summary-cards">
      <div class="summary-card"><div class="label">Total Pendapatan</div><div class="value">${fmtCurrency(d.summary.revenue)}</div></div>
      <div class="summary-card"><div class="label">Jumlah Transaksi</div><div class="value">${fmtNum(d.summary.count)}</div></div>
      <div class="summary-card"><div class="label">Rata-rata Transaksi</div><div class="value">${fmtCurrency(d.summary.average)}</div></div>
    </div>`;

    const paymentRows = d.paymentBreakdown.map(p =>
      `<tr><td>${p.payment_method === 'cash' ? 'Tunai' : p.payment_method}</td><td class="text-center">${p.count}</td><td class="text-right">${fmtCurrency(p.total)}</td></tr>`
    ).join('');
    const paymentTable = `<div class="section-title">Metode Pembayaran</div>
      <table><thead><tr><th>Metode</th><th class="text-center">Jumlah</th><th class="text-right">Total</th></tr></thead><tbody>${paymentRows}</tbody></table>`;

    const dailyRows = d.dailyBreakdown.map(day =>
      `<tr><td>${day.date}</td><td class="text-center">${day.count}</td><td class="text-right">${fmtCurrency(day.total)}</td></tr>`
    ).join('');
    const dailyTable = `<div class="section-title">Penjualan Harian</div>
      <table><thead><tr><th>Tanggal</th><th class="text-center">Transaksi</th><th class="text-right">Total</th></tr></thead><tbody>${dailyRows}</tbody></table>`;

    const topRows = d.topProducts.map((p, i) =>
      `<tr><td>${i + 1}</td><td>${p.product_name}</td><td class="text-center">${fmtNum(p.qty)}</td><td class="text-right">${fmtCurrency(p.total)}</td></tr>`
    ).join('');
    const topTable = `<div class="section-title">10 Produk Terlaris</div>
      <table><thead><tr><th>#</th><th>Produk</th><th class="text-center">Qty</th><th class="text-right">Total</th></tr></thead><tbody>${topRows}</tbody></table>`;

    const stockAuditSection = buildStockAuditHTML();

    const slowMovingSection = buildSlowMovingHTML();

    return wrapReport('Ringkasan Penjualan', `${dateFrom} s/d ${dateTo}`,
      summaryCards + paymentTable + dailyTable + topTable + slowMovingSection + stockAuditSection);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const buildStockAuditHTML = () => {
    if (!stockAuditData || stockAuditData.length === 0) return '';

    // Calculate totals
    const totalIncreases = stockAuditData.filter(d => d.total_change > 0).reduce((sum, d) => sum + d.total_change, 0);
    const totalDecreases = stockAuditData.filter(d => d.total_change < 0).reduce((sum, d) => sum + Math.abs(d.total_change), 0);
    const totalChanges = stockAuditData.reduce((sum, d) => sum + d.change_count, 0);

    const summaryRow = `<div style="display:flex;gap:20px;margin-bottom:10px;font-size:11px;">
      <span><strong>Total Perubahan:</strong> ${fmtNum(totalChanges)}</span>
      <span style="color:#16a34a"><strong>↑ Penambahan:</strong> +${fmtNum(totalIncreases)}</span>
      <span style="color:#dc2626"><strong>↓ Pengurangan:</strong> -${fmtNum(totalDecreases)}</span>
    </div>`;

    const rows = stockAuditData.map(log => {
      const isIncrease = log.total_change > 0;
      const isDecrease = log.total_change < 0;
      const arrow = isIncrease ? '↑' : isDecrease ? '↓' : '';
      const changeStyle = isIncrease ? 'color:#16a34a;font-weight:bold' : isDecrease ? 'color:#dc2626;font-weight:bold' : '';
      const changeText = isIncrease ? `+${fmtNum(log.total_change)}` : fmtNum(log.total_change);
      const timeInfo = log.change_count === 1
        ? formatDateTime(log.last_change)
        : `${formatDateTime(log.first_change)} - ${formatDateTime(log.last_change)}`;
      return `<tr>
        <td>${log.product_name}</td>
        <td class="text-center">${fmtNum(log.change_count)}x</td>
        <td class="text-center" style="${changeStyle}">${arrow} ${changeText}</td>
        <td style="font-size:10px">${log.user_names || '-'}</td>
        <td style="font-size:10px;color:#666">${timeInfo}</td>
      </tr>`;
    }).join('');

    return `<div class="section-title">Audit Trail Perubahan Stok Manual</div>
      ${summaryRow}
      <table>
        <thead><tr><th>Produk</th><th class="text-center">Jml</th><th class="text-center">Netto</th><th>Diubah Oleh</th><th>Waktu</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:9px;color:#666;margin-top:5px;">
        ↑ = Stok bertambah | ↓ = Stok berkurang | Netto = Total penambahan - pengurangan dalam periode
      </div>`;
  };

  const buildSlowMovingHTML = () => {
    if (!slowMovingData || slowMovingData.length === 0) return '';

    const totalValue = slowMovingData.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalStock = slowMovingData.reduce((sum, p) => sum + p.stock, 0);

    const summaryRow = `<div style="display:flex;gap:20px;margin-bottom:10px;font-size:11px;">
      <span><strong>Total Produk:</strong> ${slowMovingData.length}</span>
      <span><strong>Total Stok:</strong> ${fmtNum(totalStock)} pcs</span>
      <span style="color:#ea580c"><strong>Estimasi Nilai Tertahan:</strong> ${fmtCurrency(totalValue)}</span>
    </div>`;

    const rows = slowMovingData.map((p, i) => {
      const lastSale = p.last_sale_date
        ? new Date(p.last_sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Belum pernah';
      const daysText = p.days_inactive >= 9999 ? '∞' : `${p.days_inactive} hari`;
      const estValue = p.stock * p.price;
      return `<tr>
        <td class="text-center">${i + 1}</td>
        <td>${p.name}${p.category_name ? ` <span style="color:#999;font-size:10px">(${p.category_name})</span>` : ''}</td>
        <td class="text-center">${p.stock}</td>
        <td class="text-right">${fmtCurrency(p.price)}</td>
        <td>${lastSale}</td>
        <td class="text-center" style="color:#dc2626;font-weight:bold">${daysText}</td>
        <td class="text-right" style="color:#ea580c">${fmtCurrency(estValue)}</td>
      </tr>`;
    }).join('');

    return `<div class="section-title">🐌 Produk Slow Moving (Tidak Laku 120+ Hari)</div>
      ${summaryRow}
      <table>
        <thead><tr><th class="text-center">No</th><th>Produk</th><th class="text-center">Stok</th><th class="text-right">Harga</th><th>Terakhir Terjual</th><th class="text-center">Hari Inaktif</th><th class="text-right">Est. Nilai</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  };

  const buildProfitHTML = () => {
    const d = profitData;
    const summaryCards = `<div class="summary-cards">
      <div class="summary-card"><div class="label">Total Pendapatan</div><div class="value">${fmtCurrency(d.totals.revenue)}</div></div>
      <div class="summary-card"><div class="label">Total Modal</div><div class="value">${fmtCurrency(d.totals.cost)}</div></div>
      <div class="summary-card"><div class="label">Laba Kotor</div><div class="value">${fmtCurrency(d.totals.profit)}</div></div>
      <div class="summary-card"><div class="label">Margin</div><div class="value">${d.totals.margin.toFixed(1)}%</div></div>
    </div>`;

    const prodRows = d.products.map(p => {
      const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
      return `<tr><td>${p.product_name}</td><td class="text-center">${fmtNum(p.qty)}</td><td class="text-right">${fmtCurrency(p.revenue)}</td><td class="text-right">${fmtCurrency(p.total_cost)}</td><td class="text-right">${fmtCurrency(p.profit)}</td><td class="text-right">${margin}%</td></tr>`;
    }).join('');
    const prodTable = `<div class="section-title">Detail Laba per Produk</div>
      <table><thead><tr><th>Produk</th><th class="text-center">Qty</th><th class="text-right">Pendapatan</th><th class="text-right">Modal</th><th class="text-right">Laba</th><th class="text-right">Margin</th></tr></thead><tbody>${prodRows}</tbody></table>`;

    const slowMovingSection = buildSlowMovingHTML();
    const stockAuditSection = buildStockAuditHTML();

    return wrapReport('Laporan Laba', `${dateFrom} s/d ${dateTo}`, summaryCards + prodTable + slowMovingSection + stockAuditSection);
  };

  const buildComparisonHTML = () => {
    const d = comparisonData;
    const fmtDelta = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
    const body = `<div class="summary-cards">
      <div class="summary-card"><div class="label">Periode A - Pendapatan</div><div class="value">${fmtCurrency(d.periodA.revenue)}</div></div>
      <div class="summary-card"><div class="label">Periode B - Pendapatan</div><div class="value">${fmtCurrency(d.periodB.revenue)}</div></div>
      <div class="summary-card"><div class="label">Perubahan</div><div class="value">${fmtDelta(d.delta.revenue)}</div></div>
    </div>
    <table><thead><tr><th>Metrik</th><th class="text-right">Periode A</th><th class="text-right">Periode B</th><th class="text-right">Perubahan</th></tr></thead>
    <tbody>
      <tr><td>Pendapatan</td><td class="text-right">${fmtCurrency(d.periodA.revenue)}</td><td class="text-right">${fmtCurrency(d.periodB.revenue)}</td><td class="text-right">${fmtDelta(d.delta.revenue)}</td></tr>
      <tr><td>Jumlah Transaksi</td><td class="text-right">${fmtNum(d.periodA.count)}</td><td class="text-right">${fmtNum(d.periodB.count)}</td><td class="text-right">${fmtDelta(d.delta.count)}</td></tr>
      <tr><td>Rata-rata</td><td class="text-right">${fmtCurrency(d.periodA.average)}</td><td class="text-right">${fmtCurrency(d.periodB.average)}</td><td class="text-right">${fmtDelta(d.delta.average)}</td></tr>
    </tbody></table>`;
    const slowMovingSection = buildSlowMovingHTML();
    return wrapReport('Perbandingan Periode', `A: ${dateFrom} - ${dateTo} vs B: ${dateFrom2} - ${dateTo2}`, body + slowMovingSection);
  };

  const buildComprehensiveHTML = () => {
    const c = comprehensiveData;
    const sections = [];

    // Executive summary
    sections.push(`<div class="summary-cards">
      <div class="summary-card"><div class="label">Total Pendapatan</div><div class="value">${fmtCurrency(c.sales.summary.revenue)}</div></div>
      <div class="summary-card"><div class="label">Jumlah Transaksi</div><div class="value">${fmtNum(c.sales.summary.count)}</div></div>
      <div class="summary-card"><div class="label">Rata-rata</div><div class="value">${fmtCurrency(c.sales.summary.average)}</div></div>
      <div class="summary-card"><div class="label">Laba Kotor</div><div class="value">${fmtCurrency(c.profit.totals.profit)}</div></div>
    </div>`);

    // Payment breakdown
    const payRows = c.sales.paymentBreakdown.map(p =>
      `<tr><td>${p.payment_method === 'cash' ? 'Tunai' : p.payment_method}</td><td class="text-center">${p.count}</td><td class="text-right">${fmtCurrency(p.total)}</td></tr>`
    ).join('');
    sections.push(`<div class="section-title">Metode Pembayaran</div>
      <table><thead><tr><th>Metode</th><th class="text-center">Jumlah</th><th class="text-right">Total</th></tr></thead><tbody>${payRows}</tbody></table>`);

    // Top products
    const topRows = c.sales.topProducts.map((p, i) =>
      `<tr><td>${i + 1}</td><td>${p.product_name}</td><td class="text-center">${fmtNum(p.qty)}</td><td class="text-right">${fmtCurrency(p.total)}</td></tr>`
    ).join('');
    sections.push(`<div class="section-title">Produk Terlaris</div>
      <table><thead><tr><th>#</th><th>Produk</th><th class="text-center">Qty</th><th class="text-right">Total</th></tr></thead><tbody>${topRows}</tbody></table>`);

    // Bottom products
    if (c.bottomProducts && c.bottomProducts.length > 0) {
      const botRows = c.bottomProducts.map((p, i) =>
        `<tr><td>${i + 1}</td><td>${p.product_name}</td><td class="text-center">${fmtNum(p.qty)}</td><td class="text-right">${fmtCurrency(p.total)}</td></tr>`
      ).join('');
      sections.push(`<div class="section-title">Produk Paling Sedikit Terjual</div>
        <table><thead><tr><th>#</th><th>Produk</th><th class="text-center">Qty</th><th class="text-right">Total</th></tr></thead><tbody>${botRows}</tbody></table>`);
    }

    // Profit detail
    const profitRows = c.profit.products.map(p => {
      const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
      return `<tr><td>${p.product_name}</td><td class="text-center">${fmtNum(p.qty)}</td><td class="text-right">${fmtCurrency(p.revenue)}</td><td class="text-right">${fmtCurrency(p.total_cost)}</td><td class="text-right">${fmtCurrency(p.profit)}</td><td class="text-right">${margin}%</td></tr>`;
    }).join('');
    sections.push(`<div class="section-title">Detail Laba per Produk</div>
      <table><thead><tr><th>Produk</th><th class="text-center">Qty</th><th class="text-right">Pendapatan</th><th class="text-right">Modal</th><th class="text-right">Laba</th><th class="text-right">Margin</th></tr></thead><tbody>${profitRows}</tbody></table>`);

    // Daily breakdown
    const dailyRows = c.sales.dailyBreakdown.map(day =>
      `<tr><td>${day.date}</td><td class="text-center">${day.count}</td><td class="text-right">${fmtCurrency(day.total)}</td></tr>`
    ).join('');
    sections.push(`<div class="section-title">Penjualan Harian</div>
      <table><thead><tr><th>Tanggal</th><th class="text-center">Transaksi</th><th class="text-right">Total</th></tr></thead><tbody>${dailyRows}</tbody></table>`);

    // Slow moving products
    const slowMovingSection = buildSlowMovingHTML();
    if (slowMovingSection) sections.push(slowMovingSection);

    // Stock audit log
    const stockAuditSection = buildStockAuditHTML();
    if (stockAuditSection) sections.push(stockAuditSection);

    return wrapReport('Laporan Lengkap', `${dateFrom} s/d ${dateTo}`, sections.join(''));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Laporan</h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {activeTab === 'comparison' ? 'Periode A - Dari' : 'Dari Tanggal'}
            </label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="input w-44" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {activeTab === 'comparison' ? 'Periode A - Sampai' : 'Sampai Tanggal'}
            </label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="input w-44" />
          </div>

          {activeTab === 'comparison' && (
            <>
              <div className="w-px h-8 bg-gray-300" />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Periode B - Dari</label>
                <input type="date" value={dateFrom2} onChange={e => setDateFrom2(e.target.value)}
                  className="input w-44" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Periode B - Sampai</label>
                <input type="date" value={dateTo2} onChange={e => setDateTo2(e.target.value)}
                  className="input w-44" />
              </div>
            </>
          )}

          <button onClick={loadReport} disabled={loading} className="btn-primary">
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
          <button onClick={() => setShowPrintConfig(true)} disabled={exporting || loading} className="btn-secondary">
            Cetak / Export
          </button>
        </div>
      </div>

      {/* Report content */}
      {activeTab === 'sales' && salesData && <SalesReport data={salesData} hourlyData={hourlyData} profitData={profitData} stockAuditData={stockAuditData} dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === 'profit' && profitData && <ProfitReport data={profitData} stockAuditData={stockAuditData} />}
      {activeTab === 'comparison' && comparisonData && (
        <ComparisonReport data={comparisonData} labelA={`${dateFrom} - ${dateTo}`} labelB={`${dateFrom2} - ${dateTo2}`} />
      )}
      {activeTab === 'comprehensive' && comprehensiveData && <ComprehensiveReport data={comprehensiveData} stockAuditData={stockAuditData} />}

      {!loading && !salesData && !profitData && !comparisonData && !comprehensiveData && (
        <div className="card text-center text-gray-400 py-12">
          Pilih rentang tanggal dan klik "Tampilkan" untuk melihat laporan
        </div>
      )}

      {showPrintConfig && (
        <PrintConfigModal
          onClose={() => setShowPrintConfig(false)}
          onExportPdf={exportPdf}
          onSaveText={handleSaveText}
          onPrintText={handlePrintText}
          getReportHtml={buildExportHTML}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card">
      <div className={`text-xs font-medium uppercase tracking-wide ${colors[color]?.split(' ')[1] || 'text-gray-500'} mb-1`}>{title}</div>
      <div className="text-xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function StockAuditSection({ data }) {
  if (!data || data.length === 0) return null;

  // Calculate totals
  const totalIncreases = data.filter(d => d.total_change > 0).reduce((sum, d) => sum + d.total_change, 0);
  const totalDecreases = data.filter(d => d.total_change < 0).reduce((sum, d) => sum + Math.abs(d.total_change), 0);
  const totalChanges = data.reduce((sum, d) => sum + d.change_count, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Audit Trail Perubahan Stok Manual
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Perubahan stok manual (tidak termasuk penjualan)
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">{formatNumber(totalChanges)}</div>
            <div className="text-xs text-gray-400">Total Perubahan</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
              <span>↑</span>{formatNumber(totalIncreases)}
            </div>
            <div className="text-xs text-gray-400">Penambahan</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
              <span>↓</span>{formatNumber(totalDecreases)}
            </div>
            <div className="text-xs text-gray-400">Pengurangan</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Produk</th>
              <th className="text-center py-2.5 px-3 text-gray-500 font-medium">Jml</th>
              <th className="text-center py-2.5 px-3 text-gray-500 font-medium">Netto</th>
              <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Diubah Oleh</th>
              <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {data.map(log => {
              const isIncrease = log.total_change > 0;
              const isDecrease = log.total_change < 0;
              const formatDT = (dateStr) => {
                if (!dateStr) return '-';
                const d = new Date(dateStr);
                return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) +
                  ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              };
              const timeInfo = log.change_count === 1
                ? formatDT(log.last_change)
                : `${formatDT(log.first_change)} - ${formatDT(log.last_change)}`;
              return (
                <tr key={log.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{log.product_name}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                      {formatNumber(log.change_count)}x
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded ${
                      isIncrease ? 'bg-green-100 text-green-700' :
                      isDecrease ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {isIncrease && <span className="text-base">↑</span>}
                      {isDecrease && <span className="text-base">↓</span>}
                      {isIncrease ? '+' : ''}{formatNumber(log.total_change)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 text-xs">{log.user_names || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{timeInfo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="text-green-500 text-sm">↑</span> Stok bertambah
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-500 text-sm">↓</span> Stok berkurang
        </span>
        <span className="ml-auto">Netto = Total penambahan - pengurangan dalam periode</span>
      </div>
    </div>
  );
}

function SalesReport({ data, hourlyData, profitData, stockAuditData, dateFrom, dateTo }) {
  const { summary, paymentBreakdown, dailyBreakdown, topProducts } = data;
  const maxDaily = Math.max(...dailyBreakdown.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Pendapatan" value={formatCurrency(summary.revenue)} color="blue" />
        <StatCard title="Jumlah Transaksi" value={formatNumber(summary.count)} sub="transaksi" color="green" />
        <StatCard title="Rata-rata Transaksi" value={formatCurrency(summary.average)} color="purple" />
      </div>

      {/* Sales trend chart */}
      <SalesTrendChart data={dailyBreakdown} />

      {/* Hourly sales chart */}
      {hourlyData && <HourlySalesChart data={hourlyData} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment method breakdown with chart */}
        <div className="space-y-4">
          <PaymentPieChart data={paymentBreakdown} />
          <div className="card">
            <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
            {paymentBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm">Tidak ada data</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Metode</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Jumlah</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentBreakdown.map(p => (
                    <tr key={p.payment_method} className="border-b border-gray-100">
                      <td className="py-2">{p.payment_method === 'cash' ? 'Tunai' : p.payment_method}</td>
                      <td className="py-2 text-center">{p.count}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top products with chart - now uses expandable section */}
        <div className="space-y-4">
          <TopProductsChart data={topProducts} profitData={profitData?.products} />
          <TopProductsSection dateFrom={dateFrom} dateTo={dateTo} initialData={topProducts} />
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="card">
        <h3 className="font-semibold mb-4">Penjualan Harian</h3>
        {dailyBreakdown.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada data</p>
        ) : (
          <div className="space-y-3">
            {dailyBreakdown.map(day => {
              const pct = (day.total / maxDaily) * 100;
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{day.date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 25 && <span className="text-xs text-white font-medium">{formatCurrency(day.total)}</span>}
                    </div>
                  </div>
                  {pct <= 25 && <span className="text-xs text-gray-600 w-28 shrink-0">{formatCurrency(day.total)}</span>}
                  <span className="text-xs text-gray-400 w-16 shrink-0 text-right">{day.count} tx</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slow Moving Products */}
      <SlowMovingSection />

      {/* Stock audit log */}
      <StockAuditSection data={stockAuditData} />
    </div>
  );
}

// Expandable Top Products Section
function TopProductsSection({ dateFrom, dateTo, initialData }) {
  const [products, setProducts] = useState(initialData || []);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const loadProducts = async (newLimit) => {
    setLoading(true);
    try {
      const data = await window.api.getTopProductsExpanded(dateFrom, dateTo, newLimit);
      setProducts(data);
      setLimit(newLimit);
    } catch (err) {
      console.error('Failed to load top products:', err);
    }
    setLoading(false);
  };

  const toggleExpand = () => {
    const newLimit = limit === 10 ? 30 : 10;
    loadProducts(newLimit);
  };

  // Update when date range changes
  useEffect(() => {
    if (initialData) setProducts(initialData);
    setLimit(10);
  }, [dateFrom, dateTo, initialData]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-lg">🏆</span>
          Produk Terlaris
        </h3>
        <span className="text-xs text-gray-400">Top {limit}</span>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-400 text-sm">Tidak ada data</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2.5 px-2 text-gray-500 font-medium w-12">Rank</th>
                  <th className="text-left py-2.5 px-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Frek</th>
                  <th className="text-right py-2.5 px-2 text-gray-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.product_name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        i < 3 ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-medium">{p.product_name}</td>
                    <td className="py-2.5 px-2 text-center">{formatNumber(p.qty)}</td>
                    <td className="py-2.5 px-2 text-center text-gray-500">{p.frequency}x</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-green-600">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length >= 10 && (
            <button
              onClick={toggleExpand}
              disabled={loading}
              className="mt-4 w-full py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Memuat...' : limit === 10 ? 'Tampilkan 20 Lagi (Total 30)' : 'Tampilkan Lebih Sedikit'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Slow Moving Products Section
function SlowMovingSection() {
  const [products, setProducts] = useState([]);
  const [inactiveDays, setInactiveDays] = useState(120);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Auto-load on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await window.api.getSlowMovingProducts(inactiveDays, limit);
      setProducts(data);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load slow moving products:', err);
    }
    setLoading(false);
  };

  const toggleExpand = async () => {
    const newLimit = limit === 10 ? 30 : 10;
    setLimit(newLimit);
    setLoading(true);
    try {
      const data = await window.api.getSlowMovingProducts(inactiveDays, newLimit);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load slow moving products:', err);
    }
    setLoading(false);
  };

  // Calculate total estimated value
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-lg">🐌</span>
            Produk Slow Moving (Tidak Laku)
          </h3>
          <p className="text-xs text-gray-500 mt-1">Produk yang tidak terjual dalam periode tertentu</p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="text-sm text-gray-600">Periode inaktif minimal:</label>
        <select
          value={inactiveDays}
          onChange={(e) => setInactiveDays(Number(e.target.value))}
          className="input py-1.5 px-3 text-sm w-auto"
        >
          <option value={60}>60 Hari</option>
          <option value={90}>90 Hari</option>
          <option value={120}>120 Hari</option>
          <option value={180}>180 Hari</option>
          <option value={365}>1 Tahun</option>
        </select>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="btn-primary py-1.5 px-4 text-sm"
        >
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </div>

      {!loaded ? (
        <div className="text-center py-8 text-gray-400">
          <p>Klik "Tampilkan" untuk melihat produk slow moving</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center bg-green-50 border-2 border-green-200 rounded-lg">
          <span className="text-3xl mb-2 block">✅</span>
          <p className="text-green-700 font-medium">Bagus! Semua produk aktif terjual.</p>
          <p className="text-green-600 text-sm mt-1">Tidak ada produk yang tidak laku lebih dari {inactiveDays} hari</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{products.length}</div>
              <div className="text-xs text-red-500">Produk</div>
            </div>
            <div className="h-8 w-px bg-red-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{formatCurrency(totalValue)}</div>
              <div className="text-xs text-red-500">Estimasi Nilai Tertahan</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2.5 px-2 text-gray-500 font-medium w-10">No</th>
                  <th className="text-left py-2.5 px-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Stok</th>
                  <th className="text-right py-2.5 px-2 text-gray-500 font-medium">Harga</th>
                  <th className="text-left py-2.5 px-2 text-gray-500 font-medium">Terakhir Terjual</th>
                  <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Hari Inaktif</th>
                  <th className="text-right py-2.5 px-2 text-gray-500 font-medium">Est. Nilai</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const estimatedValue = p.stock * p.price;
                  const lastSaleDate = p.last_sale_date
                    ? new Date(p.last_sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Belum pernah';
                  const daysText = p.days_inactive >= 9999 ? '∞' : `${p.days_inactive} hari`;

                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-2 text-gray-400">{i + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="font-medium">{p.name}</div>
                        {p.category_name && <div className="text-xs text-gray-400">{p.category_name}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{p.stock} pcs</span>
                      </td>
                      <td className="py-2.5 px-2 text-right">{formatCurrency(p.price)}</td>
                      <td className="py-2.5 px-2 text-gray-500 text-xs">{lastSaleDate}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-semibold text-red-600">{daysText}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-orange-600">{formatCurrency(estimatedValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length >= 10 && (
            <button
              onClick={toggleExpand}
              disabled={loading}
              className="mt-4 w-full py-2.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Memuat...' : limit === 10 ? 'Tampilkan 20 Lagi (Total 30)' : 'Tampilkan Lebih Sedikit'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ProfitReport({ data, stockAuditData }) {
  const { products, totals } = data;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Pendapatan" value={formatCurrency(totals.revenue)} color="blue" />
        <StatCard title="Total Modal" value={formatCurrency(totals.cost)} color="orange" />
        <StatCard title="Laba Kotor" value={formatCurrency(totals.profit)} color="green" />
        <StatCard title="Margin" value={`${totals.margin.toFixed(1)}%`} color="purple" />
      </div>

      {/* Profit margin chart */}
      <ProfitMarginChart data={products} />

      {/* Product profit table */}
      <div className="card">
        <h3 className="font-semibold mb-4">Detail Laba per Produk</h3>
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">Produk</th>
                  <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Pendapatan</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Modal</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Laba</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.product_name} className="border-b border-gray-100">
                      <td className="py-2">{p.product_name}</td>
                      <td className="py-2 text-center">{formatNumber(p.qty)}</td>
                      <td className="py-2 text-right">{formatCurrency(p.revenue)}</td>
                      <td className="py-2 text-right">{formatCurrency(p.total_cost)}</td>
                      <td className="py-2 text-right font-medium text-green-600">{formatCurrency(p.profit)}</td>
                      <td className="py-2 text-right">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2">Total</td>
                  <td></td>
                  <td className="py-2 text-right">{formatCurrency(totals.revenue)}</td>
                  <td className="py-2 text-right">{formatCurrency(totals.cost)}</td>
                  <td className="py-2 text-right text-green-600">{formatCurrency(totals.profit)}</td>
                  <td className="py-2 text-right">{totals.margin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Stock audit log */}
      <StockAuditSection data={stockAuditData} />
    </div>
  );
}

function ComparisonReport({ data, labelA, labelB }) {
  const { periodA, periodB, delta } = data;

  const fmtDelta = (v) => {
    const sign = v >= 0 ? '+' : '';
    return sign + v.toFixed(1) + '%';
  };

  const deltaColor = (v) => v >= 0 ? 'text-green-600' : 'text-red-600';
  const deltaArrow = (v) => v >= 0 ? '\u2191' : '\u2193';

  const metrics = [
    { label: 'Pendapatan', a: formatCurrency(periodA.revenue), b: formatCurrency(periodB.revenue), d: delta.revenue },
    { label: 'Jumlah Transaksi', a: formatNumber(periodA.count), b: formatNumber(periodB.count), d: delta.count },
    { label: 'Rata-rata Transaksi', a: formatCurrency(periodA.average), b: formatCurrency(periodB.average), d: delta.average },
  ];

  return (
    <div className="space-y-6">
      {/* Summary comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="card">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{m.label}</div>
            <div className="flex justify-between items-end gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Periode A</div>
                <div className="text-lg font-bold">{m.a}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Periode B</div>
                <div className="text-lg font-bold">{m.b}</div>
              </div>
            </div>
            <div className={`text-sm font-semibold mt-2 ${deltaColor(m.d)}`}>
              {deltaArrow(m.d)} {fmtDelta(m.d)}
            </div>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div className="card">
        <h3 className="font-semibold mb-4">Detail Perbandingan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">Metrik</th>
                <th className="text-right py-2 text-gray-500 font-medium">Periode A<br /><span className="text-xs font-normal">{labelA}</span></th>
                <th className="text-right py-2 text-gray-500 font-medium">Periode B<br /><span className="text-xs font-normal">{labelB}</span></th>
                <th className="text-right py-2 text-gray-500 font-medium">Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.label} className="border-b border-gray-100">
                  <td className="py-3">{m.label}</td>
                  <td className="py-3 text-right font-medium">{m.a}</td>
                  <td className="py-3 text-right font-medium">{m.b}</td>
                  <td className={`py-3 text-right font-semibold ${deltaColor(m.d)}`}>
                    {deltaArrow(m.d)} {fmtDelta(m.d)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
