// Add Remaining Performance Indexes
// Run with: node electron/add-remaining-indexes.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../pos-cashier.db');

console.log('═══════════════════════════════════════');
console.log('  Adding Remaining Indexes');
console.log('═══════════════════════════════════════\n');

const db = new Database(dbPath);

try {
  const indexesToAdd = [
    {
      name: 'idx_transactions_payment_due',
      table: 'transactions',
      columns: 'payment_status, due_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_payment_due ON transactions(payment_status, due_date)',
      purpose: 'Optimize debt queries with status and due date filters'
    },
    {
      name: 'idx_transactions_status_date',
      table: 'transactions',
      columns: 'status, created_at',
      sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, created_at)',
      purpose: 'Optimize queries filtering by status and date range'
    }
  ];

  let created = 0;
  let existed = 0;

  indexesToAdd.forEach(index => {
    // Check if index already exists
    const existing = db.prepare(
      'SELECT name FROM sqlite_master WHERE type = ? AND name = ?'
    ).get('index', index.name);

    if (existing) {
      console.log(`⊙ ${index.name} already exists`);
      existed++;
    } else {
      db.exec(index.sql);
      console.log(`✓ Created ${index.name} on ${index.table}(${index.columns})`);
      created++;
    }
  });

  console.log(`\n✅ Complete! Created ${created}, Skipped ${existed}`);

  // Analyze for query optimizer
  console.log('\n🔍 Optimizing query planner...');
  db.exec('ANALYZE');
  console.log('✓ Done\n');

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('═══════════════════════════════════════\n');
