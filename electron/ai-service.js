/**
 * ai-service.js
 * LLM inference service menggunakan node-llama-cpp.
 * Lazy init — hanya inisialisasi jika model file tersedia.
 * JSON grammar enforcement untuk output yang reliabel.
 * 
 * PENTING: node-llama-cpp adalah ES Module, jadi harus di-import
 * menggunakan dynamic import() — bukan require().
 */

const os = require('os');
const aiDownload = require('./ai-download');

const TOTAL_CORES = os.cpus().length;

// ─── LLM Performance Presets ──────────────────────────────
const PRESET_CONFIG = {
    hemat:    { threadFraction: 0.25, maxTokens: 512  },
    seimbang: { threadFraction: 0.50, maxTokens: 1024 },
    cepat:    { threadFraction: 0.75, maxTokens: 2048 },
};

let activePreset = 'seimbang';

function setPreset(preset) {
    if (PRESET_CONFIG[preset]) activePreset = preset;
}

function getPresetValues(preset) {
    const cfg = PRESET_CONFIG[preset] ?? PRESET_CONFIG.seimbang;
    return {
        threads: Math.max(1, Math.floor(TOTAL_CORES * cfg.threadFraction)),
        maxTokens: cfg.maxTokens,
    };
}

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
- category_performance: { categorized_product_pct (% produk yang punya kategori), data_reliable (true jika >= 60%), categories: [{name, product_count, total_qty, total_revenue, margin_pct (null jika cost tidak lengkap)}] }. Jika data_reliable = false, JANGAN buat kesimpulan dari data ini karena kategori produk belum lengkap diisi.
- payment_method_ratio: distribusi metode pembayaran.
- data_quality: { is_sufficient, total_transactions }.
- holiday_dates: daftar hari libur nasional Indonesia yang jatuh dalam periode ini [{date, name}]. Jika kosong, tidak ada libur nasional dalam periode.
- zero_sales_weekdays: hari Senin–Sabtu tanpa transaksi yang BUKAN libur nasional (kemungkinan tutup mendadak atau keadaan darurat). Array string YYYY-MM-DD.
- customer_insights: { named_customers_count, transactions_with_name_pct (% transaksi dengan nama), repeat_customers_count (belanja >1x), one_time_customers_count, top_customers: [{name, address, tx_count, total_spent, avg_order_value, last_visit}], top_locations: [{address, unique_customers, tx_count, total_spent}] }. top_locations menunjukkan area/lokasi asal pelanggan dengan belanja tertinggi — berguna untuk pemetaan pasar dan potensi pengembangan. Jika top_customers kosong, semua transaksi adalah walk-in tanpa nama.
- debt_receivables: { total_debtor_count, total_outstanding (Rupiah string), overdue_count (jumlah transaksi jatuh tempo), overdue_amount (nominal Rupiah), top_debtors: [{name, address, open_invoices, outstanding, earliest_due (YYYY-MM-DD), status}] }. Ini adalah PIUTANG AKTIF — bon pelanggan yang belum dilunasi. Jika total_debtor_count = 0, toko tidak memiliki piutang aktif.

Tulis analisis dalam 5 paragraf yang mengalir:
1. Kondisi bisnis & tren: sebut period_info.current_period, week_over_week_pct dengan menyebut rentang tanggal period_info.prev_7_days, total transaksi, avg_transaction_value, dan arah tren harian.
2. Pola trafik: jam tersibuk & tersepi, hari tersibuk & tersepi — tafsirkan dalam konteks toko bahan bangunan (kontraktor belanja pagi sebelum proyek, dll).
3. Produk: top_selling vs slow_moving, stockout mendesak, peluang bundling dari market_basket. Jika category_performance.data_reliable = true, tambahkan 1–2 kalimat ringkas tentang kategori mana yang mendominasi omzet dan kategori mana yang margin-nya paling tinggi (jika margin_pct tersedia) — ini membantu pemilik toko tahu "mana kategori emas" vs "mana yang cuma volume". Jika data_reliable = false, SKIP bagian kategori sepenuhnya.
4. Pelanggan: peringkat top_customers berdasarkan nilai belanja (sebut nama dan alamat/area jika tersedia), rasio repeat vs one-time, rekomendasi retensi kontraktor langganan. Dari top_locations, identifikasi area yang paling aktif berbelanja dan area yang belum banyak terjangkau sebagai peluang pasar. Jika transactions_with_name_pct < 30%, sarankan pencatatan nama dan alamat pelanggan untuk transaksi besar.
5. Rekomendasi operasional: saran konkret berbasis data — stok mendesak, tata letak/bundling, metode pembayaran. DAN jika debt_receivables.total_outstanding > 0: bahas kondisi piutang secara jujur — sebut total outstanding dan nominal yang sudah jatuh tempo (jika ada), sebutkan nama debitur terbesar. Jika overdue_count > 0, tekankan urgensi penagihan karena piutang macet berisiko mengganggu modal restock.

PENTING:
- Pukul 06:00–08:00 adalah jam buka toko bahan bangunan — WAJAR jika penjualan masih sepi karena pelanggan (kontraktor, tukang) baru dalam perjalanan. Jangan beri rekomendasi apapun untuk jam ini, cukup sebutkan sebagai "jam buka".
- Hari Minggu dan hari libur nasional: toko TUTUP. Jika hari Minggu tidak muncul di day_of_week_sales, ini WAJAR — jangan komentari. Gunakan holiday_dates untuk mengidentifikasi libur nasional: jika sebuah tanggal ada di holiday_dates dan tidak ada di daily_revenue, ini WAJAR. Sebutkan libur nasional yang jatuh dalam periode secara singkat jika relevan untuk menjelaskan penurunan penjualan.
- zero_sales_weekdays: jika berisi tanggal, sebutkan secara singkat sebagai hari yang toko kemungkinan tutup mendadak — jangan spekulasi penyebabnya, cukup catat faktanya.
- SELALU sertakan tanggal aktual dari period_info saat menyebut periode: tulis "minggu lalu (15–21 Februari 2026)" bukan hanya "minggu lalu". Gunakan period_info.current_period untuk menyebut periode keseluruhan.
- Jangan buat saran generik — semua saran harus mengacu data nyata.
- Gunakan bahasa yang mudah dipahami pemilik toko kecil.
- Jangan gunakan bullet points atau list — hanya paragraf naratif.
- Field "paragraphs" harus berisi ARRAY, masing-masing elemen adalah SATU paragraf lengkap.
- Jika top_locations tidak kosong, WAJIB sertakan minimal 1 highlight tentang area/daerah dengan penjualan tertinggi (contoh: "Jl. Raya Serpong: area tersibuk — 28 transaksi dari 12 pelanggan unik"). Jika top_locations kosong, skip highlight ini.
- debt_receivables: Jika total_debtor_count > 0, WAJIB sertakan 1 highlight piutang dengan format: "Piutang aktif: [total_outstanding] dari [total_debtor_count] pelanggan" dan jika overdue_count > 0 tambahkan "— [overdue_amount] sudah jatuh tempo". Jika total_debtor_count = 0, skip highlight ini sepenuhnya.

CONTOH OUTPUT YANG BAIK — ikuti gaya bahasa, penyebutan tanggal, dan konteks toko bahan bangunan ini persis:
{
  "paragraphs": [
    "Dalam periode 29 Januari – 28 Februari 2026, toko mencatatkan 312 transaksi dengan total pendapatan Rp 85 juta — naik 15% dibanding minggu sebelumnya (22–28 Januari 2026), pertanda proyek konstruksi di sekitar area toko sedang aktif. Rata-rata nilai belanja per transaksi sebesar Rp 273 ribu mencerminkan karakter toko bahan bangunan di mana pelanggan umumnya membeli dalam jumlah besar sekaligus. Tren harian menunjukkan lonjakan di pekan ketiga bulan ini — kemungkinan bertepatan dengan jadwal pencairan dana proyek atau gajian kontraktor.",
    "Pukul 06:00–07:00 adalah jam buka toko sehingga penjualan masih sepi — pelanggan utama seperti kontraktor dan tukang baru mulai berdatangan pukul 08:00 untuk menyiapkan material sebelum proyek berjalan. Puncak transaksi terjadi pukul 08:00–10:00, lalu ada gelombang kedua yang lebih pendek di pukul 13:00–14:00 setelah jam istirahat siang. Dari sisi hari, Senin adalah yang tersibuk karena kontraktor cenderung menyiapkan material di awal pekan, sementara toko tutup pada hari Minggu dan libur nasional sehingga tidak ada data penjualan untuk hari-hari tersebut.",
    "Semen Portland 50kg dan Besi Beton 10mm mendominasi penjualan bulan ini — keduanya juga sering dibeli bersamaan dalam satu transaksi (58 kali selama periode ini), peluang paket 'material struktur' yang bisa ditawarkan di kasir. Yang mendesak: stok Semen Portland 50kg pada laju penjualan saat ini hanya cukup sekitar 6 hari — restock harus dilakukan dalam 2–3 hari agar tidak kehabisan di jam puncak pagi. Sebaliknya, Cat Tembok Premium 5kg dan Gypsum Board hampir tidak bergerak — pertimbangkan mengurangi stok keduanya dan alihkan modal ke produk yang perputarannya lebih cepat.",
    "Dari 45 pelanggan terdaftar bulan ini, 28 di antaranya belanja lebih dari sekali — basis kontraktor langganan yang solid. CV Maju Jaya (Jl. Raya Serpong) menduduki peringkat teratas dengan 8 transaksi senilai Rp 15 juta, disusul Pak Hendra dari Perumahan Griya Asri (5 transaksi, Rp 9,5 juta) dan UD Bangun Sejahtera (4 transaksi, Rp 7,2 juta). Dari pemetaan lokasi, area Jl. Raya Serpong dan sekitar Perumahan Griya Asri menyumbang lebih dari 40% total belanja pelanggan terdaftar — ini adalah zona pasar utama yang perlu dijaga pasokan dan layanannya. Sebaliknya, area Ciputat dan BSD yang berjarak tidak jauh dari toko belum banyak muncul dalam data — peluang untuk menjangkau kontraktor di sana melalui promosi atau relasi. Yang perlu diperhatikan: 65% transaksi tidak mencantumkan nama maupun alamat — biasakan kasir meminta keduanya untuk transaksi di atas Rp 300 ribu agar peta pelanggan toko makin lengkap.",
    "Tiga prioritas utama minggu ini. Pertama, restock Semen Portland dalam 2 hari ke depan sebelum stok habis di jam 08:00–10:00 yang paling ramai. Kedua, manfaatkan pola Semen dan Besi yang sering dibeli bersamaan: tempatkan keduanya berdekatan dan siapkan harga paket untuk pembelian di atas jumlah tertentu. Ketiga, 60% transaksi sudah menggunakan transfer atau QRIS — wajar untuk pelanggan kontraktor dengan nilai transaksi besar — pastikan nomor rekening dan QR code terpasang jelas di kasir agar konfirmasi pembayaran tidak memperlambat antrian di jam sibuk pagi. Satu hal yang perlu mendapat perhatian khusus: toko saat ini memiliki piutang aktif Rp 28 juta dari 9 pelanggan, dan Rp 12 juta di antaranya sudah melewati jatuh tempo — terutama CV Karya Mandiri (Rp 7,5 juta, jatuh tempo 20 Januari) yang belum ada pembayaran sama sekali. Piutang yang menggantung di atas Rp 10 juta berisiko mengganggu kemampuan toko untuk restock di awal bulan depan — segera hubungi pelanggan tersebut untuk konfirmasi jadwal pelunasan."
  ],
  "highlights": [
    "Pendapatan naik 15% vs minggu lalu (22–28 Jan) — proyek aktif",
    "Semen Portland stok ±6 hari — restock dalam 2 hari",
    "CV Maju Jaya: pelanggan terloyal — Rp 15 juta dalam 8 transaksi",
    "Jl. Raya Serpong: area tersibuk — 28 transaksi dari 12 pelanggan unik",
    "Piutang aktif: Rp 28 juta dari 9 pelanggan — Rp 12 juta sudah jatuh tempo",
    "Semen + Besi Beton sering dibeli bareng (58×) — peluang paket"
  ]
}

Jawab HANYA dalam format JSON sesuai schema yang ditentukan, dengan gaya, tanggal spesifik, dan konteks toko bahan bangunan seperti contoh di atas.`;
}

// ─── JSON Schema untuk grammar enforcement ────────────────
const INSIGHT_SCHEMA = {
    type: 'object',
    properties: {
        paragraphs: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 6,
            description: 'Array paragraf analisis — setiap elemen adalah satu paragraf naratif lengkap dalam Bahasa Indonesia',
        },
        highlights: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 6,
            description: 'Maksimal 6 poin penting singkat untuk ditampilkan di dashboard — wajib mencakup area penjualan terbesar jika top_locations tidak kosong',
        },
    },
    required: ['paragraphs', 'highlights'],
};

// ─── AVX-512 Workaround ───────────────────────────────────
// These DLLs use AVX-512 kernels that trigger an assertion failure (scale > 0.0f)
// on CPUs that report AVX-512 support but have compatibility issues.
// Renaming them forces llama.cpp to fall back to ggml-cpu-haswell.dll (AVX2).
const AVX512_DLLS = [
    'ggml-cpu-icelake.dll',
    'ggml-cpu-cascadelake.dll',
    'ggml-cpu-cooperlake.dll',
    'ggml-cpu-sapphirerapids.dll',
    'ggml-cpu-skylakex.dll',
    'ggml-cpu-cannonlake.dll',
    'ggml-cpu-zen4.dll',
];
let avx512Disabled = false;

function disableAvx512Dlls() {
    if (avx512Disabled || process.platform !== 'win32') { avx512Disabled = true; return; }
    try {
        const fs = require('fs');
        const path = require('path');
        const pkgJson = require.resolve('@node-llama-cpp/win-x64/package.json');
        const binDir = path.join(path.dirname(pkgJson), 'bins', 'win-x64');
        let disabled = 0;
        for (const dll of AVX512_DLLS) {
            const src = path.join(binDir, dll);
            if (fs.existsSync(src)) {
                fs.renameSync(src, src + '.disabled');
                disabled++;
            }
        }
        if (disabled > 0) {
            console.log(`[AI Service] Disabled ${disabled} AVX-512 DLL(s) — using AVX2 (haswell) fallback`);
        }
    } catch (e) {
        console.warn('[AI Service] AVX-512 DLL disable failed:', e.message);
    }
    avx512Disabled = true;
}

// ─── LLM Instance Cache ───────────────────────────────────
let llamaModule = null;  // cached ESM module
let llamaInstance = null;
let modelInstance = null;
let contextInstance = null;
let isInitializing = false;
let initError = null;
let gpuFailed = false; // set true after first VRAM OOM — skip GPU on next init

// ─── Helper: dynamic import node-llama-cpp (ESM) ─────────
async function importLlamaCpp() {
    if (llamaModule) return llamaModule;
    llamaModule = await import('node-llama-cpp');
    return llamaModule;
}

// ─── Lazy Init ────────────────────────────────────────────
async function initLlama() {
    if (llamaInstance && modelInstance && contextInstance) return; // already ready
    if (isInitializing) {
        // Wait for ongoing init (max 2 min to prevent infinite hang)
        await new Promise((resolve, reject) => {
            const deadline = Date.now() + 120_000;
            const check = setInterval(() => {
                if (!isInitializing) {
                    clearInterval(check);
                    if (initError) reject(initError);
                    else resolve();
                } else if (Date.now() > deadline) {
                    clearInterval(check);
                    isInitializing = false; // unblock future callers
                    reject(new Error('LLM init timeout (>2 min)'));
                }
            }, 200);
        });
        return;
    }

    isInitializing = true;
    initError = null;

    try {
        console.log('[AI Service] Initializing node-llama-cpp...');
        // Disable AVX-512 DLLs before loading to prevent assertion failures
        disableAvx512Dlls();
        const { getLlama } = await importLlamaCpp();
        const modelPath = aiDownload.getModelPath();

        const { threads } = getPresetValues(activePreset);
        console.log(`[AI Service] Thread cap: ${threads} / ${TOTAL_CORES} logical cores (preset: ${activePreset})`);

        if (gpuFailed) {
            // Previous session hit VRAM OOM — skip GPU entirely
            llamaInstance = await getLlama({ gpu: false, maxThreads: threads });
            console.log('[AI Service] getLlama() done (CPU-only, GPU previously failed)');
            modelInstance = await llamaInstance.loadModel({ modelPath });
        } else {
            // First try: GPU auto-detect (CUDA / Vulkan / Metal)
            llamaInstance = await getLlama({ maxThreads: threads });
            console.log('[AI Service] getLlama() done');
            try {
                console.log('[AI Service] Loading model with GPU...');
                modelInstance = await llamaInstance.loadModel({ modelPath });
            } catch (gpuErr) {
                // VRAM insufficient — dispose GPU instance, reinit CPU-only
                console.warn('[AI Service] GPU load failed:', gpuErr.message, '— switching to CPU-only...');
                gpuFailed = true;
                try { await llamaInstance.dispose(); } catch (e) { /* ignore */ }
                llamaInstance = await getLlama({ gpu: false, maxThreads: threads });
                console.log('[AI Service] getLlama() done (CPU-only fallback)');
                modelInstance = await llamaInstance.loadModel({ modelPath });
            }
        }
        console.log('[AI Service] Model loaded', gpuFailed ? '(CPU-only)' : '(GPU)');

        contextInstance = await modelInstance.createContext({
            contextSize: 4096,
            threads,
            flashAttention: false, // Disable flash attention to avoid AVX-512 scale assertion
        });
        console.log('[AI Service] Context created');

        isInitializing = false;
    } catch (err) {
        isInitializing = false;
        initError = err;
        console.error('[AI Service] Init failed:', err.message);
        throw err;
    }
}

// ─── Reset (untuk cleanup / error recovery) ──────────────
async function resetInstance() {
    try {
        if (contextInstance) { await contextInstance.dispose(); }
        if (modelInstance) { await modelInstance.dispose(); }
        if (llamaInstance) { await llamaInstance.dispose(); }
    } catch (e) {
        console.warn('[AI Service] Dispose error:', e.message);
    }
    llamaInstance = null;
    modelInstance = null;
    contextInstance = null;
    isInitializing = false;
    initError = null;
    console.log('[AI Service] Instance reset');
}

// ─── Main: Generate Insight ───────────────────────────────
async function generateInsight(aggregatedData) {
    if (!aiDownload.isModelReady()) {
        return { success: false, status: 'not_ready', error: 'Model belum didownload' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 120_000); // 2 menit timeout

    try {
        await initLlama();

        const { LlamaChatSession } = await importLlamaCpp();
        const grammar = await llamaInstance.createGrammarForJsonSchema(INSIGHT_SCHEMA);

        // Buat session baru per request (tidak reuse, karena setiap insight mandiri)
        const sequence = contextInstance.getSequence();
        const session = new LlamaChatSession({
            contextSequence: sequence,
            systemPrompt: buildSystemPrompt(),
        });

        console.log('[AI Service] Starting inference...');
        const startTime = Date.now();

        const { maxTokens } = getPresetValues(activePreset);
        const result = await session.prompt(
            JSON.stringify(aggregatedData),
            {
                grammar,
                signal: controller.signal,
                maxTokens,
            }
        );

        clearTimeout(timeout);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[AI Service] Inference done in ${elapsed}s`);

        const parsed = JSON.parse(result);
        return { success: true, data: parsed };
    } catch (err) {
        clearTimeout(timeout);

        if (err.name === 'AbortError' || controller.signal.aborted) {
            console.error('[AI Service] Inference timeout (>2 min)');
            // Reset instance karena state mungkin corrupt setelah abort
            await resetInstance().catch(() => { });
            return { success: false, status: 'timeout', error: 'Inferensi melebihi 2 menit' };
        }

        console.error('[AI Service] Inference error:', err.message);
        return { success: false, status: 'inference_error', error: err.message };
    }
}

module.exports = { generateInsight, isModelReady: aiDownload.isModelReady, resetInstance, setPreset };
