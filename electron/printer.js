const { BrowserWindow } = require('electron');
const { printHtml, detectPrinterType } = require('./print-handler');

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function getEffectiveTimezoneOffsetHours(settings = {}) {
  const systemOffsetHours = -(new Date().getTimezoneOffset() / 60);
  const raw = settings.timezone_offset;
  if (raw !== undefined && raw !== null && String(raw) !== '' && String(raw) !== 'auto') {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      // Guard legacy value "0" (UTC) setelah opsi timezone disembunyikan.
      // Jika timezone sistem bukan UTC, pakai timezone sistem agar waktu struk tidak bergeser.
      if (parsed === 0 && systemOffsetHours !== 0) return systemOffsetHours;
      return parsed;
    }
  }
  return systemOffsetHours;
}

function parseUtcDateLike(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input !== 'string') return null;

  // SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:mm:ss" (UTC)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
    return new Date(input.replace(' ', 'T') + 'Z');
  }

  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatReceiptDate(createdAt, settings = {}) {
  const parsed = parseUtcDateLike(createdAt);
  if (!parsed) return new Date().toLocaleString('id-ID');

  const offsetHours = getEffectiveTimezoneOffsetHours(settings);
  const local = new Date(parsed.getTime() + offsetHours * 3600000);

  const dd = String(local.getUTCDate()).padStart(2, '0');
  const mm = String(local.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = local.getUTCFullYear();
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mi = String(local.getUTCMinutes()).padStart(2, '0');
  const ss = String(local.getUTCSeconds()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function parseTemplate(settings) {
  const defaults = {
    sections: {
      logo: false,
      store_name: true,
      store_address: true,
      store_phone: true,
      invoice_info: true,
      tax_line: true,
      discount_line: true,
      payment_info: true,
      header_text: true,
      footer_text: true
    },
    font_size: 'medium'
  };

  try {
    const tmpl = JSON.parse(settings.receipt_template || '{}');
    return {
      sections: { ...defaults.sections, ...(tmpl.sections || {}) },
      font_size: tmpl.font_size || defaults.font_size
    };
  } catch {
    return defaults;
  }
}

function getFontSize(size) {
  // Font sizes diperbesar untuk printer thermal/dot-matrix
  // Font A (12x24) = ~13pt, Font B (9x17) = ~10pt
  switch (size) {
    case 'small': return '12px';  // Font B size
    case 'large': return '16px';  // Font A large
    default: return '14px';       // Font A normal (default)
  }
}

const receiptTemplates = require('./receipt_templates');

function generateReceiptHTML(transaction, settings) {
  const width = settings.receipt_width || '58';
  // CF = Continuous Form 9.5×11", printable width ~217mm (8.5" after tractor holes)
  // 
  // IMPORTANT: Gunakan PRINTABLE AREA, bukan kertas width!
  // C58BT 58mm: 384 dots / 203 DPI = ~48mm printable (bukan 58mm!)
  // HPRT 80mm: 640 dots / 203 DPI = ~80mm printable
  const printableWidthMm = width === 'cf' ? 217 : 
                           width === '58' ? 48 :  // C58BT printable area
                           width === '80' ? 76 :  // HPRT printable area (minus margin)
                           parseInt(width);
  const widthPx = Math.round(printableWidthMm * 3.78);

  let templateId = settings.receipt_template_id;

  if (!templateId) {
    if (width === '80') templateId = '80mm-1';
    else if (width === 'cf') templateId = 'cf-thermal-1'; // Use thermal-optimized template
    else templateId = '58mm-1';
  }

  // Validasi: pastikan prefix template sesuai dengan width yang dipilih
  const expectedPrefix = width === 'cf' ? 'cf-' : `${width}mm-`;
  if (templateId && !templateId.startsWith(expectedPrefix)) {
    if (width === '80') templateId = '80mm-1';
    else if (width === 'cf') templateId = 'cf-thermal-1';
    else templateId = '58mm-1';
  }

  const parsedTemplate = parseTemplate(settings);
  
  // Get print margin settings (in mm)
  // Untuk thermal printer, margin default lebih kecil agar tidak terpotong
  const marginTop = parseInt(settings.print_margin_top) || 5;
  const marginBottom = parseInt(settings.print_margin_bottom) || 5;
  const marginLeft = parseInt(settings.print_margin_left) || 5;
  const marginRight = parseInt(settings.print_margin_right) || 5;
  const printScale = parseInt(settings.print_scale) || 100;
  
  // Get line height and spacing settings
  const lineHeight = parseFloat(settings.print_line_height) || 1.4;
  const itemSpacing = settings.print_item_spacing || 'normal';
  
  // Calculate item spacing in pixels
  const itemSpacingMap = {
    'compact': '2px',
    'normal': '6px', 
    'relaxed': '12px'
  };
  const itemPadding = itemSpacingMap[itemSpacing] || itemSpacingMap['normal'];
  
  // Page break control settings (untuk menghemat kertas antar struk)
  const pageGap = settings.print_page_gap || 'compact';
  const minHeight = settings.print_min_height || 'auto';
  
  // Page break margin based on page_gap setting
  const pageBreakMargin = {
    'none': '0',
    'compact': '5mm',
    'normal': '15mm'
  }[pageGap] || '5mm';

  // Data preparation for template
  const data = {
    widthPx,
    fontSize: getFontSize(parsedTemplate.font_size),
    sections: parsedTemplate.sections,
    storeName: settings.store_name || 'My Store',
    storeAddress: settings.store_address || '',
    storePhone: settings.store_phone || '',
    headerText: settings.receipt_header || '',
    footerText: settings.receipt_footer || '',
    invoiceNumber: transaction.invoice_number,
    date: formatReceiptDate(transaction.created_at, settings),
    cashierName: transaction.cashier_name || '-',
    notes: transaction.payment_notes || '', // Cashier notes
    customerName: transaction.customer_name || '',
    customerAddress: transaction.customer_address || '',
    items: (transaction.items || []).map(item => ({
      name: item.product_name,
      qty: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })),
    subtotal: transaction.subtotal,
    taxAmount: transaction.tax_amount,
    discountAmount: transaction.discount_amount,
    total: transaction.total,
    amountPaid: transaction.amount_paid,
    changeAmount: transaction.change_amount,
    paymentMethod: transaction.payment_method,
    formatCurrency: formatCurrency,
    logoHTML: settings.doc_logo_html || ''
  };

  // Escape semua field string dari user/DB sebelum masuk ke template HTML
  data.storeName = escHtml(data.storeName);
  data.storeAddress = escHtml(data.storeAddress);
  data.storePhone = escHtml(data.storePhone);
  data.headerText = escHtml(data.headerText);
  data.footerText = escHtml(data.footerText);
  data.invoiceNumber = escHtml(data.invoiceNumber);
  data.date = escHtml(data.date);
  data.cashierName = escHtml(data.cashierName);
  data.notes = escHtml(data.notes);
  data.customerName = escHtml(data.customerName);
  data.customerAddress = escHtml(data.customerAddress);
  data.items = data.items.map(item => ({ ...item, name: escHtml(item.name) }));
  // logoHTML adalah raw HTML dari settings (intentional) — tidak di-escape,
  // namun receipt_logo di-escape untuk mencegah attribute injection
  if (!data.logoHTML && settings.receipt_logo) {
    data.logoHTML = `<div class="center" style="margin-bottom:4px;"><img src="${escHtml(settings.receipt_logo)}" style="max-width:80%;max-height:60px;" /></div>`;
  }

  const template = receiptTemplates.getTemplate(templateId);
  
  // Generate custom CSS based on user settings
  const customPrintCSS = `
    /* Page break control - menghemat kertas antar struk */
    @page { 
      margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm !important;
      size: auto;
    }
    
    body { 
      padding-top: 15mm !important;  /* Spasi jari untuk mudah mencabut struk */
      padding-bottom: 5mm !important; /* Safety margin agar tidak terpotong di bawah */
      line-height: ${lineHeight} !important;
      transform: scale(${printScale / 100});
      transform-origin: top left;
      ${minHeight !== 'auto' ? `min-height: ${minHeight};` : ''}
    }
    
    /* Page break dengan gap minimal antar struk */
    @media print {
      .page-break, hr, .divider, .divider-thick {
        page-break-after: always;
        margin-bottom: ${pageBreakMargin} !important;
      }
    }
    
    /* Item spacing for thermal templates */
    table.items tbody td { 
      padding-top: ${itemPadding} !important; 
      padding-bottom: ${itemPadding} !important; 
    }
    .item-row { 
      margin-bottom: ${itemPadding} !important; 
    }
    
    /* Compact page break untuk menghemat kertas */
    @media print {
      html, body {
        page-break-before: avoid;
        page-break-after: avoid;
      }
      
      /* Prevent content from being cut off mid-element */
      table, tr, td, .item-row, .header, .footer {
        page-break-inside: avoid;
      }
      
      /* Force page break dengan gap minimal */
      body::after {
        content: "";
        display: block;
        height: ${pageBreakMargin};
        page-break-after: always;
      }
    }
  `;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="only light">
  <style>
    /* Force light mode — prevent Chromium auto-dark from inverting receipt colors */
    html { box-sizing: border-box; }
    *, *:before, *:after { box-sizing: inherit; }
    html, body { background: white !important; color: black !important; margin: 0; word-wrap: break-word; overflow-wrap: break-word; }
    /* Custom print settings from user */
    ${customPrintCSS}
  </style>
</head>
<body>
  ${template.render(data)}
</body>
</html>`;
}

function generateReceiptHTMLWithSettings(transaction, customSettings) {
  return generateReceiptHTML(transaction, customSettings);
}

async function printReceipt(transaction, settings) {
  try {
    const html = generateReceiptHTML(transaction, settings);
    const printerName = settings.printer_name || '';
    
    // Deteksi tipe printer berdasarkan receipt_width settings
    let printerType = '58mm'; // default
    if (settings.receipt_width === 'cf' || settings.receipt_width === 'CF') {
      printerType = 'cf';
    } else if (settings.receipt_width === '80') {
      printerType = '80mm';
    } else if (settings.receipt_width === '58') {
      printerType = '58mm';
    } else if (printerName) {
      // Fallback: deteksi dari nama printer
      printerType = detectPrinterType(printerName);
    }
    
    console.log(`[Print] Template: ${settings.receipt_template_id || 'default'}, Width: ${settings.receipt_width}, Type: ${printerType}`);

    // Gunakan print handler yang baru dengan pageSize eksplisit dan timeout
    const result = await printHtml({
      html,
      deviceName: printerName,
      printerType: printerType,
      silent: true,
      windowTitle: 'Receipt Print'
    });

    return result;
    
  } catch (err) {
    console.error('[Print] Error:', err.message);
    return { success: false, error: err.message };
  }
}

function getPrinters(mainWindow) {
  return mainWindow.webContents.getPrintersAsync();
}

function openCashDrawer(printerName) {
  return { success: true, message: 'Cash drawer command sent (if supported by printer)' };
}

function generateReportHTML(title, storeName, dateRange, bodyHTML) {
  const now = new Date().toLocaleString('id-ID');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 20px 30px;
    }
    .report-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    .report-header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .report-header h2 {
      font-size: 14px;
      font-weight: 600;
      color: #444;
      margin-bottom: 4px;
    }
    .report-header .date-range {
      font-size: 11px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table th, table td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    table th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      color: #555;
    }
    table td { font-size: 11px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-cards {
      display: flex;
      gap: 15px;
      margin: 15px 0;
    }
    .summary-card {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .summary-card .label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .summary-card .value {
      font-size: 16px;
      font-weight: bold;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      margin: 20px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    .report-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9px;
      color: #999;
    }
    .bar-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
    }
    .bar-label { width: 80px; font-size: 11px; text-align: right; }
    .bar-track { flex: 1; background: #eee; height: 18px; border-radius: 3px; overflow: hidden; }
    .bar-fill { background: #3b82f6; height: 100%; border-radius: 3px; }
    .bar-value { width: 100px; font-size: 11px; }
    .font-bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>${escHtml(storeName)}</h1>
    <h2>${escHtml(title)}</h2>
    <div class="date-range">${escHtml(dateRange)}</div>
  </div>
  ${bodyHTML}
  <div class="report-footer">
    Dicetak pada ${now}
  </div>
</body>
</html>`;
}

function getReceiptTemplates() {
  return receiptTemplates.getAllTemplates();
}

module.exports = { generateReceiptHTML, generateReceiptHTMLWithSettings, generateReportHTML, printReceipt, getPrinters, openCashDrawer, formatCurrency, getReceiptTemplates };
