const fs = require('fs');
const path = 'D:/Ilham/Documents/Proyek/TOKO BERSAMA APP/mobile-admin-dist/assets/index-B_elhFAt.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Replace HTML Component block
const oldHTML = '      <!-- Category Breakdown (Real Data) -->\\n      <div class="chart-card">\\n        <div class="chart-header">\\n          <h3>Penjualan per Kategori</h3>\\n          <span class="chart-subtitle">30 hari terakhir</span>\\n        </div>\\n        <div class="chart-container" style="height: 250px;">\\n          <canvas id="categoryChart"></canvas>\\n          <div id="category-loading" class="chart-loading">Memuat data...</div>\\n        </div>\\n      </div>\\n\\n      <!-- Payment Methods -->\\n      <div class="chart-card">\\n        <div class="chart-header">\\n          <h3>Metode Pembayaran</h3>\\n        </div>\\n        <div class="chart-container" style="height: 250px;">\\n          <canvas id="paymentChart"></canvas>\\n        </div>\\n      </div>';
const newHTML = '      <!-- Analitik Mendalam -->\\n      <div class="chart-card">\\n        <div class="chart-header">\\n          <h3>Pola Penjualan Per Jam</h3>\\n          <span class="chart-subtitle" id="adv-period-subtitle"></span>\\n        </div>\\n        <div class="chart-container" style="height: 250px;">\\n          <canvas id="categoryChart"></canvas>\\n          <div id="category-loading" class="chart-loading">Memuat data...</div>\\n        </div>\\n      </div>\\n\\n      <div style="display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px;">\\n        <div class="chart-card" style="margin-bottom:0">\\n          <div class="chart-header" style="padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05)">\\n            <h3>Top Produk</h3>\\n          </div>\\n          <div id="adv-top-products" style="padding:15px; color:#9ca3af; font-size:12px; max-height: 250px; overflow-y: auto;">\\n          </div>\\n        </div>\\n\\n        <div class="chart-card" style="margin-bottom:0">\\n          <div class="chart-header" style="padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05)">\\n            <h3>Pelanggan VIP</h3>\\n          </div>\\n          <div id="adv-top-customers" style="padding:15px; color:#9ca3af; font-size:12px; max-height: 250px; overflow-y: auto;">\\n          </div>\\n        </div>\\n      </div>';

content = content.replace(oldHTML, newHTML);
content = content.replace(oldHTML.replace(/\\n/g, '\n'), newHTML.replace(/\\n/g, '\n'));


// 2. Replace function Fl()
const indexFl = content.indexOf('async function Fl(){');
if (indexFl > -1) {
    const indexFlEnd = content.indexOf('function jl(){', indexFl);
    let flContent = content.substring(indexFl, indexFlEnd);

    const newFlContent = `async function Fl() {
    const t = document.getElementById("category-loading"), e = document.getElementById("categoryChart");
    try {
        t && (t.style.display = "block"), t && (t.textContent = "Memuat data...");
        const res = await async function(t = null, e = null) {
            const n = e || (new Date).toISOString().split("T")[0], i = t || new Date(Date.now() - 2592e6).toISOString().split("T")[0];
            const pSubtitle = document.getElementById("adv-period-subtitle");
            if (pSubtitle) pSubtitle.textContent = i + " s/d " + n;
            return (await I(_() + "/reports/advanced?date_from=" + i + "&date_to=" + n)).data || null;
        }();
        
        Rl = res;
        t && (t.style.display = "none");
        
        if (res && res.hourly_sales && e) {
            const hourly = res.hourly_sales;
            try {
                if (Ol) { try { Ol.destroy(); } catch(e){} }
                Ol = function(canvas, data) {
                    const ctx = canvas.getContext("2d");
                    return new Do(ctx, {
                        type: "bar",
                        data: {
                            labels: data.map(d => ("0" + d.hour).slice(-2) + ":00"),
                            datasets: [{
                                label: "Pendapatan",
                                data: data.map(d => d.total_revenue),
                                backgroundColor: "#10b981", borderRadius: 4
                            }]
                        },
                        options: {
                            responsive: !0, maintainAspectRatio: !1,
                            plugins: {
                                legend: { display: !1 },
                                tooltip: {
                                    backgroundColor: "rgba(0, 0, 0, 0.8)", padding: 10, cornerRadius: 8,
                                    callbacks: { label: t => "Rp " + t.parsed.y.toLocaleString("id-ID") + " (" + data[t.dataIndex].transaction_count + " TRX)" }
                                }
                            },
                            scales: {
                                x: { grid: { display: !1 }, ticks: { color: "#9ca3af", font: { size: 10 } } },
                                y: { beginAtZero: !0, grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#9ca3af", font: { size: 10 }, callback: t => t >= 1e6 ? (t / 1e6).toFixed(1) + "jt" : t >= 1e3 ? (t / 1e3).toFixed(0) + "rb" : t } }
                            }
                        }
                    });
                }(e, hourly);
            } catch (err) {}
        } else { e && (e.parentElement.innerHTML = '<div style="text-align:center;padding:30px;color:#9ca3af">Belum ada data penjualan</div>'); }

        const topP = document.getElementById("adv-top-products");
        if (topP && res && res.top_products) {
            topP.innerHTML = res.top_products.length ? res.top_products.map(p => '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><div><span style="color:#10b981;font-weight:bold;margin-right:6px">#' + p.rank + '</span><span style="color:#e5e7eb">' + p.product_name + '</span></div><div style="font-weight:bold">' + p.qty + 'x</div></div>').join("") : "Belum ada penjualan";
        }
        
        const topC = document.getElementById("adv-top-customers");
        if (topC && res && res.top_customers) {
            topC.innerHTML = res.top_customers.length ? res.top_customers.map(c => '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><div><span style="color:#3b82f6;font-weight:bold;margin-right:6px">#' + c.rank + '</span><span style="color:#e5e7eb">' + c.customer_name + '</span></div><div style="font-weight:bold">Rp ' + c.total_revenue.toLocaleString("id-ID") + '</div></div>').join("") : "Belum ada pelanggan teregistrasi";
        }

    } catch (err) {
        t && (t.innerHTML = '<span style="color:#ef4444">Error: ' + err.message + '</span>');
    }
}\n\n`;

    content = content.replace(flContent, newFlContent);
}

fs.writeFileSync(path, content, 'utf8');
console.log("PWA PATCHED SUCCESSFULLY!");
