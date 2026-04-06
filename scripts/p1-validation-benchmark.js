const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');

function run() {
  const dbPath = path.join(os.tmpdir(), `p1-baseline-${Date.now()}.db`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      active INTEGER,
      stock INTEGER
    );
  `);

  const insert = db.prepare('INSERT INTO products (id, name, active, stock) VALUES (?, ?, ?, ?)');
  const seed = db.transaction((count) => {
    for (let i = 1; i <= count; i++) insert.run(i, `PROD-${i}`, 1, 100);
  });
  seed(20000);

  const getById = db.prepare('SELECT id, active FROM products WHERE id = ?');
  function nPlusOne(ids) {
    let inactive = 0;
    for (const id of ids) {
      const row = getById.get(id);
      if (!row || row.active === 0) inactive++;
    }
    return inactive;
  }

  function batch(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT id, active FROM products WHERE id IN (${placeholders})`).all(...ids);
    const map = new Map(rows.map((r) => [r.id, r.active]));
    let inactive = 0;
    for (const id of ids) {
      const active = map.get(id);
      if (active === undefined || active === 0) inactive++;
    }
    return inactive;
  }

  function measure(fn, ids, rounds = 25) {
    const samples = [];
    for (let i = 0; i < rounds; i++) {
      const t0 = process.hrtime.bigint();
      fn(ids);
      const t1 = process.hrtime.bigint();
      samples.push(Number(t1 - t0) / 1e6);
    }
    samples.sort((a, b) => a - b);
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const p95Idx = Math.max(0, Math.ceil(samples.length * 0.95) - 1);
    return {
      avg_ms: Number(avg.toFixed(4)),
      p95_ms: Number(samples[p95Idx].toFixed(4)),
      min_ms: Number(samples[0].toFixed(4)),
      max_ms: Number(samples[samples.length - 1].toFixed(4)),
    };
  }

  const sizes = [5, 20, 50, 100];
  const results = sizes.map((size) => {
    const ids = Array.from({ length: size }, (_, i) => i + 1);
    nPlusOne(ids);
    batch(ids);
    const n1 = measure(nPlusOne, ids);
    const b = measure(batch, ids);
    const improvement = n1.avg_ms > 0 ? ((n1.avg_ms - b.avg_ms) / n1.avg_ms) * 100 : 0;
    return {
      cart_size: size,
      n_plus_one: n1,
      batch: b,
      avg_improvement_pct: Number(improvement.toFixed(2)),
    };
  });

  const output = {
    timestamp: new Date().toISOString(),
    seed_products: 20000,
    rounds_per_case: 25,
    results,
  };

  console.log(JSON.stringify(output, null, 2));

  db.close();
  try {
    fs.unlinkSync(dbPath);
  } catch (_) {
    // no-op
  }
}

run();
