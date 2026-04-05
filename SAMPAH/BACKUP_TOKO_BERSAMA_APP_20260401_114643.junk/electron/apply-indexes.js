// Apply Performance Indexes Migration
// Run with: node electron/apply-indexes.js

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../pos-cashier.db');
const migrationPath = path.join(__dirname, 'migrations/add-performance-indexes.sql');

console.log('═══════════════════════════════════════');
console.log('  Performance Indexes Migration');
console.log('═══════════════════════════════════════');
console.log(`Database: ${dbPath}`);
console.log(`Migration: ${migrationPath}`);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found!');
  process.exit(1);
}

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found!');
  process.exit(1);
}

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Open database
const db = new Database(dbPath);

try {
  console.log('\n📊 Current indexes:');
  const existingIndexes = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'index'
      AND (name LIKE 'idx_transaction_items_%'
           OR name LIKE 'idx_transactions_%'
           OR name LIKE 'idx_payment_history_%')
    ORDER BY name
  `).all();

  if (existingIndexes.length > 0) {
    existingIndexes.forEach(idx => console.log(`  - ${idx.name}`));
  } else {
    console.log('  (no performance indexes found)');
  }

  // Execute migration
  console.log('\n🔨 Applying migration...');

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT \'Indexes'));

  let createdCount = 0;
  let skippedCount = 0;

  statements.forEach(sql => {
    if (!sql) return;

    try {
      db.exec(sql);
      const indexName = sql.match(/idx_\w+/)?.[0];
      if (indexName) {
        console.log(`  ✓ Created: ${indexName}`);
        createdCount++;
      }
    } catch (err) {
      if (err.message.includes('already exists')) {
        const indexName = sql.match(/idx_\w+/)?.[0];
        console.log(`  ⊙ Skipped: ${indexName} (already exists)`);
        skippedCount++;
      } else {
        throw err;
      }
    }
  });

  console.log(`\n✅ Migration complete!`);
  console.log(`   Created: ${createdCount} indexes`);
  console.log(`   Skipped: ${skippedCount} indexes (already existed)`);

  // Show all indexes after migration
  console.log('\n📊 All performance indexes:');
  const allIndexes = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'index'
      AND (name LIKE 'idx_transaction_items_%'
           OR name LIKE 'idx_transactions_%'
           OR name LIKE 'idx_payment_history_%')
    ORDER BY name
  `).all();

  allIndexes.forEach(idx => console.log(`  - ${idx.name}`));

  // Analyze tables for query planner
  console.log('\n🔍 Analyzing tables for query optimizer...');
  db.exec('ANALYZE transactions');
  db.exec('ANALYZE transaction_items');
  db.exec('ANALYZE payment_history');
  console.log('  ✓ Analysis complete');

} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n═══════════════════════════════════════');
console.log('  Done!');
console.log('═══════════════════════════════════════\n');
