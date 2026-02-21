import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PrintConfigModal from '../components/PrintConfigModal';
import { buildSalesPlainText, buildProfitPlainText, buildComparisonPlainText, buildComprehensivePlainText } from '../utils/plainTextReport';
import {
    useSalesReport,
    useProfitReport,
    useComparisonReport,
    useComprehensiveReport,
    useStockAuditSummary,
    useStockTrailReport,
    useSettings
} from '@/lib/queries';
import {
    BarChart3,
    TrendingUp,
    ArrowLeftRight,
    FileText,
    Calendar,
    Printer,
    Activity,
    RefreshCw,
    Layout
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Imported Components
import SalesReportTab from '../components/reports/SalesReportTab';
import ProfitReportTab from '../components/reports/ProfitReportTab';
import ComparisonReportTab from '../components/reports/ComparisonReportTab';
import ComprehensiveReportTab from '../components/reports/ComprehensiveReportTab';

const TABS = [
    { id: 'sales', label: 'Ringkasan Penjualan', icon: BarChart3 },
    { id: 'profit', label: 'Laporan Laba', icon: TrendingUp },
    { id: 'comparison', label: 'Perbandingan Periode', icon: ArrowLeftRight },
    { id: 'comprehensive', label: 'Laporan Lengkap', icon: FileText },
];

function getToday() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

export default memo(function ReportsPage() {
    const { hasRole } = useAuth();
    const { FONTS, fontFamily } = useTheme() as any;
    const [activeTab, setActiveTab] = useState('sales');
    const [dateFrom, setDateFrom] = useState(getToday());
    const [dateTo, setDateTo] = useState(getToday());
    const [dateFrom2, setDateFrom2] = useState('');
    const [dateTo2, setDateTo2] = useState('');
    const [storeName, setStoreName] = useState('');
    const [exporting, setExporting] = useState(false);
    const [showPrintConfig, setShowPrintConfig] = useState(false);
    const [includeStockTrail, setIncludeStockTrail] = useState(true);
    const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showStatus = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
        setStatusMsg({ text, type });
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setStatusMsg(null), 4000);
    }, []);

    // Reports Hooks
    const {
        data: salesData,
        isLoading: isLoadingSales,
        refetch: refetchSales
    } = useSalesReport({ date_from: dateFrom, date_to: dateTo });

    const {
        data: profitData,
        isLoading: isLoadingProfit,
        refetch: refetchProfit
    } = useProfitReport({ date_from: dateFrom, date_to: dateTo });

    const {
        data: comparisonData,
        isLoading: isLoadingComparison,
        refetch: refetchComparison
    } = useComparisonReport({
        date_from: dateFrom, date_to: dateTo,
        date_from_2: dateFrom2, date_to_2: dateTo2
    });

    const {
        data: comprehensiveData,
        isLoading: isLoadingComprehensive,
        isError: isErrorComprehensive,
        error: errorComprehensive,
        refetch: refetchComprehensive
    } = useComprehensiveReport({ date_from: dateFrom, date_to: dateTo });

    const { data: settings = {} } = useSettings();

    // Stock audit & trail — fetched independently so all tabs can use them
    const { data: stockAuditData } = useStockAuditSummary({ date_from: dateFrom, date_to: dateTo });
    const { data: stockTrailDetailData } = useStockTrailReport({ date_from: dateFrom, date_to: dateTo });

    // Derived states
    const loading = isLoadingSales || isLoadingProfit || isLoadingComparison || isLoadingComprehensive;
    const hourlyData = salesData?.hourlyBreakdown;
    const transactionsData =
        salesData?.transactionLog ??
        profitData?.transactionLog ??
        comprehensiveData?.transactionLog ??
        null;

    useEffect(() => {
        setStoreName(settings.store_name || '');
    }, [settings]);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentToday = getToday();
            // Auto update dates if they were set to "yesterday" via default logic (simplified here)
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFilter = () => {
        if (activeTab === 'sales') refetchSales();
        else if (activeTab === 'profit') refetchProfit();
        else if (activeTab === 'comparison') {
            if (!dateFrom2 || !dateTo2) {
                showStatus('Silakan isi tanggal Periode B', 'error');
                return;
            }
            refetchComparison();
        }
        else if (activeTab === 'comprehensive') refetchComprehensive();
    };

    const exportPdf = async () => {
        setExporting(true);
        try {
            const html = buildExportHTML();
            if (!html) {
                showStatus('Tampilkan laporan terlebih dahulu', 'error');
                setExporting(false);
                return false;
            }
            const result = await window.api.exportReportPdf(html);
            if (result.success) {
                showStatus('PDF berhasil disimpan di: ' + result.path, 'success');
                setExporting(false);
                return true;
            } else if (result.error !== 'Cancelled') {
                showStatus('Gagal export PDF: ' + result.error, 'error');
            }
        } catch (err: any) {
            showStatus('Gagal export PDF: ' + err.message, 'error');
        }
        setExporting(false);
        return false;
    };

    const handleSaveText = async () => {
        const text = buildPlainTextReport();
        if (!text) { showStatus('Tampilkan laporan terlebih dahulu', 'error'); return; }
        try {
            const result = await window.api.printPlainText(text, { action: 'save' });
            if (result.success) showStatus('File berhasil disimpan di: ' + result.path, 'success');
            else if (result.error !== 'Cancelled') showStatus('Gagal menyimpan: ' + result.error, 'error');
        } catch (err: any) { showStatus('Gagal menyimpan: ' + err.message, 'error'); }
    };

    const handlePrintText = async (printer: any) => {
        const text = buildPlainTextReport();
        if (!text) { showStatus('Tampilkan laporan terlebih dahulu', 'error'); return; }
        try {
            const result = await window.api.printPlainText(text, { action: 'print', printer });
            if (!result.success) showStatus('Gagal mencetak: ' + result.error, 'error');
        } catch (err: any) { showStatus('Gagal mencetak: ' + err.message, 'error'); }
    };

    const buildPlainTextReport = useCallback(() => {
        const trailData = includeStockTrail ? stockTrailDetailData : null;

        if (activeTab === 'sales' && salesData) return buildSalesPlainText(salesData, hourlyData, dateFrom, dateTo, stockAuditData, trailData);
        if (activeTab === 'profit' && profitData) return buildProfitPlainText(profitData, dateFrom, dateTo, stockAuditData, trailData);
        if (activeTab === 'comparison' && comparisonData) return buildComparisonPlainText(comparisonData, dateFrom, dateTo, dateFrom2, dateTo2, stockAuditData, trailData);
        if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensivePlainText(comprehensiveData, dateFrom, dateTo, stockAuditData, trailData);
        return null;
    }, [activeTab, salesData, profitData, comparisonData, comprehensiveData, hourlyData, stockAuditData, stockTrailDetailData, dateFrom, dateTo, dateFrom2, dateTo2, includeStockTrail]);

    const buildExportHTML = useCallback(() => {
        if (activeTab === 'sales' && salesData) return buildSalesHTML();
        if (activeTab === 'profit' && profitData) return buildProfitHTML();
        if (activeTab === 'comparison' && comparisonData) return buildComparisonHTML();
        if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensiveHTML();
        return null;
    }, [activeTab, salesData, profitData, comparisonData, comprehensiveData, stockTrailDetailData, stockAuditData, includeStockTrail]);

    const wrapReport = (title: string, dateRange: string, body: string) => {
        const now = new Date().toLocaleString('id-ID');
        const activeFont = (FONTS[fontFamily]?.value) || "'Segoe UI', Arial, sans-serif";
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 25mm; }
    body{font-family:${activeFont};font-size:11px;line-height:1.4;color:#1a1a1a;padding:20mm}
    .report-header{text-align:center;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #333}
    .summary-cards{display:flex;gap:10px;margin:12px 0;flex-wrap:wrap}
    .summary-card{flex:1;min-width:120px;border:1px solid #ddd;border-radius:5px;padding:10px;text-align:center}
    table{width:100%;border-collapse:collapse;margin:15px 0;page-break-inside:auto}
    table tr{page-break-inside:avoid;page-break-after:auto}
    table th,table td{padding:8px 8px;text-align:left;border-bottom:1px solid #eee}
    table th{background-color:#f8f9fa;font-weight:bold;text-transform:uppercase;font-size:10px;color:#666}
    .report-footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:9px;color:#999}
    h3{margin-top:25px;border-left:4px solid #333;padding-left:10px;font-size:14px}
    </style></head><body><div class="report-header">${storeName ? `<div>${storeName}</div>` : ''}<h1>${title}</h1><h2>${dateRange}</h2></div>${body}<div class="report-footer">Dicetak pada ${now}</div></body></html>`;
    };

    const buildSalesHTML = () => {
        if (!salesData) return null;

        const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
        const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);
        const methodLabel = (m: string) => ({ cash: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer' }[m] || m || '-');

        const txLog: any[] = salesData.transactionLog || [];

        const body = `
            <div class="summary-cards">
                <div class="summary-card"><div style="font-weight:bold;color:#666">PENDAPATAN</div><div style="font-size:18px;font-weight:900">${formatCurrency(salesData.summary.revenue)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">TRANSAKSI</div><div style="font-size:18px;font-weight:900">${formatNumber(salesData.summary.count)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">RATA-RATA</div><div style="font-size:18px;font-weight:900">${formatCurrency(salesData.summary.average)}</div></div>
            </div>

            <h3>Metode Pembayaran</h3>
            <table>
                <thead><tr><th>Metode</th><th style="text-align:center">Jumlah</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>
                    ${(salesData.paymentBreakdown || []).map((p: any) => `
                        <tr>
                            <td>${methodLabel(p.payment_method)}</td>
                            <td style="text-align:center">${formatNumber(p.count || 0)}</td>
                            <td style="text-align:right">${formatCurrency(p.total || 0)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>

            <h3>Top 10 Produk Terlaris</h3>
            <table>
                <thead><tr><th style="text-align:center;width:32px">#</th><th>Produk</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>
                    ${(salesData.topProducts || []).slice(0, 10).map((p: any, i: number) => `
                        <tr>
                            <td style="text-align:center;color:#888">${i + 1}</td>
                            <td>${p.product_name || 'Tanpa Nama'}</td>
                            <td style="text-align:center">${formatNumber(p.qty || 0)}</td>
                            <td style="text-align:right">${formatCurrency(p.total || 0)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>

            <h3>Log Transaksi${txLog.length > 0 ? ` (${txLog.length} transaksi)` : ''}</h3>
            ${txLog.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th style="width:60px">Waktu</th>
                            <th style="width:110px">Invoice</th>
                            <th style="width:55px">Metode</th>
                            <th>Item</th>
                            <th style="text-align:right;width:90px">Total</th>
                            <th style="width:70px">Kasir</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txLog.map((t: any) => {
                            const waktu = t.created_at
                                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : '-';
                            const itemList = (t.items || []).slice(0, 3).map((i: any) => `${i.product_name} (${i.quantity})`).join(', ');
                            const itemText = (t.items || []).length > 3 ? itemList + ` +${t.items.length - 3} lainnya` : (itemList || '-');
                            return `<tr>
                                <td style="font-size:9px;color:#666;white-space:nowrap">${waktu}</td>
                                <td style="font-size:9px;font-weight:bold">${t.invoice_number || '-'}</td>
                                <td style="font-size:9px">${methodLabel(t.payment_method)}</td>
                                <td style="font-size:9px;color:#555">${itemText}</td>
                                <td style="text-align:right;font-weight:bold;white-space:nowrap">${formatCurrency(t.total || 0)}</td>
                                <td style="font-size:9px;color:#666">${t.cashier_name || '-'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                ${txLog.length >= 300 ? `<p style="font-size:9px;color:#999;margin-top:4px">* Ditampilkan 300 transaksi terbaru. Untuk ekspor lengkap gunakan tab Laporan Lengkap.</p>` : ''}
            ` : '<p style="color:#999;font-size:10px">Tidak ada data transaksi untuk periode ini.</p>'}

            ${(includeStockTrail && stockTrailDetailData && stockTrailDetailData.length > 0) ? `
                <h3>Log Mutasi Stok — Restok & Penyesuaian (${Math.min(stockTrailDetailData.length, 50)} dari ${stockTrailDetailData.length} entri)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Produk</th>
                            <th style="text-align:center">Event</th>
                            <th style="text-align:right">Alur Stok</th>
                            <th style="text-align:right">Perubahan</th>
                            <th>Oleh</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockTrailDetailData.slice(0, 50).map((t: any) => {
                            const waktu = t.created_at
                                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : '-';
                            const changeColor = t.quantity_change > 0 ? 'color:green' : 'color:red';
                            const changeSign = t.quantity_change > 0 ? '+' : '';
                            return `<tr>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td>${t.product_name || '-'}</td>
                                <td style="text-align:center;font-size:9px;text-transform:uppercase">${t.event_type || '-'}</td>
                                <td style="text-align:right;font-size:9px;color:#888">${t.quantity_before} → ${t.quantity_after}</td>
                                <td style="text-align:right;font-weight:bold;${changeColor}">${changeSign}${t.quantity_change}</td>
                                <td style="font-size:9px;color:#666">${t.user_name || '-'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                ${stockTrailDetailData.length > 50 ? `<p style="font-size:9px;color:#999;margin-top:4px">* ${stockTrailDetailData.length - 50} entri lainnya tidak ditampilkan. Gunakan halaman Mutasi Stok untuk laporan lengkap.</p>` : ''}
            ` : ''}
        `;
        return wrapReport('Ringkasan Penjualan', `${dateFrom} s/d ${dateTo}`, body);
    };

    const buildProfitHTML = () => {
        if (!profitData) return null;
        const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
        const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

        const body = `
            <div class="summary-cards">
                <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL LABA</div><div style="font-size:18px;font-weight:900;color:green">${formatCurrency(profitData.totals.profit)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">PENDAPATAN</div><div style="font-size:18px;font-weight:900">${formatCurrency(profitData.totals.revenue)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL MODAL</div><div style="font-size:18px;font-weight:900">${formatCurrency(profitData.totals.cost)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">MARGIN</div><div style="font-size:18px;font-weight:900">${profitData.totals.margin.toFixed(1)}%</div></div>
            </div>
                    ${(profitData.transactionLog && profitData.transactionLog.length > 0) ? `
                <h3>Log Transaksi Aktual (${profitData.transactionLog.length} transaksi)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Waktu</th>
                            <th>Metode</th>
                            <th>Item</th>
                            <th style="text-align:right">Total</th>
                            <th>Kasir</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profitData.transactionLog.map((t: any) => {
            const waktu = t.created_at
                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-';
            const items = (t.items || []).slice(0, 3).map((i: any) => `${i.product_name} (${i.quantity})`).join(', ');
            const itemText = (t.items || []).length > 3 ? items + ` +${t.items.length - 3} lainnya` : items;
            return `<tr>
                                <td style="font-size:9px;font-weight:bold">${t.invoice_number || '-'}</td>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td style="font-size:9px">${t.payment_method === 'cash' ? 'Tunai' : (t.payment_method || '-')}</td>
                                <td style="font-size:9px;color:#555">${itemText || '-'}</td>
                                <td style="text-align:right;font-weight:bold">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.total || 0)}</td>
                                <td style="font-size:9px;color:#666">${t.cashier_name || '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#999;font-size:10px">Tidak ada data transaksi untuk periode ini.</p>'}
            ${(includeStockTrail && stockTrailDetailData && stockTrailDetailData.length > 0) ? `
                <h3>Log Mutasi Stok — Restok & Penyesuaian (${Math.min(stockTrailDetailData.length, 50)} dari ${stockTrailDetailData.length} entri)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Produk</th>
                            <th style="text-align:center">Event</th>
                            <th style="text-align:right">Alur Stok</th>
                            <th style="text-align:right">Perubahan</th>
                            <th>Oleh</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockTrailDetailData.slice(0, 50).map((t: any) => {
            const waktu = t.created_at
                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-';
            const changeColor = t.quantity_change > 0 ? 'color:green' : 'color:red';
            const changeSign = t.quantity_change > 0 ? '+' : '';
            return `<tr>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td>${t.product_name || '-'}</td>
                                <td style="text-align:center;font-size:9px;text-transform:uppercase">${t.event_type || '-'}</td>
                                <td style="text-align:right;font-size:9px;color:#888">${t.quantity_before} → ${t.quantity_after}</td>
                                <td style="text-align:right;font-weight:bold;${changeColor}">${changeSign}${t.quantity_change}</td>
                                <td style="font-size:9px;color:#666">${t.user_name || '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
                ${stockTrailDetailData.length > 50 ? `<p style="font-size:9px;color:#999;margin-top:4px">* ${stockTrailDetailData.length - 50} entri lainnya tidak ditampilkan. Gunakan halaman Mutasi Stok untuk laporan lengkap.</p>` : ''}
            ` : ''}
        `;
        return wrapReport('Laporan Laba', `${dateFrom} s/d ${dateTo}`, body);
    };

    const buildComparisonHTML = () => {
        if (!comparisonData) return null;
        const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
        const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

        const body = `
            <h3>Komparasi Periode</h3>
            <table>
                <thead>
                    <tr>
                        <th>Metrik</th>
                        <th style="text-align:right">Periode A (${dateFrom} s/d ${dateTo})</th>
                        <th style="text-align:right">Periode B (${dateFrom2} s/d ${dateTo2})</th>
                        <th style="text-align:center">Perubahan</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pendapatan</td>
                        <td style="text-align:right">${formatCurrency(comparisonData.periodA.revenue)}</td>
                        <td style="text-align:right">${formatCurrency(comparisonData.periodB.revenue)}</td>
                        <td style="text-align:center;font-weight:bold;color:${comparisonData.delta.revenue >= 0 ? 'green' : 'red'}">
                            ${comparisonData.delta.revenue >= 0 ? '+' : ''}${comparisonData.delta.revenue.toFixed(1)}%
                        </td>
                    </tr>
                    <tr>
                        <td>Jumlah Transaksi</td>
                        <td style="text-align:right">${formatNumber(comparisonData.periodA.count)}</td>
                        <td style="text-align:right">${formatNumber(comparisonData.periodB.count)}</td>
                        <td style="text-align:center;font-weight:bold;color:${comparisonData.delta.count >= 0 ? 'green' : 'red'}">
                            ${comparisonData.delta.count >= 0 ? '+' : ''}${comparisonData.delta.count.toFixed(1)}%
                        </td>
                    </tr>
                    <tr>
                        <td>Rata-rata Transaksi</td>
                        <td style="text-align:right">${formatCurrency(comparisonData.periodA.average)}</td>
                        <td style="text-align:right">${formatCurrency(comparisonData.periodB.average)}</td>
                        <td style="text-align:center;font-weight:bold;color:${comparisonData.delta.average >= 0 ? 'green' : 'red'}">
                            ${comparisonData.delta.average >= 0 ? '+' : ''}${comparisonData.delta.average.toFixed(1)}%
                        </td>
                    </tr>
                </tbody>
            </table>
            ${(includeStockTrail && stockTrailDetailData && stockTrailDetailData.length > 0) ? `
                <h3>Log Mutasi Stok — Restok & Penyesuaian (${Math.min(stockTrailDetailData.length, 50)} dari ${stockTrailDetailData.length} entri)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Produk</th>
                            <th style="text-align:center">Event</th>
                            <th style="text-align:right">Alur Stok</th>
                            <th style="text-align:right">Perubahan</th>
                            <th>Oleh</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockTrailDetailData.slice(0, 50).map((t: any) => {
            const waktu = t.created_at
                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-';
            const changeColor = t.quantity_change > 0 ? 'color:green' : 'color:red';
            const changeSign = t.quantity_change > 0 ? '+' : '';
            return `<tr>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td>${t.product_name || '-'}</td>
                                <td style="text-align:center;font-size:9px;text-transform:uppercase">${t.event_type || '-'}</td>
                                <td style="text-align:right;font-size:9px;color:#888">${t.quantity_before} → ${t.quantity_after}</td>
                                <td style="text-align:right;font-weight:bold;${changeColor}">${changeSign}${t.quantity_change}</td>
                                <td style="font-size:9px;color:#666">${t.user_name || '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
                ${stockTrailDetailData.length > 50 ? `<p style="font-size:9px;color:#999;margin-top:4px">* ${stockTrailDetailData.length - 50} entri lainnya tidak ditampilkan. Gunakan halaman Mutasi Stok untuk laporan lengkap.</p>` : ''}
            ` : ''}
        `;
        return wrapReport('Perbandingan Periode', 'Analisis Komparasi', body);
    };

    const buildComprehensiveHTML = () => {
        if (!comprehensiveData) return null;
        const { sales, profit, hourly, transactionLog } = comprehensiveData;
        const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
        const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

        const body = `
            <h3>Ringkasan Eksekutif</h3>
            <div class="summary-cards">
                <div class="summary-card"><div>PENDAPATAN</div><div style="font-weight:900">${formatCurrency(sales.summary.revenue)}</div></div>
                <div class="summary-card"><div>TRANSAKSI</div><div style="font-weight:900">${formatNumber(sales.summary.count)}</div></div>
                <div class="summary-card"><div>RATA-RATA</div><div style="font-weight:900">${formatCurrency(sales.summary.average)}</div></div>
                <div class="summary-card"><div>LABA KOTOR</div><div style="font-weight:900;color:green">${formatCurrency(profit.totals.profit)}</div></div>
                <div class="summary-card"><div>MARGIN</div><div style="font-weight:900;color:blue">${profit.totals.margin.toFixed(1)}%</div></div>
                <div class="summary-card"><div>TOTAL MODAL</div><div style="font-weight:900">${formatCurrency(profit.totals.cost)}</div></div>
            </div>
            
            <h3>Metode Pembayaran</h3>
            <table>
                 <thead><tr><th>Metode</th><th style="text-align:center">Jumlah</th><th style="text-align:right">Total</th></tr></thead>
                 <tbody>
                    ${(sales.paymentBreakdown || []).map((p: any) => `
                        <tr>
                            <td>${p.payment_method === 'cash' ? 'Tunai' : (p.payment_method || 'Unknown')}</td>
                            <td style="text-align:center">${p.count || 0}</td>
                            <td style="text-align:right">${formatCurrency(p.total || 0)}</td>
                        </tr>
                    `).join('')}
                 </tbody>
            </table>

            <h3>Top 5 Produk Terlaris</h3>
            <table>
                <thead><tr><th>Ranking</th><th>Produk</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>
                    ${(sales.topProducts || []).slice(0, 5).map((p: any, i: number) => `
                        <tr>
                            <td style="text-align:center;width:40px">#${i + 1}</td>
                            <td>${p.product_name}</td>
                            <td style="text-align:center">${formatNumber(p.qty)}</td>
                            <td style="text-align:right">${formatCurrency(p.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>Pola Penjualan Per Jam</h3>
            <table>
                <thead><tr><th>Jam</th><th style="text-align:center">Transaksi</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>
                    ${(hourly || []).filter((h: any) => h.count > 0).map((h: any) => `
                        <tr>
                            <td>${String(h.hour).padStart(2, '0')}:00 - ${String(h.hour + 1).padStart(2, '0')}:00</td>
                            <td style="text-align:center">${h.count}</td>
                            <td style="text-align:right">${formatCurrency(h.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${(transactionLog && transactionLog.length > 0) ? `
                <h3>Log Transaksi Aktual (${transactionLog.length} transaksi)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Waktu</th>
                            <th>Metode</th>
                            <th>Item</th>
                            <th style="text-align:right">Total</th>
                            <th>Kasir</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactionLog.map((t: any) => {
            const waktu = t.created_at
                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-';
            const items = (t.items || []).slice(0, 3).map((i: any) => `${i.product_name} (${i.quantity})`).join(', ');
            const itemText = (t.items || []).length > 3 ? items + ` +${t.items.length - 3} lainnya` : items;
            return `<tr>
                                <td style="font-size:9px;font-weight:bold">${t.invoice_number || '-'}</td>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td style="font-size:9px">${t.payment_method === 'cash' ? 'Tunai' : (t.payment_method || '-')}</td>
                                <td style="font-size:9px;color:#555">${itemText || '-'}</td>
                                <td style="text-align:right;font-weight:bold">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.total || 0)}</td>
                                <td style="font-size:9px;color:#666">${t.cashier_name || '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#999;font-size:10px">Tidak ada data transaksi untuk periode ini.</p>'}
            ${(includeStockTrail && stockTrailDetailData && stockTrailDetailData.length > 0) ? `
                <h3>Log Mutasi Stok — Restok & Penyesuaian (${Math.min(stockTrailDetailData.length, 50)} dari ${stockTrailDetailData.length} entri)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Produk</th>
                            <th style="text-align:center">Event</th>
                            <th style="text-align:right">Alur Stok</th>
                            <th style="text-align:right">Perubahan</th>
                            <th>Oleh</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockTrailDetailData.slice(0, 50).map((t: any) => {
            const waktu = t.created_at
                ? new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-';
            const changeColor = t.quantity_change > 0 ? 'color:green' : 'color:red';
            const changeSign = t.quantity_change > 0 ? '+' : '';
            return `<tr>
                                <td style="font-size:9px;color:#666">${waktu}</td>
                                <td>${t.product_name || '-'}</td>
                                <td style="text-align:center;font-size:9px;text-transform:uppercase">${t.event_type || '-'}</td>
                                <td style="text-align:right;font-size:9px;color:#888">${t.quantity_before} → ${t.quantity_after}</td>
                                <td style="text-align:right;font-weight:bold;${changeColor}">${changeSign}${t.quantity_change}</td>
                                <td style="font-size:9px;color:#666">${t.user_name || '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
                ${stockTrailDetailData.length > 50 ? `<p style="font-size:9px;color:#999;margin-top:4px">* ${stockTrailDetailData.length - 50} entri lainnya tidak ditampilkan. Gunakan halaman Mutasi Stok untuk laporan lengkap.</p>` : ''}
            ` : ''}
        `;
        return wrapReport('Laporan Lengkap', `${dateFrom} s/d ${dateTo}`, body);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Laporan</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Analisis performa bisnis dan inventaris</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPrintConfig(true)} disabled={exporting || loading} className="gap-2 h-11 px-6 shadow-sm font-bold dark:border-gray-700 dark:text-gray-200">
                        <Printer className="w-5 h-5" /> Cetak / Export
                    </Button>
                    <Button onClick={handleFilter} disabled={loading} className="gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 font-bold">
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                        {loading ? 'Memuat...' : 'Refresh Data'}
                    </Button>
                </div>
            </div>

            {/* Inline status message (replaces alert()) */}
            {statusMsg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border ${
                    statusMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : statusMsg.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                }`}>
                    <span className="flex-1">{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
                </div>
            )}

            <Card className="border-none shadow-sm dark:bg-gray-900">
                <CardContent className="p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                            {TABS.filter(tab => hasRole('admin', 'supervisor') || !['profit', 'comprehensive'].includes(tab.id)).map(tab => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="rounded-lg font-bold text-xs gap-1.5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-gray-400 dark:data-[state=active]:shadow-emerald-900/40"
                                >
                                    <tab.icon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm dark:bg-gray-900">
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-end gap-6">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {activeTab === 'comparison' ? 'Periode A - Dari' : 'Dari Tanggal'}
                            </label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 border-gray-200 shadow-inner font-bold" />
                            </div>
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                {activeTab === 'comparison' ? 'Periode A - Sampai' : 'Sampai Tanggal'}
                            </label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 border-gray-200 shadow-inner font-bold" />
                            </div>
                        </div>

                        {activeTab === 'comparison' && (
                            <>
                                <Separator orientation="vertical" className="h-11 hidden lg:block dark:bg-gray-700" />
                                <div className="space-y-1.5 flex-1 min-w-[200px]">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Periode B - Dari</label>
                                    <Input type="date" value={dateFrom2} onChange={e => setDateFrom2(e.target.value)} className="h-11 bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 border-gray-200 shadow-inner font-bold" />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-[200px]">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Periode B - Sampai</label>
                                    <Input type="date" value={dateTo2} onChange={e => setDateTo2(e.target.value)} className="h-11 bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 border-gray-200 shadow-inner font-bold" />
                                </div>
                            </>
                        )}

                        <Button onClick={handleFilter} disabled={loading} size="lg" className="h-11 px-8 font-black bg-gray-900 hover:bg-black dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg gap-2">
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                            {loading ? 'Memuat...' : 'Proses Laporan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6 animate-in fade-in duration-500">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-bold">Menyusun data laporan...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'sales' && salesData && (
                            <SalesReportTab
                                data={salesData}
                                hourlyData={hourlyData}
                                stockAuditData={stockAuditData}
                                transactionsData={transactionsData}
                                stockTrailData={stockTrailDetailData}
                            />
                        )}
                        {activeTab === 'profit' && profitData && (
                            <ProfitReportTab
                                data={profitData}
                                stockAuditData={stockAuditData}
                                stockTrailData={stockTrailDetailData}
                                transactionsData={transactionsData}
                            />
                        )}
                        {activeTab === 'comparison' && comparisonData && (
                            <ComparisonReportTab
                                data={comparisonData}
                                labelA={`${dateFrom} - ${dateTo}`}
                                labelB={`${dateFrom2} - ${dateTo2}`}
                                stockAuditData={stockAuditData}
                                stockTrailData={stockTrailDetailData}
                            />
                        )}
                        {activeTab === 'comprehensive' && (
                            <ComprehensiveReportTab
                                data={comprehensiveData}
                                isLoading={isLoadingComprehensive}
                                isError={isErrorComprehensive}
                                error={errorComprehensive}
                                refetch={refetchComprehensive}
                                stockAuditData={stockAuditData}
                                stockTrailData={stockTrailDetailData}
                            />
                        )}

                        {!salesData && !profitData && !comparisonData && !comprehensiveData && (
                            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30">
                                <Layout className="w-20 h-20 text-gray-300" />
                                <div>
                                    <p className="text-xl font-bold text-gray-900">Belum Ada Data</p>
                                    <p className="text-sm font-medium">Atur periode tanggal dan klik "Proses Laporan"</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showPrintConfig && (
                <PrintConfigModal
                    onClose={() => setShowPrintConfig(false)}
                    onExportPdf={exportPdf}
                    onPrintText={handlePrintText}
                    onSaveText={handleSaveText}
                    getReportHtml={buildExportHTML}
                    getReportText={buildPlainTextReport}
                    includeStockTrail={includeStockTrail}
                    onToggleStockTrail={setIncludeStockTrail}
                />
            )}
        </div>
    );
});
