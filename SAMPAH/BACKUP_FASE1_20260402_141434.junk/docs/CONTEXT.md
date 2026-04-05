# POS Cashier Project Context
**High Density Documentation for AI Context Optimization**

## Project Structure
- **Root**: `D:\Ilham\Documents\Proyek\pos-app` (Electron Main Process)
- **Frontend**: `dist-renderer` (Built from Vite, source likely in `src/` but currently compiled)
- **Database**: `electron/database.js` (Better-SQLite3 wrapper, Business Logic Layer)
- **API Server**: `electron/api-server.js` (Express.js, REST API for Frontend & PWA)
- **Admin App**: `../pos-admin` (Vite PWA, source in `src/`, serves as mobile admin)
- **Price Checker**: `price-checker/` (Static HTML/JS PWA)

## Key Architecture
1.  **Hybrid Architecture**: Input is via Electron (Desktop) OR Web (Local Network).
2.  **Shared Database**: Both Electron App and API Server write to the same `pos-cashier.db` file (WAL mode enabled for concurrency).
3.  **Timezone Handling**:
    -   Database stores dates in **UTC/ISO string** or `DATETIME DEFAULT CURRENT_TIMESTAMP`.
    -   Reporting logic (`database.js`) respects `timezone_offset` setting for "Today" calculations.
4.  **Stock Management**:
    -   `products.stock` is the source of truth.
    -   `stock_trail` table records EVERY change (audit trail).
    -   `stock_audit_log` is a legacy table, still populated for backward compatibility.

## Core Files & Responsibility
-   [SCHEMA.sql](SCHEMA.sql) - Database Tables & Indexes.
-   [API_MAP.md](API_MAP.md) - REST API Endpoints.
-   `electron/database.js` - **HEAVY LOGIC**. Contains all SQL queries, transaction handling, and report generation. **Read this first for logic bugs.**
-   `electron/api-server.js` - **Router**. Delegates logic to `database.js`. Handles HTTP request parsing and response formatting.

## Recent Fixes (Known State)
-   **Login**: `users` table has `active` column (added via migration).
-   **Stock Report**: `stock_trail` includes `user_name` snapshot to avoid "Unknown" users if user is deleted later.
-   **Timezone**: `getLocalDayRangeUTC` in `database.js` uses `settings.timezone_offset` to calculate day boundaries.
-   **Barcode**: Caching disabled for `generate-barcode` to prevent duplicate assignments.

## Cloudflare Tunnel
-   Tools located in `pos-app` root (or Portable folder).
-   Script: `start_tunnel.bat` runs `cloudflared.exe` in background (`Headless`).
