# Fix Error: Cannot find module './receipt_templates_58mm_80style'

## Masalah
Error: `Cannot find module './receipt_templates_58mm_80style'`

## Penyebab
File `receipt_templates_58mm_80style.js` sudah dihapus karena template sudah diintegrasikan ke `receipt_templates.js`, tetapi statement `require()` masih ada.

## Solusi
Menghapus baris require yang merujuk ke file yang sudah dihapus:

```javascript
// DIHAPUS:
const { templates58mm80Style } = require('./receipt_templates_58mm_80style');

// DIUPDATE:
Object.assign(templates, thermalTemplates);
// (templates58mm80Style dihapus dari merge)
```

## Status
✅ FIXED - Semua template 58mm (12 template) berhasil dimuat:
- 58mm-1 s/d 58mm-12 (semua dengan layout 4 kolom)
- cf-1 s/d cf-6 dan cf-thermal-1/2
- 80mm-1 s/d 80mm-8

Total: 28 template aktif
