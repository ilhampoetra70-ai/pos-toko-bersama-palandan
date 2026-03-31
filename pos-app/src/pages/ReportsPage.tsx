import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PrintConfigModal from '../components/PrintConfigModal';
import { buildSalesPlainText, buildProfitPlainText, buildComparisonPlainText, buildComprehensivePlainText } from '../utils/plainTextReport';
import { getToday, formatCurrencyFull as formatCurrency, formatNumber } from '../utils/format';
import {
    useSalesReport,
    useProfitReport,
    useComparisonReport,
    useComprehensiveReport,
    useStockAuditSummary,
    useStockTrailReport,
    useSettings
} from '@/lib/queries';
import { ArrowLeftRight, Calendar, Activity, Layout } from 'lucide-react';
import { RetroChart, RetroMoney, RetroReceipt, RetroPrinter, RetroRefresh } from '../components/RetroIcons';
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
    { id: 'sales', label: 'Ringkasan Penjualan', icon: RetroChart },
    { id: 'profit', label: 'Laporan Laba', icon: RetroMoney },
    { id: 'comparison', label: 'Perbandingan Periode', icon: ArrowLeftRight },
    { id: 'comprehensive', label: 'Laporan Lengkap', icon: RetroReceipt },
];

function getTodayWithSettings(settings: any): string {
    const d = new Date();
    const configuredOffset = settings?.timezone_offset;
    let offsetHours: number;
    if (configuredOffset && configuredOffset !== 'auto') {
        offsetHours = parseFloat(configuredOffset);
    } else {
        offsetHours = -(d.getTimezoneOffset() / 60);
    }
    const localMs = d.getTime() + (offsetHours * 3600000);
    return new Date(localMs).toISOString().slice(0, 10);
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
    const [aiInsightCache, setAiInsightCache] = useState<any>(null);
    const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
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
        isError: isErrorSales,
        refetch: refetchSales
    } = useSalesReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);

    const {
        data: profitData,
        isLoading: isLoadingProfit,
        isError: isErrorProfit,
        refetch: refetchProfit
    } = useProfitReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);

    const {
        data: comparisonData,
        isLoading: isLoadingComparison,
        isError: isErrorComparison,
        refetch: refetchComparison
    } = useComparisonReport({
        date_from: dateFrom, date_to: dateTo,
        date_from_2: dateFrom2, date_to_2: dateTo2
    }, hasFetched);

    const {
        data: comprehensiveData,
        isLoading: isLoadingComprehensive,
        isError: isErrorComprehensive,
        error: errorComprehensive,
        refetch: refetchComprehensive
    } = useComprehensiveReport({ date_from: dateFrom, date_to: dateTo }, hasFetched);

    const { data: settings = {} } = useSettings();

    // Stock audit & trail — fetched independently so all tabs can use them
    const { data: stockAuditData } = useStockAuditSummary({ date_from: dateFrom, date_to: dateTo });
    const { data: stockTrailDetailData } = useStockTrailReport({ date_from: dateFrom, date_to: dateTo });

    // Derived states
    const loading = (
        (activeTab === 'sales' && isLoadingSales) ||
        (activeTab === 'profit' && isLoadingProfit) ||
        (activeTab === 'comparison' && isLoadingComparison) ||
        (activeTab === 'comprehensive' && isLoadingComprehensive)
    ) && hasFetched;
    const hasError = (
        (activeTab === 'sales' && isErrorSales) ||
        (activeTab === 'profit' && isErrorProfit) ||
        (activeTab === 'comparison' && isErrorComparison) ||
        (activeTab === 'comprehensive' && isErrorComprehensive)
    ) && hasFetched;
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
        if (settings && Object.keys(settings).length > 0) {
            const today = getTodayWithSettings(settings);
            setDateFrom(today);
            setDateTo(today);
        }
    }, [settings]);

    // Fetch the most recently generated AI insight (any time range) for print reports
    useEffect(() => {
        window.api.getAiInsightCache().then((r: any) => {
            if (!r.success || !r.data) return;
            const d = { ...r.data };
            // Normalize semua format lama ke paragraphs[]
            if (!d.paragraphs && d.summary) {
                const parts = [d.summary];
                if (d.stock_recommendations?.length) parts.push(d.stock_recommendations.join('. '));
                if (d.slow_moving_recommendations?.length) parts.push(d.slow_moving_recommendations.join('. '));
                if (d.operational_recommendations?.length) parts.push(d.operational_recommendations.join('. '));
                d.paragraphs = parts;
                d.highlights = d.top_priorities || [];
            }
            if (!d.paragraphs && d.narrative) {
                d.paragraphs = d.narrative.split(/\n+/).filter((p: string) => p.trim());
            }
            if (d.paragraphs?.length) {
                setAiInsightCache({ ...d, created_at: r.created_at });
            }
        }).catch(() => { /* ignore */ });
    }, []);



    const handleFilter = () => {
        if (activeTab === 'comparison' && (!dateFrom2 || !dateTo2)) {
            showStatus('Silakan isi tanggal Periode B', 'error');
            return;
        }
        if (!hasFetched) {
            setHasFetched(true);
            return;
        }
        if (activeTab === 'sales') refetchSales();
        else if (activeTab === 'profit') refetchProfit();
        else if (activeTab === 'comparison') refetchComparison();
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
        if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensivePlainText(comprehensiveData, dateFrom, dateTo, stockAuditData, trailData, aiInsightCache);
        return null;
    }, [activeTab, salesData, profitData, comparisonData, comprehensiveData, hourlyData, stockAuditData, stockTrailDetailData, dateFrom, dateTo, dateFrom2, dateTo2, includeStockTrail, aiInsightCache]);

    const buildExportHTML = useCallback(() => {
        if (activeTab === 'sales' && salesData) return buildSalesHTML();
        if (activeTab === 'profit' && profitData) return buildProfitHTML();
        if (activeTab === 'comparison' && comparisonData) return buildComparisonHTML();
        if (activeTab === 'comprehensive' && comprehensiveData) return buildComprehensiveHTML();
        return null;
    }, [activeTab, salesData, profitData, comparisonData, comprehensiveData, stockTrailDetailData, stockAuditData, includeStockTrail, aiInsightCache]);

    const wrapReport = (title: string, dateRange: string, body: string) => {
        const now = new Date().toLocaleString('id-ID');
        const activeFont = (FONTS[fontFamily]?.value) || "'Segoe UI', Arial, sans-serif";
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><style>
    :root{color-scheme:light}
    html{background-color:#ffffff}
    @page { size: A4; margin: 25mm; }
    body{font-family:${activeFont};font-size:11px;line-height:1.4;color:#1a1a1a;background-color:#ffffff;padding:20mm}
    .report-header{text-align:center;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #333}
    .summary-cards{display:flex;gap:10px;margin:12px 0;flex-wrap:wrap}
    .summary-card{flex:1;min-width:120px;border:1px solid #ddd;border-radius:5px;padding:10px;text-align:center}
    table{width:100%;border-collapse:collapse;margin:15px 0;page-break-inside:auto}
    table tr{page-break-inside:avoid;page-break-after:auto}
    table th,table td{padding:8px 8px;text-align:left;border-bottom:1px solid #eee}
    table th{background-color:#f8f9fa;font-weight:bold;text-transform:uppercase;font-size:10px;color:#666}
    .report-footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:9px;color:#999}
    h3{margin-top:25px;border-left:4px solid #333;padding-left:10px;font-size:14px}
    </style></head><body><div class="report-header">${storeName ? `<div style="font-size:24px;font-weight:900;text-transform:uppercase;margin-bottom:4px">${storeName}</div>` : ''}<h1>${title}</h1><h2>${dateRange}</h2></div>${body}<div class="report-footer">Dicetak pada ${now}</div></body></html>`;
    };

    const buildSalesHTML = () => {
        if (!salesData) return null;

        const methodLabel = (m: string) => ({ cash: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer' }[m] || m || '-');

        const txLog: any[] = salesData.transactionLog || [];

        // Customer rankings derived from transaction log
        const customerByName: { name: string; count: number; total: number }[] = Object.values(
            txLog.reduce((acc: any, tx: any) => {
                const key = (tx.customer_name || '').trim();
                if (!key) return acc;
                if (!acc[key]) acc[key] = { name: key, count: 0, total: 0 };
                acc[key].count++;
                acc[key].total += tx.total || 0;
                return acc;
            }, {})
        ).sort((a: any, b: any) => b.total - a.total).slice(0, 15) as any;

        const customerByAddress: { address: string; count: number; total: number }[] = Object.values(
            txLog.reduce((acc: any, tx: any) => {
                const key = (tx.customer_address || '').trim();
                if (!key) return acc;
                if (!acc[key]) acc[key] = { address: key, count: 0, total: 0 };
                acc[key].count++;
                acc[key].total += tx.total || 0;
                return acc;
            }, {})
        ).sort((a: any, b: any) => b.total - a.total).slice(0, 15) as any;

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

            ${customerByName.length > 0 || customerByAddress.length > 0 ? `
            <h3>Pemeringkatan Pelanggan</h3>
            <table style="width:100%">
                <thead>
                    <tr>
                        <th colspan="4" style="text-align:center;background:#f0f4ff;border-right:1px solid #ddd;width:50%">Berdasarkan Nama Pembeli</th>
                        <th colspan="4" style="text-align:center;background:#f0fff4;width:50%">Berdasarkan Alamat Pembeli</th>
                    </tr>
                    <tr>
                        <th style="width:20px;padding:4px">#</th>
                        <th style="padding:4px">Nama</th>
                        <th style="text-align:center;width:25px;padding:4px">Tx</th>
                        <th style="text-align:right;border-right:1px solid #ddd;padding:4px;width:75px">Total Belanja</th>
                        <th style="width:20px;padding:4px;padding-left:8px">#</th>
                        <th style="padding:4px">Alamat</th>
                        <th style="text-align:center;width:25px;padding:4px">Tx</th>
                        <th style="text-align:right;padding:4px;width:75px">Total Belanja</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from({ length: Math.max(customerByName.length, customerByAddress.length, 1) }).map((_, i) => {
            const nameC = customerByName[i];
            const addrC = customerByAddress[i];

            const nameTds = nameC
                ? `<td style="color:#888;padding:4px">${i + 1}</td>
                   <td style="font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px;padding:4px">${nameC.name}</td>
                   <td style="text-align:center;padding:4px">${nameC.count}x</td>
                   <td style="text-align:right;font-weight:bold;border-right:1px solid #ddd;padding:4px;white-space:nowrap">${formatCurrency(nameC.total)}</td>`
                : `<td style="color:#888;padding:4px">-</td><td colspan="3" style="text-align:center;color:#999;border-right:1px solid #ddd">-</td>`;

            const addrTds = addrC
                ? `<td style="color:#888;padding:4px;padding-left:8px">${i + 1}</td>
                   <td style="font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px;padding:4px">${addrC.address}</td>
                   <td style="text-align:center;padding:4px">${addrC.count}x</td>
                   <td style="text-align:right;font-weight:bold;padding:4px;white-space:nowrap">${formatCurrency(addrC.total)}</td>`
                : `<td style="color:#888;padding:4px;padding-left:8px">-</td><td colspan="3" style="text-align:center;color:#999">-</td>`;

            return `<tr>${nameTds}${addrTds}</tr>`;
        }).join('')}
    </tbody>
</table>
` : ''}

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
            ${aiInsightCache && (aiInsightCache as any).paragraphs?.length ? (() => {
                const paras: string[] = (aiInsightCache as any).paragraphs;
                return `
                <div style="margin-top:32px;border:2px solid #4f46e5;border-radius:10px;overflow:hidden;page-break-inside:avoid">
                    <div style="background:#4f46e5;padding:12px 18px;display:flex;align-items:center;justify-content:space-between">
                        <span style="color:#fff;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em">✦ AI Insight Bisnis</span>
                        ${aiInsightCache.created_at ? `<span style="color:rgba(255,255,255,0.65);font-size:9px">Digenerate: ${new Date(aiInsightCache.created_at).toLocaleString('id-ID')}</span>` : ''}
                    </div>
                    ${aiInsightCache.highlights && aiInsightCache.highlights.length > 0 ? `
                        <div style="background:#f0f0ff;border-bottom:1px solid #d0d0ee;padding:14px 18px">
                            <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#4f46e5;margin-bottom:10px">Sorotan Utama</div>
                            ${aiInsightCache.highlights.map((h: string, i: number) => `
                                <div style="display:flex;align-items:flex-start;gap:8px;margin:7px 0">
                                    <span style="min-width:20px;height:20px;background:#4f46e5;color:#fff;border-radius:50%;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
                                    <span style="font-size:11px;line-height:1.5;color:#1a1a1a">${h}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="padding:16px 18px;line-height:1.9;font-size:11px;color:#333">
                        ${paras.map((p: string, i: number) => `<p style="margin:0 0 12px 0${i === 0 ? ';font-weight:600;font-size:12px' : ''};text-align:justify">${p}</p>`).join('')}
                    </div>
                </div>`;
            })() : ''}
        `;
        return wrapReport('Ringkasan Penjualan', `${dateFrom} s/d ${dateTo}`, body);
    };

    const buildProfitHTML = () => {
        if (!profitData) return null;

        const body = `
            <div class="summary-cards">
                <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL LABA</div><div style="font-size:18px;font-weight:900;color:green">${formatCurrency((profitData as any).totals?.profit || 0)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">PENDAPATAN</div><div style="font-size:18px;font-weight:900">${formatCurrency((profitData as any).totals?.revenue || 0)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">TOTAL MODAL</div><div style="font-size:18px;font-weight:900">${formatCurrency((profitData as any).totals?.cost || 0)}</div></div>
                <div class="summary-card"><div style="font-weight:bold;color:#666">MARGIN</div><div style="font-size:18px;font-weight:900">${((profitData as any).totals?.revenue || 0) > 0 ? ((((profitData as any).totals?.profit || 0) / ((profitData as any).totals?.revenue || 0)) * 100).toFixed(1) : '0.0'}%</div></div>
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
                        ${(profitData.transactionLog || []).map((t: any) => {
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
                        ${(stockTrailDetailData || []).slice(0, 50).map((t: any) => {
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
            ` : ''
            }
`;
        return wrapReport('Laporan Laba', `${dateFrom} s / d ${dateTo} `, body);
    };

    const buildComparisonHTML = () => {
        if (!comparisonData) return null;

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
                        ${(stockTrailDetailData || []).slice(0, 50).map((t: any) => {
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
            ` : ''
            }
`;
        return wrapReport('Perbandingan Periode', 'Analisis Komparasi', body);
    };

    const buildComprehensiveHTML = () => {
        if (!comprehensiveData) return null;
        const { sales, profit, hourly, transactionLog } = comprehensiveData;

        const body = `
    <h3>Ringkasan Eksekutif</h3>
            <div class="summary-cards">
                <div class="summary-card"><div>PENDAPATAN</div><div style="font-weight:900">${formatCurrency(sales.summary.revenue)}</div></div>
                <div class="summary-card"><div>TRANSAKSI</div><div style="font-weight:900">${formatNumber(sales.summary.count)}</div></div>
                <div class="summary-card"><div>RATA-RATA</div><div style="font-weight:900">${formatCurrency(sales.summary.average)}</div></div>
                <div class="summary-card"><div>LABA KOTOR</div><div style="font-weight:900;color:green">${formatCurrency((profit as any).totals?.profit || 0)}</div></div>
                <div class="summary-card"><div>MARGIN</div><div style="font-weight:900;color:blue">${((profit as any).totals?.revenue || 0) > 0 ? ((((profit as any).totals?.profit || 0) / ((profit as any).totals?.revenue || 0)) * 100).toFixed(1) : '0.0'}%</div></div>
                <div class="summary-card"><div>TOTAL MODAL</div><div style="font-weight:900">${formatCurrency((profit as any).totals?.cost || 0)}</div></div>
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
            ` : '<p style="color:#999;font-size:10px">Tidak ada data transaksi untuk periode ini.</p>'
            }
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
            ` : ''
            }
            ${aiInsightCache && aiInsightCache.paragraphs?.length ? (() => {
                const paras: string[] = aiInsightCache.paragraphs;
                return `
                <div style="margin-top:32px;border:2px solid #4f46e5;border-radius:10px;overflow:hidden;page-break-inside:avoid">
                    <div style="background:#4f46e5;padding:12px 18px;display:flex;align-items:center;justify-content:space-between">
                        <span style="color:#fff;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em">✦ AI Insight Bisnis</span>
                        ${aiInsightCache.created_at ? `<span style="color:rgba(255,255,255,0.65);font-size:9px">Digenerate: ${new Date(aiInsightCache.created_at).toLocaleString('id-ID')}</span>` : ''}
                    </div>
                    ${aiInsightCache.highlights && aiInsightCache.highlights.length > 0 ? `
                        <div style="background:#f0f0ff;border-bottom:1px solid #d0d0ee;padding:14px 18px">
                            <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#4f46e5;margin-bottom:10px">Sorotan Utama</div>
                            ${aiInsightCache.highlights.map((h: string, i: number) => `
                                <div style="display:flex;align-items:flex-start;gap:8px;margin:7px 0">
                                    <span style="min-width:20px;height:20px;background:#4f46e5;color:#fff;border-radius:50%;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
                                    <span style="font-size:11px;line-height:1.5;color:#1a1a1a">${h}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div style="padding:16px 18px;line-height:1.9;font-size:11px;color:#333">
                        ${paras.map((p: string, i: number) => `<p style="margin:0 0 12px 0${i === 0 ? ';font-weight:600;font-size:12px' : ''};text-align:justify">${p}</p>`).join('')}
                    </div>
                </div>`;
            })() : ''}
`;
        return wrapReport('Laporan Lengkap', `${dateFrom} s / d ${dateTo} `, body);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">Laporan</h2>
                    <p className="text-sm text-muted-foreground font-medium">Analisis performa bisnis dan inventaris</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowPrintConfig(true)} disabled={exporting || loading} className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-card-foreground rounded-lg shadow-sm font-semibold text-sm transition-colors">
                        <RetroPrinter className="w-4 h-4" /> Cetak / Export
                    </Button>
                </div>
            </div>

            {/* Inline status message (replaces alert()) */}
            {statusMsg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border ${statusMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : statusMsg.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                        : 'bg-primary dark:bg-primary/20 border-primary dark:border-primary text-primary-foreground dark:text-primary'
                    } `}>
                    <span className="flex-1">{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
                </div>
            )}

            <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
                <CardContent className="p-3 flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Tab Navigation (Compact) */}
                    <div className="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="inline-flex bg-muted text-muted-foreground p-1 rounded-lg w-full justify-start h-auto">
                                {TABS.filter(tab => hasRole('admin', 'supervisor') || !['profit', 'comprehensive'].includes(tab.id)).map(tab => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-xs font-semibold transition-all"
                                    >
                                        <tab.icon className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">{tab.label}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Filters */}
                    <div className="flex w-full lg:w-auto items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 h-9 shadow-sm focus-within:ring-1 ring-primary/50 transition-shadow">
                            <Calendar className="w-4 h-4 text-muted-foreground ml-1" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="border-0 shadow-none h-8 text-xs font-semibold px-1 w-[130px] bg-transparent text-foreground focus-visible:ring-0"
                            />
                            <span className="text-muted-foreground text-xs">-</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="border-0 shadow-none h-8 text-xs font-semibold px-1 w-[130px] bg-transparent text-foreground focus-visible:ring-0"
                            />
                        </div>

                        {activeTab === 'comparison' && (
                            <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 h-9 shadow-sm focus-within:ring-1 ring-primary/50 transition-shadow">
                                <span className="text-muted-foreground text-xs font-semibold ml-1">B</span>
                                <Input
                                    type="date"
                                    value={dateFrom2}
                                    onChange={e => setDateFrom2(e.target.value)}
                                    className="border-0 shadow-none h-8 text-xs font-semibold px-1 w-[130px] bg-transparent text-foreground focus-visible:ring-0"
                                />
                                <span className="text-muted-foreground text-xs">-</span>
                                <Input
                                    type="date"
                                    value={dateTo2}
                                    onChange={e => setDateTo2(e.target.value)}
                                    className="border-0 shadow-none h-8 text-xs font-semibold px-1 w-[130px] bg-transparent text-foreground focus-visible:ring-0"
                                />
                            </div>
                        )}

                        <Button onClick={handleFilter} disabled={loading} size="sm" className="flex items-center gap-2 h-9 px-4 bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm text-xs font-bold transition-colors">
                            {loading ? <RetroRefresh className="w-3.5 h-3.5 animate-spin" /> : <RetroRefresh className="w-3.5 h-3.5" />}
                            {loading ? 'Memuat...' : 'Proses'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6 animate-in fade-in duration-500">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary-50 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-bold">Menyusun data laporan...</p>
                    </div>
                ) : hasError ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                            <RetroChart className="w-10 h-10 text-red-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">Gagal memuat laporan</p>
                            <p className="text-sm text-muted-foreground">Terjadi kesalahan saat mengambil data. Coba ubah periode dan klik Proses lagi.</p>
                        </div>
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
                                labelA={`${dateFrom} - ${dateTo} `}
                                labelB={`${dateFrom2} - ${dateTo2} `}
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
                                <Layout className="w-20 h-20 text-muted-foreground" />
                                <div>
                                    <p className="text-xl font-bold text-foreground">Belum Ada Data</p>
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
