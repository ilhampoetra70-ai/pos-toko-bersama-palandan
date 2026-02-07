# Electron Main Process

## Files
- `main.js` - Window, IPC handlers
- `database.js` - SQLite schema & queries
- `preload.js` - contextBridge API
- `printer.js` - Receipt HTML generation
- `api-server.js` - Price checker REST API
- `auth.js` - Login, JWT, password hash

## Database Helpers
```js
all(sql, params)  // SELECT multiple → Object[]
get(sql, params)  // SELECT single → Object | null
run(sql, params)  // INSERT/UPDATE/DELETE → { lastInsertRowid, changes }
```

## IPC Pattern
```js
// preload.js
methodName: (args) => ipcRenderer.invoke('entity:action', args)

// main.js
ipcMain.handle('entity:action', async (e, args) => { ... })
```

## Error Return
```js
return { success: false, error: 'message' }
return { success: true, data: result }
```

## Tables
`users`, `categories`, `products`, `transactions`, `transaction_items`, `settings`, `stock_audit_log`, `payment_history`
