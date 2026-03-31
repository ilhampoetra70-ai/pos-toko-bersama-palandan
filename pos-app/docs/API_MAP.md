# API Route Map
(Extracted from `electron/api-server.js`)

## Base URL
`http://localhost:3001` (Default)

## Public / System
- `GET /api/health` - Check server status
- `GET /api/store` - Get store name and address
- `POST /api/settings` - Update settings (single key-value or bulk object)
- `GET /api/settings` - Get all settings
- `GET /manifest.json` - PWA Manifest
- `GET /admin/manifest.json` - PWA Manifest for Admin

## Authentication
- `POST /api/auth/login` - Login username/password

## Dashboard
- `GET /api/dashboard/stats` - Get sales summary, debt summary, slow moving products

## Products
- `GET /api/products` - List products with filters (search, category_id, low_stock, limit, offset)
- `GET /api/products/search?q={query}` - Quick search by name or barcode
- `GET /api/products/:id` - Get detail
- `GET /api/product/:barcode` - Get detail by barcode
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product
- `GET /api/products/generate-barcode` - Generate next available barcode
- `GET /api/products/category/:id` - Get products by category
- `POST /api/products/:id/stock` - Quick stock adjustment
- `GET /api/products/slow-moving` - Get slow moving products list

## Categories
- `GET /api/categories` - List all
- `POST /api/categories` - Create new

## Transactions
- `GET /api/transactions` - List transactions (filters: status, date_from, date_to)
- `GET /api/transactions/:id` - Get detail with items and payment history
- `POST /api/transactions/:id/payment` - Add payment to transaction
- `GET /api/transactions/:id/payments` - Get payment history
- `POST /api/transactions/:id/void` - Void transaction (restocks items)

## Stock History
- `GET /api/stock-history` - Get stock trail (filters: productId, limit)

## Debts (Piutang)
- `GET /api/debts` - Get outstanding transactions (filters: overdue, search)
- `GET /api/debts/summary` - Get total outstanding and overdue count

## Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user detail
