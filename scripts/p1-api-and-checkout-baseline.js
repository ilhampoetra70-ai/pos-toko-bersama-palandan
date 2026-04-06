const fs = require('fs');
const os = require('os');
const path = require('path');
const { app } = require('electron');

const database = require('../electron/database');
const apiServer = require('../electron/api-server');
const auth = require('../electron/auth');

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

function summarizeDurations(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1);
  return {
    count: sorted.length,
    avg_ms: Number(avg.toFixed(3)),
    p95_ms: Number(percentile(sorted, 0.95).toFixed(3)),
    min_ms: Number((sorted[0] || 0).toFixed(3)),
    max_ms: Number((sorted[sorted.length - 1] || 0).toFixed(3)),
  };
}

async function benchEndpoint({ url, headers, concurrency, requests }) {
  const durations = [];
  const statusCounts = {};
  let cursor = 0;

  const cpuStart = process.cpuUsage();
  const wallStart = process.hrtime.bigint();

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= requests) return;
      const t0 = process.hrtime.bigint();
      const res = await fetch(url, { headers });
      const t1 = process.hrtime.bigint();
      const ms = Number(t1 - t0) / 1e6;
      durations.push(ms);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      await res.arrayBuffer();
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const wallEnd = process.hrtime.bigint();
  const cpuEnd = process.cpuUsage(cpuStart);
  const wallMs = Number(wallEnd - wallStart) / 1e6;
  const cpuMs = (cpuEnd.user + cpuEnd.system) / 1000;
  const cpuPercent = wallMs > 0 ? (cpuMs / wallMs) * 100 : 0;

  return {
    concurrency,
    requests,
    latency: summarizeDurations(durations),
    status_counts: statusCounts,
    process_cpu_percent: Number(cpuPercent.toFixed(2)),
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ensureSeedData(user) {
  const productsRes = database.getProducts({ limit: 500, offset: 0, sortBy: 'id', sortOrder: 'ASC' });
  const existingProducts = Array.isArray(productsRes) ? productsRes : (productsRes.data || []);
  const targetProducts = 300;

  if (existingProducts.length < targetProducts) {
    for (let i = existingProducts.length + 1; i <= targetProducts; i++) {
      const barcode = String(770000000000 + i).slice(-12);
      database.createProduct({
        barcode,
        name: `BENCH PRODUCT ${i}`,
        price: 1000 + (i % 25) * 100,
        cost: 700 + (i % 25) * 80,
        stock: 1000,
        unit: 'pcs',
      });
    }
  }

  const productList = database.getProducts({ limit: 500, offset: 0, sortBy: 'id', sortOrder: 'ASC' });
  const products = Array.isArray(productList) ? productList : (productList.data || []);

  const txExisting = database.getTransactions({ limit: 5, offset: 0 });
  const txCount = txExisting?.total || 0;
  const targetTx = 120;

  if (txCount < targetTx) {
    const pool = products.slice(0, 60);
    for (let t = txCount; t < targetTx; t++) {
      const itemCount = randomInt(3, 7);
      const picked = [];
      for (let k = 0; k < itemCount; k++) {
        picked.push(pool[randomInt(0, pool.length - 1)]);
      }
      const items = picked.map((p) => {
        const qty = randomInt(1, 3);
        const subtotal = p.price * qty;
        return {
          product_id: p.id,
          product_name: p.name,
          price: p.price,
          cost: p.cost || Math.round(p.price * 0.7),
          quantity: qty,
          discount: 0,
          subtotal,
        };
      });
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
      database.createTransaction({
        user_id: user.id,
        user_name: user.name || user.username,
        subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total: subtotal,
        payment_method: 'cash',
        amount_paid: subtotal,
        change_amount: 0,
        payment_status: 'lunas',
        items,
      });
    }
  }
}

function benchCheckoutBackend(user, sizes = [5, 20, 50], rounds = 20) {
  const productList = database.getProducts({ limit: 500, offset: 0, sortBy: 'id', sortOrder: 'ASC' });
  const products = (Array.isArray(productList) ? productList : (productList.data || [])).slice(0, 120);

  const result = [];
  for (const size of sizes) {
    const itemsBase = products.slice(0, size).map((p) => ({
      product_id: p.id,
      product_name: p.name,
      price: p.price,
      cost: p.cost || Math.round(p.price * 0.7),
      quantity: 1,
      discount: 0,
      subtotal: p.price,
    }));

    const durations = [];
    for (let i = 0; i < rounds; i++) {
      const subtotal = itemsBase.reduce((s, it) => s + it.subtotal, 0);
      const t0 = process.hrtime.bigint();
      database.createTransaction({
        user_id: user.id,
        user_name: user.name || user.username,
        subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total: subtotal,
        payment_method: 'cash',
        amount_paid: subtotal,
        change_amount: 0,
        payment_status: 'lunas',
        items: itemsBase,
      });
      const t1 = process.hrtime.bigint();
      durations.push(Number(t1 - t0) / 1e6);
    }

    result.push({
      cart_size: size,
      rounds,
      latency: summarizeDurations(durations),
    });
  }

  return result;
}

async function main() {
  const benchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-p1-bench-'));
  app.setPath('userData', benchRoot);

  const output = {
    timestamp: new Date().toISOString(),
    bench_root: benchRoot,
    note: 'Isolated benchmark DB. Hasil ini untuk backfill baseline P0 setelah implementasi berjalan.',
  };

  try {
    await app.whenReady();
    database.initDatabase();
    auth.seedDefaultAdmin();
    auth.seedMasterKey();

    const user = database.getUserByUsername('admin') || database.getUsers()[0];
    if (!user) throw new Error('Tidak ada user untuk benchmark.');

    ensureSeedData(user);
    const serverInfo = await apiServer.startServer(database, 3001);
    const baseUrl = `http://localhost:${serverInfo.port}`;
    const token = auth.generateToken(user);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const apiTargets = [
      { name: 'products', url: `${baseUrl}/api/products` },
      { name: 'dashboard_stats', url: `${baseUrl}/api/dashboard/stats` },
      { name: 'transactions', url: `${baseUrl}/api/transactions?limit=50&offset=0` },
    ];

    const apiBench = [];
    for (const target of apiTargets) {
      const c1 = await benchEndpoint({
        url: target.url,
        headers: authHeaders,
        concurrency: 1,
        requests: 120,
      });
      const c5 = await benchEndpoint({
        url: target.url,
        headers: authHeaders,
        concurrency: 5,
        requests: 200,
      });
      apiBench.push({ endpoint: target.name, c1, c5 });
    }

    const checkoutBench = benchCheckoutBackend(user, [5, 20, 50], 20);

    output.server = serverInfo;
    output.api_benchmark = apiBench;
    output.checkout_backend_benchmark = checkoutBench;

    console.log(JSON.stringify(output, null, 2));

    await apiServer.stopServer();
    database.closeDatabase();
  } catch (err) {
    output.error = err.message;
    console.log(JSON.stringify(output, null, 2));
    try {
      await apiServer.stopServer();
    } catch (_) {}
    try {
      database.closeDatabase();
    } catch (_) {}
    process.exitCode = 1;
  } finally {
    try {
      fs.rmSync(benchRoot, { recursive: true, force: true });
    } catch (_) {}
    app.quit();
  }
}

main();
