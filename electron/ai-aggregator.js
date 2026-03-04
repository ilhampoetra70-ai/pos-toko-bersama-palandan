/**
 * ai-aggregator.js
 * Mengumpulkan data ringkasan dari SQLite untuk dianalisis oleh LLM.
 * Menggunakan getLocalDayRangeUTC() dari database.js untuk query timezone-aware.
 */

const database = require('./database');

// ─── Internal helpers ────────────────────────────────────
function formatRupiahText(num) {
    if (typeof num !== 'number' || isNaN(num)) return num;
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (absNum >= 1000000000) return `${sign}Rp ${(absNum / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} miliar`;
    if (absNum >= 1000000) return `${sign}Rp ${(absNum / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} juta`;
    if (absNum >= 1000) return `${sign}Rp ${(absNum / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} ribu`;
    return `${sign}Rp ${absNum}`;
}

function formatDateRangeIndo(startDate, endDate) {
    const s = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const e = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const d1 = startDate.getDate(), m1 = startDate.getMonth(), y1 = startDate.getFullYear();
    const d2 = endDate.getDate(), m2 = endDate.getMonth(), y2 = endDate.getFullYear();
    if (y1 === y2) {
        if (m1 === m2) return `${d1}-${e}`;
        return `${d1} ${startDate.toLocaleDateString('id-ID', { month: 'long' })} - ${e}`;
    }
    return `${s} - ${e}`;
}

function getNDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

/**
 * Ambil UTC range untuk N hari terakhir (dari N hari lalu hingga sekarang)
 * Menggunakan getLocalDayRangeUTC via database module untuk konsistensi timezone
 */
function getUTCRangeForLastNDays(n) {
    // Dapatkan start (N hari lalu, jam 00:00 lokal → UTC)
    // dan end (hari ini, jam 23:59 lokal → UTC)
    const startDate = getNDaysAgo(n);
    const endDate = new Date();
    return { startDate, endDate };
}

// Helper: dapatkan SQL datetime string dari Date
function toSqlUTC(dateObj) {
    return dateObj.toISOString().replace('T', ' ').slice(0, 19);
}

// Helper: format Date ke string tanggal Bahasa Indonesia (tanpa waktu)
function formatLocalDate(dateObj) {
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Hari Libur Nasional Indonesia ───────────────────────
// Sumber: SKB 3 Menteri. Perbarui setiap awal tahun.
// Format: YYYY-MM-DD (lokal WIB/WITA/WIT — tidak pakai UTC offset)
const INDONESIAN_NATIONAL_HOLIDAYS = [
    // 2024
    { date: '2024-01-01', name: 'Tahun Baru Masehi 2024' },
    { date: '2024-02-08', name: "Isra Mi'raj 1445 H" },
    { date: '2024-02-10', name: 'Tahun Baru Imlek 2575' },
    { date: '2024-03-11', name: 'Hari Raya Nyepi 1946 Saka' },
    { date: '2024-03-29', name: 'Wafat Yesus Kristus' },
    { date: '2024-04-10', name: 'Idul Fitri 1445 H' },
    { date: '2024-04-11', name: 'Idul Fitri 1445 H (hari ke-2)' },
    { date: '2024-05-01', name: 'Hari Buruh Internasional' },
    { date: '2024-05-09', name: 'Kenaikan Yesus Kristus' },
    { date: '2024-05-23', name: 'Hari Raya Waisak 2568' },
    { date: '2024-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2024-06-17', name: 'Hari Raya Idul Adha 1445 H' },
    { date: '2024-07-07', name: 'Tahun Baru Islam 1446 H' },
    { date: '2024-08-17', name: 'Hari Kemerdekaan RI ke-79' },
    { date: '2024-09-16', name: 'Maulid Nabi Muhammad SAW 1446 H' },
    { date: '2024-12-25', name: 'Hari Raya Natal' },
    // 2025
    { date: '2025-01-01', name: 'Tahun Baru Masehi 2025' },
    { date: '2025-01-27', name: "Isra Mi'raj 1446 H" },
    { date: '2025-01-29', name: 'Tahun Baru Imlek 2576' },
    { date: '2025-03-29', name: 'Hari Raya Nyepi 1947 Saka' },
    { date: '2025-03-31', name: 'Idul Fitri 1446 H' },
    { date: '2025-04-01', name: 'Idul Fitri 1446 H (hari ke-2)' },
    { date: '2025-04-18', name: 'Wafat Yesus Kristus' },
    { date: '2025-05-01', name: 'Hari Buruh Internasional' },
    { date: '2025-05-12', name: 'Hari Raya Waisak 2569' },
    { date: '2025-05-29', name: 'Kenaikan Yesus Kristus' },
    { date: '2025-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2025-06-06', name: 'Hari Raya Idul Adha 1446 H' },
    { date: '2025-06-27', name: 'Tahun Baru Islam 1447 H' },
    { date: '2025-08-17', name: 'Hari Kemerdekaan RI ke-80' },
    { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW 1447 H' },
    { date: '2025-12-25', name: 'Hari Raya Natal' },
    // 2026
    { date: '2026-01-01', name: 'Tahun Baru Masehi 2026' },
    { date: '2026-01-27', name: "Isra Mi'raj 1447 H" },
    { date: '2026-02-17', name: 'Tahun Baru Imlek 2577' },
    { date: '2026-03-19', name: 'Hari Raya Nyepi 1948 Saka' },
    { date: '2026-03-20', name: 'Idul Fitri 1447 H' },
    { date: '2026-03-21', name: 'Idul Fitri 1447 H (hari ke-2)' },
    { date: '2026-04-03', name: 'Wafat Yesus Kristus' },
    { date: '2026-05-01', name: 'Hari Buruh Internasional' },
    { date: '2026-05-14', name: 'Kenaikan Yesus Kristus' },
    { date: '2026-05-24', name: 'Hari Raya Waisak 2570' },
    { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H' },
    { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2026-06-16', name: 'Tahun Baru Islam 1448 H' },
    { date: '2026-08-17', name: 'Hari Kemerdekaan RI ke-81' },
    { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW 1448 H' },
    { date: '2026-12-25', name: 'Hari Raya Natal' },
];

/** Filter libur nasional yang jatuh dalam rentang tanggal tertentu */
function getHolidaysInRange(startDate, endDate) {
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    return INDONESIAN_NATIONAL_HOLIDAYS.filter(h => h.date >= startStr && h.date <= endStr);
}

/** Generate semua hari Senin–Sabtu dalam rentang (string YYYY-MM-DD lokal) */
function getWeekdaysInRange(startDate, endDate) {
    const days = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (cur <= end) {
        const dow = cur.getDay();
        if (dow >= 1 && dow <= 6) {
            days.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
        }
        cur.setDate(cur.getDate() + 1);
    }
    return days;
}

// ─── Main aggregation function ────────────────────────────
function aggregate(days = 30) {
    try {
        const now = new Date();
        const { startDate: startN } = getUTCRangeForLastNDays(days);
        const { startDate: start7 } = getUTCRangeForLastNDays(7);

        const rangeNStart = toSqlUTC(startN);
        const range7Start = toSqlUTC(start7);
        const rangeNow = toSqlUTC(now);

        // Untuk week-over-week comparison (7 hari sebelum 7 hari terakhir)
        const { startDate: start14 } = getUTCRangeForLastNDays(14);
        const range14Start = toSqlUTC(start14);

        // Threshold produk lambat laku: proporsional dengan periode (~1 tx per 10 hari)
        const slowMovingThreshold = Math.max(1, Math.ceil(days / 10));

        // ── 1. Top Selling Products ─────────────────────────
        const topSelling = database.all(`
            SELECT
                ti.product_name as name,
                SUM(ti.quantity) as total_qty,
                SUM(ti.subtotal) as total_revenue,
                SUM(ti.quantity * COALESCE(ti.original_cost, 0)) as total_cost,
                SUM(CASE WHEN ti.original_cost IS NULL THEN 1 ELSE 0 END) as null_cost_rows,
                COALESCE(p.stock, 0) as current_stock
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            LEFT JOIN products p ON ti.product_id = p.id
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
            GROUP BY ti.product_name
            ORDER BY total_qty DESC
            LIMIT 5
        `, [rangeNStart, rangeNow]);

        // ── 2. Slow Moving Products ─────────────────────────
        const slowMoving = database.all(`
            SELECT
                p.name,
                COUNT(DISTINCT t.id) as tx_count_period,
                p.stock as current_stock
            FROM products p
            LEFT JOIN transaction_items ti ON p.id = ti.product_id
            LEFT JOIN transactions t ON ti.transaction_id = t.id
                AND t.status = 'completed'
                AND t.created_at >= ? AND t.created_at < ?
            WHERE p.active = 1
            GROUP BY p.id, p.name
            HAVING COUNT(DISTINCT t.id) < ?
            ORDER BY tx_count_period ASC, p.stock DESC
            LIMIT 7
        `, [rangeNStart, rangeNow, slowMovingThreshold]);

        // ── 3. Hourly Sales Pattern (7 hari terakhir, timezone-adjusted) ──
        const tzOffset = database.getTimezoneOffsetHours();
        const tzModifier = `${tzOffset >= 0 ? '+' : ''}${tzOffset} hours`;

        const hourlyRaw = database.all(`
            SELECT
                CAST(strftime('%H', datetime(t.created_at, '${tzModifier}')) AS INTEGER) as hour,
                COUNT(t.id) as tx_count,
                COALESCE(SUM(t.total), 0) as revenue
            FROM transactions t
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
            GROUP BY hour
            ORDER BY hour
        `, [range7Start, rangeNow]);

        // Normalize ke avg per day (7 hari)
        const DAY_COUNT = 7;
        const hourlyMap = {};
        for (let h = 0; h < 24; h++) {
            hourlyMap[h] = { hour: h, avg_transactions: 0, avg_revenue: 0 };
        }
        for (const row of hourlyRaw) {
            hourlyMap[row.hour] = {
                hour: row.hour,
                avg_transactions: Math.max(1, Math.round(row.tx_count / DAY_COUNT)),
                avg_revenue: Math.round(row.revenue / DAY_COUNT),
            };
        }
        // Hanya kirim jam yang ada transaksi (hapus jam kosong) agar LLM fokus pada pola nyata
        const hourlySales = Object.values(hourlyMap).filter(h => h.avg_transactions > 0);

        // ── 3b. Day-of-Week Sales Pattern ──────────────────
        const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const weeksInPeriod = Math.max(1, Math.round(days / 7));

        const dayOfWeekRaw = database.all(`
            SELECT
                CAST(strftime('%w', datetime(t.created_at, '${tzModifier}')) AS INTEGER) as dow,
                COUNT(t.id) as tx_count,
                COALESCE(SUM(t.total), 0) as revenue
            FROM transactions t
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
            GROUP BY dow
            ORDER BY dow
        `, [rangeNStart, rangeNow]);

        const dayOfWeekSales = dayOfWeekRaw.map(r => ({
            day: DAY_NAMES_ID[r.dow],
            avg_transactions: Math.max(1, Math.round(r.tx_count / weeksInPeriod)),
            avg_revenue: Math.round(r.revenue / weeksInPeriod),
        }));

        // ── 4. Daily Revenue ────────────────────────────────
        const dailyRevenueRaw = database.all(`
            SELECT
                DATE(datetime(t.created_at, '${tzModifier}')) as date,
                COALESCE(SUM(t.total), 0) as revenue,
                COUNT(t.id) as tx_count
            FROM transactions t
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
            GROUP BY DATE(datetime(t.created_at, '${tzModifier}'))
            ORDER BY date ASC
        `, [rangeNStart, rangeNow]);

        // ── 4b. Market Basket Analysis (frequently bought together) ────────
        const marketBasketRaw = database.all(`
            SELECT
                a.product_name as product_a,
                b.product_name as product_b,
                COUNT(*) as freq
            FROM transaction_items a
            JOIN transaction_items b
              ON a.transaction_id = b.transaction_id
              AND a.product_id < b.product_id
            JOIN transactions t ON a.transaction_id = t.id
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
              AND a.product_id IS NOT NULL
              AND b.product_id IS NOT NULL
            GROUP BY a.product_id, b.product_id
            ORDER BY freq DESC
            LIMIT 5
        `, [rangeNStart, rangeNow]);

        // ── 4c. Payment Method Ratio ─────────────────────────────────────
        const paymentMethodRaw = database.all(`
            SELECT
                payment_method,
                COUNT(*) as count,
                COALESCE(SUM(total), 0) as revenue
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
            GROUP BY payment_method
            ORDER BY count DESC
        `, [rangeNStart, rangeNow]);

        // ── 4c-ii. Category Performance ─────────────────────────────────
        const categoryPerfRaw = database.all(`
            SELECT
                COALESCE(c.name, 'Tanpa Kategori') as category_name,
                COUNT(DISTINCT ti.product_id) as product_count,
                SUM(ti.quantity) as total_qty,
                COALESCE(SUM(ti.subtotal), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN ti.original_cost > 0
                    THEN ti.subtotal - (ti.quantity * ti.original_cost) ELSE NULL END), NULL) as total_profit
            FROM transaction_items ti
            JOIN transactions t ON ti.transaction_id = t.id
            LEFT JOIN products p ON ti.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE t.status = 'completed'
              AND t.created_at >= ? AND t.created_at < ?
            GROUP BY c.id
            ORDER BY total_revenue DESC
            LIMIT 5
        `, [rangeNStart, rangeNow]);

        // Hitung persentase produk aktif yang sudah berkategori
        const categoryQualityRaw = database.get(`
            SELECT
                COUNT(*) as total_active,
                SUM(CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END) as categorized
            FROM products WHERE active = 1
        `);
        const categorizedPct = categoryQualityRaw?.total_active > 0
            ? Math.round((categoryQualityRaw.categorized / categoryQualityRaw.total_active) * 100)
            : 0;

        // ── 4d. Customer Ranking ─────────────────────────────
        const topCustomersRaw = database.all(`
            SELECT
                TRIM(customer_name) as name,
                TRIM(customer_address) as address,
                COUNT(*) as tx_count,
                COALESCE(SUM(total), 0) as total_spent,
                COALESCE(ROUND(AVG(total)), 0) as avg_order_value,
                MAX(DATE(datetime(created_at, '${tzModifier}'))) as last_visit
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
              AND customer_name IS NOT NULL
              AND TRIM(customer_name) != ''
            GROUP BY TRIM(customer_name)
            ORDER BY total_spent DESC
            LIMIT 5
        `, [rangeNStart, rangeNow]);

        // Area/lokasi dengan transaksi terbanyak berdasarkan customer_address
        const topLocationsRaw = database.all(`
            SELECT
                TRIM(customer_address) as address,
                COUNT(DISTINCT CASE WHEN customer_name IS NOT NULL AND TRIM(customer_name) != ''
                    THEN TRIM(customer_name) END) as unique_customers,
                COUNT(*) as tx_count,
                COALESCE(SUM(total), 0) as total_spent
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
              AND customer_address IS NOT NULL
              AND TRIM(customer_address) != ''
            GROUP BY TRIM(customer_address)
            ORDER BY total_spent DESC
            LIMIT 5
        `, [rangeNStart, rangeNow]);

        const customerSummaryRaw = database.get(`
            SELECT
                COUNT(DISTINCT TRIM(customer_name)) as named_customers_count,
                COUNT(*) as named_tx_count
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
              AND customer_name IS NOT NULL
              AND TRIM(customer_name) != ''
        `, [rangeNStart, rangeNow]);

        const repeatStatsRaw = database.get(`
            SELECT
                SUM(CASE WHEN tc > 1 THEN 1 ELSE 0 END) as repeat_count,
                SUM(CASE WHEN tc = 1 THEN 1 ELSE 0 END) as one_time_count
            FROM (
                SELECT COUNT(*) as tc
                FROM transactions
                WHERE status = 'completed'
                  AND created_at >= ? AND created_at < ?
                  AND customer_name IS NOT NULL
                  AND TRIM(customer_name) != ''
                GROUP BY TRIM(customer_name)
            )
        `, [rangeNStart, rangeNow]);

        // ── 5. Piutang / Active Debt ───────────────────────
        const debtSummaryRaw = database.get(`
            SELECT
                COUNT(*) as total_debtor_count,
                COALESCE(SUM(remaining_balance), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN date(due_date) < date('now') THEN remaining_balance ELSE 0 END), 0) as overdue_amount,
                COUNT(CASE WHEN date(due_date) < date('now') THEN 1 END) as overdue_count
            FROM transactions
            WHERE payment_status IN ('belum_lunas', 'cicilan')
              AND remaining_balance > 0
        `);

        // Top 5 debtor berdasarkan sisa piutang terbesar
        const topDebtorsRaw = database.all(`
            SELECT
                COALESCE(TRIM(customer_name), 'Tanpa Nama') as name,
                TRIM(customer_address) as address,
                COUNT(*) as open_invoice_count,
                COALESCE(SUM(remaining_balance), 0) as total_outstanding,
                MIN(due_date) as earliest_due_date,
                payment_status
            FROM transactions
            WHERE payment_status IN ('belum_lunas', 'cicilan')
              AND remaining_balance > 0
            GROUP BY TRIM(customer_name)
            ORDER BY total_outstanding DESC
            LIMIT 5
        `);

        // ── 5. Low Stock Products ───────────────────────────
        const lowStock = database.all(`
            SELECT name, stock, unit,
                COALESCE(low_stock_threshold, 5) as low_stock_threshold
            FROM products
            WHERE active = 1
              AND stock <= COALESCE(low_stock_threshold, 5)
            ORDER BY stock ASC
            LIMIT 10
        `);

        // ── 6. Stock Summary ───────────────────────────────
        const stockSummary = database.get(`
            SELECT
                COUNT(*) as total_products,
                SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_products,
                SUM(CASE WHEN active = 1 AND stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM products
        `);

        // ── 7. Revenue Summary ─────────────────────────────
        const rev7 = database.get(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
        `, [range7Start, rangeNow]);

        const rev30 = database.get(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
        `, [rangeNStart, rangeNow]);

        // Pendapatan 7 hari sebelum periode terakhir (untuk week-over-week)
        const revPrev7 = database.get(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM transactions
            WHERE status = 'completed'
              AND created_at >= ? AND created_at < ?
        `, [range14Start, range7Start]);

        const totalTxInPeriod = dailyRevenueRaw.reduce((s, r) => s + r.tx_count, 0);
        const avgDaily = dailyRevenueRaw.length > 0
            ? Math.round(rev30.total / Math.max(dailyRevenueRaw.length, 1))
            : 0;
        const avgTransactionValue = totalTxInPeriod > 0
            ? Math.round(rev30.total / totalTxInPeriod)
            : 0;
        const wowChangePct = (revPrev7?.total ?? 0) > 0
            ? Math.round(((rev7.total - revPrev7.total) / revPrev7.total) * 100)
            : null;

        const periodStart = getNDaysAgo(days);
        const periodEnd = now;
        const last7Start = getNDaysAgo(7);
        const prev7Start = getNDaysAgo(14);

        // ── 8. Libur Nasional & Zero-Sales Weekdays ─────────
        const holidaysInPeriod = getHolidaysInRange(startN, now);
        const holidayDateSet = new Set(holidaysInPeriod.map(h => h.date));
        const datesWithSales = new Set(dailyRevenueRaw.map(r => r.date));
        // Hari Senin–Sabtu dalam periode yang tidak ada transaksi DAN bukan libur nasional
        const allWeekdays = getWeekdaysInRange(startN, now);
        const unexpectedZeroSalesWeekdays = allWeekdays
            .filter(d => !datesWithSales.has(d) && !holidayDateSet.has(d))
            .slice(-7); // batasi 7 terbaru agar tidak membebani token

        return {
            generated_at: now.toISOString(),
            period_days: days,
            period_info: {
                current_period: `${formatLocalDate(periodStart)} – ${formatLocalDate(periodEnd)}`,
                last_7_days: `${formatLocalDate(last7Start)} – ${formatLocalDate(periodEnd)}`,
                prev_7_days: `${formatLocalDate(prev7Start)} – ${formatLocalDate(last7Start)}`,
            },
            top_selling: topSelling.map(r => {
                const rev = Math.round(r.total_revenue);
                const cost = Math.round(r.total_cost ?? 0);
                const costDataMissing = (r.null_cost_rows ?? 0) > 0;
                const avgMarginPct = (!costDataMissing && rev > 0)
                    ? Math.round(((rev - cost) / rev) * 100)
                    : null;
                const avgDailyQty = r.total_qty / days;
                const daysUntilStockout = avgDailyQty > 0
                    ? Math.floor(r.current_stock / avgDailyQty)
                    : null;
                return {
                    name: r.name,
                    total_qty: r.total_qty,
                    total_revenue: formatRupiahText(rev),
                    avg_margin_pct: avgMarginPct,
                    cost_data_missing: costDataMissing,
                    current_stock: r.current_stock,
                    days_until_stockout: daysUntilStockout,
                };
            }),
            slow_moving: slowMoving.map(r => ({
                name: r.name,
                tx_count_period: r.tx_count_period,
                current_stock: r.current_stock,
            })),
            hourly_sales: hourlySales,
            day_of_week_sales: dayOfWeekSales,
            daily_revenue: dailyRevenueRaw.slice(-14).map(r => ({
                date: r.date,
                revenue: formatRupiahText(Math.round(r.revenue)),
                tx_count: r.tx_count,
            })),
            low_stock: lowStock.map(r => ({
                name: r.name,
                stock: r.stock,
                unit: r.unit,
                low_stock_threshold: r.low_stock_threshold,
            })),
            stock_summary: {
                total_products: stockSummary?.total_products ?? 0,
                active_products: stockSummary?.active_products ?? 0,
                out_of_stock_count: stockSummary?.out_of_stock_count ?? 0,
            },
            category_performance: {
                categorized_product_pct: categorizedPct,
                data_reliable: categorizedPct >= 60,
                categories: categoryPerfRaw.map(r => {
                    const rev = Math.round(r.total_revenue);
                    const profit = r.total_profit !== null
                        ? Math.round(r.total_profit) : null;
                    const margin_pct = profit !== null && rev > 0
                        ? Math.round((profit / rev) * 100) : null;
                    return {
                        name: r.category_name,
                        product_count: r.product_count,
                        total_qty: r.total_qty,
                        total_revenue: formatRupiahText(rev),
                        margin_pct,
                    };
                }),
            },
            revenue_summary: {
                last_7_days: formatRupiahText(Math.round(rev7?.total ?? 0)),
                prev_7_days: formatRupiahText(Math.round(revPrev7?.total ?? 0)),
                week_over_week_pct: wowChangePct,
                period_total: formatRupiahText(Math.round(rev30?.total ?? 0)),
                avg_daily: formatRupiahText(avgDaily),
                total_transactions: totalTxInPeriod,
                avg_transaction_value: formatRupiahText(avgTransactionValue),
            },
            period_info: {
                current_period: formatDateRangeIndo(startN, now),
                last_7_days: formatDateRangeIndo(start7, now),
                prev_7_days: formatDateRangeIndo(start14, new Date(start7.getTime() - 1000)),
            },
            data_quality: {
                total_transactions: totalTxInPeriod,
                is_sufficient: totalTxInPeriod >= 20,
                ...(totalTxInPeriod < 20 ? { warning: `Hanya ${totalTxInPeriod} transaksi — analisis mungkin kurang akurat` } : {}),
            },
            market_basket: marketBasketRaw.length > 0
                ? marketBasketRaw.map(r => ({ products: [r.product_a, r.product_b], frequency: r.freq }))
                : null,
            payment_method_ratio: paymentMethodRaw.map(r => ({
                method: r.payment_method || 'tidak diketahui',
                count: r.count,
                revenue: formatRupiahText(Math.round(r.revenue)),
            })),
            debt_receivables: {
                total_debtor_count: debtSummaryRaw?.total_debtor_count ?? 0,
                total_outstanding: formatRupiahText(Math.round(debtSummaryRaw?.total_outstanding ?? 0)),
                overdue_count: debtSummaryRaw?.overdue_count ?? 0,
                overdue_amount: formatRupiahText(Math.round(debtSummaryRaw?.overdue_amount ?? 0)),
                top_debtors: topDebtorsRaw.map(r => ({
                    name: r.name,
                    address: r.address || null,
                    open_invoices: r.open_invoice_count,
                    outstanding: formatRupiahText(Math.round(r.total_outstanding)),
                    earliest_due: r.earliest_due_date ? r.earliest_due_date.slice(0, 10) : null,
                    status: r.payment_status,
                })),
            },
            holiday_dates: holidaysInPeriod,
            zero_sales_weekdays: unexpectedZeroSalesWeekdays,
            customer_insights: {
                named_customers_count: customerSummaryRaw?.named_customers_count ?? 0,
                transactions_with_name_pct: totalTxInPeriod > 0
                    ? Math.round(((customerSummaryRaw?.named_tx_count ?? 0) / totalTxInPeriod) * 100)
                    : 0,
                repeat_customers_count: repeatStatsRaw?.repeat_count ?? 0,
                one_time_customers_count: repeatStatsRaw?.one_time_count ?? 0,
                top_customers: topCustomersRaw.map(r => ({
                    name: r.name,
                    address: r.address || null,
                    tx_count: r.tx_count,
                    total_spent: formatRupiahText(Math.round(r.total_spent)),
                    avg_order_value: formatRupiahText(Math.round(r.avg_order_value)),
                    last_visit: r.last_visit,
                })),
                top_locations: topLocationsRaw.map(r => ({
                    address: r.address,
                    unique_customers: r.unique_customers,
                    tx_count: r.tx_count,
                    total_spent: formatRupiahText(Math.round(r.total_spent)),
                })),
            },
        };
    } catch (err) {
        console.error('[AI Aggregator] Error:', err.message);
        throw err;
    }
}

module.exports = { aggregate };
