-- Performance Optimization Indexes
-- Created: 2026-02-11
-- Purpose: Add missing indexes to improve query performance

-- Index on transaction_items.product_id for JOINs in slow moving products query
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id
  ON transaction_items(product_id);

-- Index on transaction_items.created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_transaction_items_created_at
  ON transaction_items(created_at);

-- Composite index on transactions for debt queries
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status_due_date
  ON transactions(payment_status, due_date);

-- Composite index on transactions for better date filtering
CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at
  ON transactions(status, created_at);

-- Index on payment_history for faster transaction detail lookups
CREATE INDEX IF NOT EXISTS idx_payment_history_transaction_id
  ON payment_history(transaction_id);

-- Verify indexes were created
SELECT 'Indexes created successfully:' AS status;
SELECT name FROM sqlite_master
WHERE type = 'index'
  AND (name LIKE 'idx_transaction_items_%'
       OR name LIKE 'idx_transactions_%'
       OR name LIKE 'idx_payment_history_%')
ORDER BY name;
