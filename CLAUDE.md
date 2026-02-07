# POS Cashier App

Desktop POS untuk toko retail Indonesia. Electron + React + SQLite.

## Tech Stack
- **Main**: Electron, sql.js, bcryptjs, jsonwebtoken
- **Renderer**: React 18, Vite, TailwindCSS
- **Other**: xlsx, quagga2, jsbarcode, recharts

## Structure
```
electron/     # Main process: IPC, DB, printing
src/          # Renderer: React pages & components
price-checker/# PWA untuk cek harga (port 3001)
```

## Commands
```bash
npm run dev           # Development
npm run build:portable # Build .exe portable
```

## Global Rules
- UI text: Bahasa Indonesia
- Code identifiers: English
- IPC channel: `entity:action` (e.g., `products:getAll`)
- Renderer calls: `window.api.<method>()`
- Roles: `admin`, `supervisor`, `cashier`

## Nested Docs
- `electron/CLAUDE.md` - Database & IPC patterns
- `src/components/CLAUDE.md` - UI component standards
- `src/pages/CLAUDE.md` - Page structure patterns
