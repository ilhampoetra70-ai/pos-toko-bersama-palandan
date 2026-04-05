# POS Cashier App

Desktop POS toko retail Indonesia. Electron + React + better-sqlite3.

## Stack & Commands
- **Main**: Electron, better-sqlite3, bcryptjs, jsonwebtoken, express (port 3001)
- **Renderer**: React 18, Vite (port 5173), TailwindCSS, recharts, xlsx, quagga2, jsbarcode
- `npm run dev` → development | `npm run build:portable` → .exe portable

## Structure
```
electron/main.js       – Window, IPC handlers (entity:action pattern)
electron/database.js   – SQLite schema, queries, prepared stmt cache, all DB ops
electron/preload.js    – contextBridge (~140 methods via window.api.*)
electron/api-server.js – Express REST API + price-checker PWA serving
electron/auth.js       – JWT + bcrypt auth
electron/printer.js    – Receipt HTML generation + printing
src/App.jsx            – React Router, lazy loading, ProtectedRoute
src/contexts/          – AuthContext (role check), ThemeContext (dark mode)
src/pages/             – All page components (*Page.jsx)
src/components/        – Reusable components (*Modal, *Card, *Chart)
price-checker/         – PWA cek harga (served via express)
```

## Rules
- UI text: Bahasa Indonesia | Code identifiers: English
- IPC: `entity:action` → preload: `window.api.<method>()`
- Roles: `admin` (all), `supervisor` (no settings/users/db), `cashier` (limited)
- Return format: `{ success: true/false, data/error }`
- Components: PascalCase, suffix by type (*Modal, *Card, *Chart, *Page)
- Dark mode: always include `dark:` variants
- Modal overlay: `fixed inset-0 bg-black/40 z-50`

## DB Schema (better-sqlite3, WAL mode, 64MB cache)
```
users:             id, username*, password_hash, name, role, last_login, active, created_at
categories:        id, name*, created_at
products:          id, category_id→, barcode*, name, price, cost, stock, unit, active, margin_mode, created_at, updated_at
transactions:      id, invoice_number* (INV-YYYYMMDD-XXXX), user_id→, subtotal, tax_amount, discount_amount, total,
                   payment_method, amount_paid, change_amount, customer_name, customer_address,
                   payment_status (lunas|hutang|cicilan|pending), due_date, total_paid, remaining_balance, status (completed|voided), created_at
transaction_items: id, transaction_id→, product_id→, product_name, price, original_cost, quantity, discount, subtotal
payment_history:   id, transaction_id→, amount, payment_method, payment_date, received_by→, notes
stock_audit_log:   id, product_id→, product_name, old_stock, new_stock, difference, reason, user_id→, user_name, created_at
stock_trail:       id, product_id→, product_name, event_type (initial|sale|restock|adjustment), quantity_before/change/after, user_id, user_name, notes, reference_id, created_at
settings:          key (PK), value
```
Legend: `*` = UNIQUE, `→` = FK

## DB Helpers (database.js)
```js
run(sql, params)  // INSERT/UPDATE/DELETE → { lastInsertRowid, changes }
get(sql, params)  // SELECT one → Object | null
all(sql, params)  // SELECT many → Object[]
// All use cachedPrepare() for prepared statement caching
// Settings cached via settingsCache, timezone via cachedTimezoneOffset
```

## Key IPC Channels
- auth: login, verify, resetPasswordWithMasterKey, changeMasterKey
- users/categories/products: CRUD (getAll, create, update, delete)
- products: +getByBarcode, bulkUpsert, bulkDelete, getLowStock, updateWithAudit, generateBarcode
- transactions: create, getAll, getById, void, addPayment, getPaymentHistory
- debts: getOutstanding, getSummary, getOverdue
- dashboard: stats, enhancedStats
- reports: sales, profit, comparison, hourly, comprehensive, exportPdf, printPlainText
- print: receipt, preview, getPrinters | excel: export/import | db: backup/restore/vacuum
- settings: getAll, update, uploadLogo, getMarginStats, updateMargin

## Transaction Flow
1. CashierPage: scan/search → addToCart (useCallback) → PaymentModal
2. transactions:create IPC → DB insert + stock decrement + stock_trail + audit_log
3. print:receipt → HTML generation → printer

## Adding a New Feature
1. DB: table/column in `database.js` (createTables or runMigrations)
2. IPC: handler in `main.js`
3. Bridge: method in `preload.js`
4. UI: page/component in `src/`
5. Route: `App.jsx` with ProtectedRoute if needed
6. Nav: `Sidebar.jsx`

## Routes
`/login` `/` (dashboard) `/cashier` `/products` `/low-stock` `/stock-trail` `/transactions` `/reports` `/debts` `/users`(admin) `/database`(admin) `/settings`(admin)

## Debugging
- Dev DB: `./pos-cashier.db` | Prod: `%APPDATA%/POS Cashier/pos-cashier.db`
- Main process log: electron terminal | Renderer: DevTools (Ctrl+Shift+I)
- API: localhost:3001 | Vite: localhost:5173

## Performance Notes
- database.js: prepared statement cache (stmtCache Map), timezone cache, batch daily stats queries
- api-server.js: response cache (apiCache Map, 5-30s TTL) for settings/categories
- React: lazy loading all pages, React.memo on ProductCard/Cart/StockHistoryPanel, useCallback on CashierPage cart ops
- Vite: manual chunks (vendor, charts, xlsx, barcode)
