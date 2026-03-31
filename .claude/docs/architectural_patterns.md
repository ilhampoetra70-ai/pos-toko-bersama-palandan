# Architectural Patterns

## IPC Communication Pattern

All renderer-to-main communication uses Electron's `contextBridge` + `ipcRenderer.invoke` / `ipcMain.handle` pair. Never use `ipcRenderer.send`.

**Channel naming**: `entity:action` format (e.g., `products:getAll`, `transactions:create`).

- **Preload exposes API**: `electron/preload.js:3-61` — every method maps to a single IPC channel
- **Main registers handlers**: `electron/main.js:64-347` — grouped by entity with comment headers
- **Renderer calls API**: via `window.api.<method>()` (e.g., `window.api.getProducts(filters)`)

When a handler needs data integrity (e.g., receipt printing), always fetch fresh data from the database in the main process rather than trusting what the renderer sends. See `electron/main.js:124-147` for the pattern.

**Error return convention for IPC**: handlers that can fail return `{ success: boolean, error?: string }`. See `electron/main.js:124-136` (print), `electron/main.js:149-168` (upload logo), `electron/main.js:175-214` (excel export).

## Database Helper Pattern

All SQL access goes through three helpers in `electron/database.js:52-83`:

| Helper | Returns | Use for |
|--------|---------|---------|
| `all(sql, params)` | `Object[]` | SELECT multiple rows |
| `get(sql, params)` | `Object \| null` | SELECT single row |
| `run(sql, params)` | `{ lastInsertRowid, changes }` | INSERT / UPDATE / DELETE |

`run()` auto-saves the database to disk after every mutation (`database.js:78`). An interval also saves every 5 seconds (`database.js:48`).

**Dynamic filter queries**: Build a base query with `WHERE 1=1`, then conditionally append `AND` clauses while pushing to a `params[]` array. See `database.js:262-280` (getProducts), `database.js:408-433` (getTransactions).

**Compound operations**: For multi-step mutations (e.g., creating a transaction with items and stock updates), call `run()` sequentially — there is no explicit transaction/rollback mechanism. See `database.js:379-399`.

## Settings as Key-Value Store

Settings are stored in a flat `settings(key, value)` table. `getSettings()` at `database.js:450-455` returns all rows as a single `{ [key]: value }` object. All values are strings — callers must parse numbers/booleans (e.g., `settings.tax_enabled === 'true'` at `src/pages/CashierPage.jsx:115`).

Default settings are seeded on first run via `database.js:169-201`.

## React State Management

### Auth via Context
Single global context: `src/contexts/AuthContext.jsx:1-59`. Provides `user`, `token`, `login()`, `logout()`, `hasRole()`. Wraps the app at `src/main.jsx:5-6`. JWT stored in `localStorage` under key `pos_token`.

### Local State per Page
Each page manages its own data, filters, form, and modal states. No global store (Redux, Zustand, etc.). State categories:

- **Data**: `products`, `transactions`, `stats` — fetched on mount
- **UI toggles**: `showForm`, `showPayment`, `showReceipt` — control modal visibility
- **Form data**: `form`, `catForm` — object state for create/edit forms
- **Transient**: `search`, `filterCat`, `discount` — ephemeral user input

### Fetch-on-Mount Pattern
Every page loads data in a `useEffect(() => { loadX(); }, [])` on mount. Dependent fetches re-trigger via dependency arrays (e.g., `CashierPage.jsx:30-32` re-fetches products when search/filter changes). Parallel fetches use `Promise.all` (e.g., `CashierPage.jsx:35-38`).

## Modal Pattern

All modals follow the same structure:

1. Parent owns a boolean state (`showX`) and a toggle handler
2. Conditionally render: `{showX && <Modal ... onClose={() => setShowX(false)} />}`
3. Modal root: `<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">`
4. Inner card: `<div className="bg-white rounded-xl p-6 ...">`

Examples: `CashierPage.jsx:300-341` (PaymentModal, BarcodeScanner, ReceiptPreview), `ProductsPage.jsx:243-394`, `UsersPage.jsx:70-103`.

## Form Submit Pattern

1. `handleSubmit` is async, called on form submit or button click
2. Validate inputs, set error state if invalid
3. Call `window.api.createX()` or `window.api.updateX()` based on `editing` state
4. On success: reset form, close modal, reload list data
5. On error: `alert()` or set error message state

See `ProductsPage.jsx:89-120`, `UsersPage.jsx:31-49`, `SettingsPage.jsx:28-39`.

## Role-Based Access Control

`hasRole(...roles)` from AuthContext checks if the current user's role is in the allowed list. Used for:

- **Route protection**: `src/App.jsx:36-42` — admin/supervisor-only routes
- **UI gating**: `ProductsPage.jsx:167` (`canEdit`), `TransactionsPage.jsx:99` (void button)
- **Data scoping**: `TransactionsPage.jsx:17` — cashiers only see their own transactions

Three roles: `admin`, `supervisor`, `cashier` (defined in users table CHECK constraint, `database.js:92`).

## Receipt Generation Pipeline

1. **Template stored as JSON** in settings key `receipt_template` — parsed at `electron/printer.js:7-33`
2. **Sections toggled** via boolean flags in template (logo, store info, tax, payment, etc.)
3. **HTML generated** server-side in `printer.js:43-174` — monospace font, fixed width for thermal printers
4. **Preview**: rendered via `dangerouslySetInnerHTML` in `ReceiptPreview.jsx:44-48`
5. **Print**: hidden `BrowserWindow` loads HTML as data URL, prints silently — `printer.js:180-214`
6. **Template editor**: live preview with 300ms debounce — `ReceiptTemplateEditor.jsx:102-109`
