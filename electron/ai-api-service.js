/**
 * ai-api-service.js
 * Generate AI insight via external API providers.
 * Mendukung OpenAI-compatible API dan Google Gemini.
 *
 * Provider yang didukung:
 *  - openai   : api.openai.com (gpt-4o-mini, gpt-4o, dll)
 *  - groq     : api.groq.com/openai/v1 (OpenAI-compatible, gratis)
 *  - openrouter: openrouter.ai/api/v1 (OpenAI-compatible, banyak model gratis)
 *  - gemini   : generativelanguage.googleapis.com (gemini-1.5-flash, dll)
 *  - custom   : base URL yang ditentukan user (Ollama, LM Studio, dll)
 */

const https = require('https');
const http = require('http');

// ─── System Prompt (dibangun saat runtime agar tanggal selalu akurat) ───────
function buildSystemPrompt() {
    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    return `Kamu adalah asisten analitik bisnis untuk toko bahan bangunan Indonesia.
Analisis data penjualan yang diberikan dan hasilkan analisis bisnis naratif dalam Bahasa Indonesia.
Hari ini adalah: ${today}.

KONTEKS TOKO: Ini adalah toko bahan bangunan. Pelanggan utama adalah kontraktor, tukang bangunan, dan pemilik rumah yang sedang renovasi. Pola belanja cenderung dalam jumlah besar, transaksi bernilai tinggi, dan ramai di hari kerja (kontraktor aktif Senin–Sabtu pagi). Toko TUTUP pada hari Minggu dan hari libur nasional Indonesia — data penjualan hari-hari tersebut akan kosong atau tidak muncul sama sekali.

Data yang tersedia:
- period_info: rentang tanggal periode ini (current_period), 7 hari terakhir (last_7_days), dan 7 hari sebelumnya (prev_7_days). WAJIB digunakan saat menyebut periode waktu.
- revenue_summary: week_over_week_pct (tren naik/turun), avg_transaction_value, total_transactions.
- hourly_sales: rata-rata transaksi per jam (waktu lokal). Hanya jam aktif yang ditampilkan.
- day_of_week_sales: rata-rata transaksi per hari dalam seminggu.
- daily_revenue: pendapatan per hari — untuk menilai tren naik, turun, atau stagnan.
- top_selling: produk terlaris dengan avg_margin_pct (null jika cost_data_missing=true) dan days_until_stockout.
- slow_moving: produk dengan transaksi di bawah normal (tx_count_period).
- low_stock: produk mendekati atau sudah habis stok.
- market_basket: pasangan produk sering dibeli bersama (null jika data tidak cukup).
- payment_method_ratio: distribusi metode pembayaran.
- data_quality: { is_sufficient, total_transactions }.
- holiday_dates: daftar hari libur nasional Indonesia yang jatuh dalam periode ini [{date, name}]. Jika kosong, tidak ada libur nasional dalam periode.
- zero_sales_weekdays: hari Senin–Sabtu tanpa transaksi yang BUKAN libur nasional (kemungkinan tutup mendadak atau keadaan darurat). Array string YYYY-MM-DD.
- customer_insights: { named_customers_count, transactions_with_name_pct (% transaksi dengan nama), repeat_customers_count (belanja >1x), one_time_customers_count, top_customers: [{name, address, tx_count, total_spent, avg_order_value, last_visit}], top_locations: [{address, unique_customers, tx_count, total_spent}] }. top_locations menunjukkan area/lokasi asal pelanggan dengan belanja tertinggi — berguna untuk pemetaan pasar dan potensi pengembangan. Jika top_customers kosong, semua transaksi adalah walk-in tanpa nama.

Tulis analisis dalam 5 paragraf yang mengalir:
1. Kondisi bisnis & tren: sebut period_info.current_period, week_over_week_pct dengan menyebut rentang tanggal period_info.prev_7_days, total transaksi, avg_transaction_value, dan arah tren harian.
2. Pola trafik: jam tersibuk & tersepi, hari tersibuk & tersepi — tafsirkan dalam konteks toko bahan bangunan (kontraktor belanja pagi sebelum proyek, dll).
3. Produk: top_selling vs slow_moving, stockout mendesak, peluang bundling dari market_basket.
4. Pelanggan: peringkat top_customers berdasarkan nilai belanja (sebut nama dan alamat/area jika tersedia), rasio repeat vs one-time, rekomendasi retensi kontraktor langganan. Dari top_locations, identifikasi area yang paling aktif berbelanja dan area yang belum banyak terjangkau sebagai peluang pasar. Jika transactions_with_name_pct < 30%, sarankan pencatatan nama dan alamat pelanggan untuk transaksi besar.
5. Rekomendasi operasional: saran konkret berbasis data — stok, tata letak, metode pembayaran.

PENTING:
- Pukul 06:00–08:00 adalah jam buka toko bahan bangunan — WAJAR jika penjualan masih sepi karena pelanggan (kontraktor, tukang) baru dalam perjalanan. Jangan beri rekomendasi apapun untuk jam ini, cukup sebutkan sebagai "jam buka".
- Hari Minggu dan hari libur nasional: toko TUTUP. Jika hari Minggu tidak muncul di day_of_week_sales, ini WAJAR — jangan komentari. Gunakan holiday_dates untuk mengidentifikasi libur nasional: jika sebuah tanggal ada di holiday_dates dan tidak ada di daily_revenue, ini WAJAR. Sebutkan libur nasional yang jatuh dalam periode secara singkat jika relevan untuk menjelaskan penurunan penjualan.
- zero_sales_weekdays: jika berisi tanggal, sebutkan secara singkat sebagai hari yang toko kemungkinan tutup mendadak — jangan spekulasi penyebabnya, cukup catat faktanya.
- SELALU sertakan tanggal aktual dari period_info saat menyebut periode: tulis "minggu lalu (15–21 Februari 2026)" bukan hanya "minggu lalu". Gunakan period_info.current_period untuk menyebut periode keseluruhan.
- Jangan buat saran generik — semua saran harus mengacu data nyata.
- Gunakan bahasa yang mudah dipahami pemilik toko kecil.
- Jangan gunakan bullet points atau list — hanya paragraf naratif.
- Field "paragraphs" harus berisi ARRAY, setiap elemen adalah SATU paragraf lengkap. Jangan gabungkan semua teks dalam satu elemen.
- Jika top_locations tidak kosong, WAJIB sertakan minimal 1 highlight tentang area/daerah dengan penjualan tertinggi (contoh: "Jl. Raya Serpong: area tersibuk — 28 transaksi dari 12 pelanggan unik"). Jika top_locations kosong, skip highlight ini.

CONTOH OUTPUT YANG BAIK — ikuti gaya bahasa, penyebutan tanggal, dan konteks toko bahan bangunan ini persis:
{
  "paragraphs": [
    "Dalam periode 29 Januari – 28 Februari 2026, toko mencatatkan 312 transaksi dengan total pendapatan Rp 85 juta — naik 15% dibanding minggu sebelumnya (22–28 Januari 2026), pertanda proyek konstruksi di sekitar area toko sedang aktif. Rata-rata nilai belanja per transaksi sebesar Rp 273 ribu mencerminkan karakter toko bahan bangunan di mana pelanggan umumnya membeli dalam jumlah besar sekaligus. Tren harian menunjukkan lonjakan di pekan ketiga bulan ini — kemungkinan bertepatan dengan jadwal pencairan dana proyek atau gajian kontraktor.",
    "Pukul 06:00–07:00 adalah jam buka toko sehingga penjualan masih sepi — pelanggan utama seperti kontraktor dan tukang baru mulai berdatangan pukul 08:00 untuk menyiapkan material sebelum proyek berjalan. Puncak transaksi terjadi pukul 08:00–10:00, lalu ada gelombang kedua yang lebih pendek di pukul 13:00–14:00 setelah jam istirahat siang. Dari sisi hari, Senin adalah yang tersibuk karena kontraktor cenderung menyiapkan material di awal pekan, sementara toko tutup pada hari Minggu dan libur nasional sehingga tidak ada data penjualan untuk hari-hari tersebut.",
    "Semen Portland 50kg dan Besi Beton 10mm mendominasi penjualan bulan ini — keduanya juga sering dibeli bersamaan dalam satu transaksi (58 kali selama periode ini), peluang paket 'material struktur' yang bisa ditawarkan di kasir. Yang mendesak: stok Semen Portland 50kg pada laju penjualan saat ini hanya cukup sekitar 6 hari — restock harus dilakukan dalam 2–3 hari agar tidak kehabisan di jam puncak pagi. Sebaliknya, Cat Tembok Premium 5kg dan Gypsum Board hampir tidak bergerak — pertimbangkan mengurangi stok keduanya dan alihkan modal ke produk yang perputarannya lebih cepat.",
    "Dari 45 pelanggan terdaftar bulan ini, 28 di antaranya belanja lebih dari sekali — basis kontraktor langganan yang solid. CV Maju Jaya (Jl. Raya Serpong) menduduki peringkat teratas dengan 8 transaksi senilai Rp 15 juta, disusul Pak Hendra dari Perumahan Griya Asri (5 transaksi, Rp 9,5 juta) dan UD Bangun Sejahtera (4 transaksi, Rp 7,2 juta). Dari pemetaan lokasi, area Jl. Raya Serpong dan sekitar Perumahan Griya Asri menyumbang lebih dari 40% total belanja pelanggan terdaftar — ini adalah zona pasar utama yang perlu dijaga pasokan dan layanannya. Sebaliknya, area Ciputat dan BSD yang berjarak tidak jauh dari toko belum banyak muncul dalam data — peluang untuk menjangkau kontraktor di sana melalui promosi atau relasi. Yang perlu diperhatikan: 65% transaksi tidak mencantumkan nama maupun alamat — biasakan kasir meminta keduanya untuk transaksi di atas Rp 300 ribu agar peta pelanggan toko makin lengkap.",
    "Tiga prioritas utama minggu ini. Pertama, restock Semen Portland dalam 2 hari ke depan sebelum stok habis di jam 08:00–10:00 yang paling ramai. Kedua, manfaatkan pola Semen dan Besi yang sering dibeli bersamaan: tempatkan keduanya berdekatan dan siapkan harga paket untuk pembelian di atas jumlah tertentu. Ketiga, 60% transaksi sudah menggunakan transfer atau QRIS — wajar untuk pelanggan kontraktor dengan nilai transaksi besar — pastikan nomor rekening dan QR code terpasang jelas di kasir agar konfirmasi pembayaran tidak memperlambat antrian di jam sibuk pagi."
  ],
  "highlights": [
    "Pendapatan naik 15% vs minggu lalu (22–28 Jan) — proyek aktif",
    "Semen Portland stok ±6 hari — restock dalam 2 hari",
    "CV Maju Jaya: pelanggan terloyal — Rp 15 juta dalam 8 transaksi",
    "Jl. Raya Serpong: area tersibuk — 28 transaksi dari 12 pelanggan unik",
    "Semen + Besi Beton sering dibeli bareng (58×) — peluang paket",
    "65% transaksi tanpa nama — mulai catat nama untuk transaksi besar"
  ]
}

Jawab HANYA dalam format JSON yang valid, tanpa penjelasan tambahan, dengan struktur yang sama persis seperti contoh di atas.`;
}

// ─── Provider Presets ─────────────────────────────────────
const PROVIDER_PRESETS = {
    openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
    groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'google/gemini-2.0-flash-exp:free' },
    gemini: { baseUrl: null, defaultModel: 'gemini-2.0-flash' },
    custom: { baseUrl: '', defaultModel: '' },
};

// ─── HTTP Helper ──────────────────────────────────────────
function httpRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'POST',
            headers: options.headers || {},
            timeout: options.timeout || 60000,
        };

        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (body) req.write(body);
        req.end();
    });
}

// ─── OpenAI-Compatible Call ───────────────────────────────
async function callOpenAICompatible({ baseUrl, apiKey, model, prompt, timeout }) {
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const requestBody = JSON.stringify({
        model,
        messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: JSON.stringify(prompt) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2200,
    });

    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    console.log(`[AI API] POST ${url} (model: ${model})`);
    const response = await httpRequest(url, { headers, timeout: timeout || 60000 }, requestBody);

    if (response.statusCode !== 200) {
        let errMsg = `HTTP ${response.statusCode}`;
        try { errMsg = JSON.parse(response.body)?.error?.message || errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
    }

    const json = JSON.parse(response.body);
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Respons API kosong atau tidak valid');

    return JSON.parse(content);
}

// ─── Google Gemini Call ───────────────────────────────────
async function callGemini({ apiKey, model, prompt, timeout }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemAndPrompt = `${buildSystemPrompt()}\n\nData toko:\n${JSON.stringify(prompt, null, 2)}`;

    const requestBody = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemAndPrompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 2200,
        },
    });

    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
    };

    console.log(`[AI API] Gemini POST (model: ${model})`);
    const response = await httpRequest(url, { headers, timeout: timeout || 60000 }, requestBody);

    if (response.statusCode !== 200) {
        let errMsg = `HTTP ${response.statusCode}`;
        try { errMsg = JSON.parse(response.body)?.error?.message || errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
    }

    const json = JSON.parse(response.body);
    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Respons Gemini kosong atau tidak valid');

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned);
}

// ─── Main Export ──────────────────────────────────────────
async function generateInsightViaApi(aggregatedData, settings) {
    const { provider = 'groq', apiKey, model, baseUrl } = settings;

    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
    const effectiveModel = model || preset.defaultModel;
    const effectiveBaseUrl = baseUrl || preset.baseUrl;

    if (!apiKey && provider !== 'custom') {
        return { success: false, status: 'api_error', error: 'API key belum diisi' };
    }
    if (!effectiveModel) {
        return { success: false, status: 'api_error', error: 'Nama model belum diisi' };
    }

    try {
        let result;
        if (provider === 'gemini') {
            result = await callGemini({ apiKey, model: effectiveModel, prompt: aggregatedData });
        } else {
            if (!effectiveBaseUrl) {
                return { success: false, status: 'api_error', error: 'Base URL belum diisi untuk provider custom' };
            }
            result = await callOpenAICompatible({
                baseUrl: effectiveBaseUrl,
                apiKey,
                model: effectiveModel,
                prompt: aggregatedData,
            });
        }

        // Validate required fields
        if (!result.paragraphs || !Array.isArray(result.paragraphs) || result.paragraphs.length === 0) {
            throw new Error('Field "paragraphs" tidak ada atau kosong dalam respons API');
        }
        if (!result.highlights) throw new Error('Field "highlights" tidak ada dalam respons API');

        return { success: true, data: result };
    } catch (err) {
        console.error('[AI API] Error:', err.message);
        return { success: false, status: 'inference_error', error: err.message };
    }
}

/**
 * Quick connection test — kirim prompt minimal dan cek apakah API merespons.
 */
async function testApiConnection(settings) {
    const { provider = 'groq', apiKey, model, baseUrl } = settings;
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
    const effectiveModel = model || preset.defaultModel;
    const effectiveBaseUrl = baseUrl || preset.baseUrl;

    try {
        if (provider === 'gemini') {
            await callGemini({
                apiKey,
                model: effectiveModel,
                prompt: { test: true },
                timeout: 15000,
            });
        } else {
            await callOpenAICompatible({
                baseUrl: effectiveBaseUrl,
                apiKey,
                model: effectiveModel,
                prompt: { test: true },
                timeout: 15000,
            });
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { generateInsightViaApi, testApiConnection, PROVIDER_PRESETS };
