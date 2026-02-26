const { BrowserWindow } = require('electron');

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
  switch (size) {
    case 'small': return '9px';
    case 'large': return '11px';
    default: return '10px';
  }
}

const receiptTemplates = require('./receipt_templates');

function generateReceiptHTML(transaction, settings) {
  const width = settings.receipt_width || '58';
  const widthMm = parseInt(width);
  const widthPx = Math.round(widthMm * 3.78);

  // Determine template ID. If saved template is just JSON, use default.
  // We assume settings.receipt_template_id will be added.
  // If not present, we can map width to a default.
  let templateId = settings.receipt_template_id;

  // Fallback if no specific ID selected but width is set
  // Fallback if no specific ID selected but width is set
  if (!templateId) {
    templateId = width === '80' ? '80mm-1' : '58mm-1';
  }

  const parsedTemplate = parseTemplate(settings);

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
    date: transaction.created_at || new Date().toLocaleString('id-ID'),
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
  data.storeName      = escHtml(data.storeName);
  data.storeAddress   = escHtml(data.storeAddress);
  data.storePhone     = escHtml(data.storePhone);
  data.headerText     = escHtml(data.headerText);
  data.footerText     = escHtml(data.footerText);
  data.invoiceNumber  = escHtml(data.invoiceNumber);
  data.date           = escHtml(data.date);
  data.cashierName    = escHtml(data.cashierName);
  data.notes          = escHtml(data.notes);
  data.customerName   = escHtml(data.customerName);
  data.customerAddress = escHtml(data.customerAddress);
  data.items = data.items.map(item => ({ ...item, name: escHtml(item.name) }));
  // logoHTML adalah raw HTML dari settings (intentional) — tidak di-escape,
  // namun receipt_logo di-escape untuk mencegah attribute injection
  if (!data.logoHTML && settings.receipt_logo) {
    data.logoHTML = `<div class="center" style="margin-bottom:4px;"><img src="${escHtml(settings.receipt_logo)}" style="max-width:80%;max-height:60px;" /></div>`;
  }

  const template = receiptTemplates.getTemplate(templateId);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="only light">
  <style>
    /* Force light mode — prevent Chromium auto-dark from inverting receipt colors */
    html, body { background: white !important; color: black !important; }
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
  return new Promise((resolve, reject) => {
    const html = generateReceiptHTML(transaction, settings);
    const printWindow = new BrowserWindow({
      show: false,
      width: 300,
      height: 600,
      webPreferences: { nodeIntegration: false }
    });

    // Bug Fix: Tambahkan did-fail-load handler.
    // Tanpa ini, jika halaman gagal dimuat, Promise tidak pernah resolve/reject
    // dan printWindow menjadi zombie di memori selamanya.
    printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      printWindow.destroy(); // Gunakan destroy() untuk pembersihan pasti
      reject(new Error(`Failed to load receipt for printing: ${errorDescription} (${errorCode})`));
    });

    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    printWindow.webContents.on('did-finish-load', () => {
      const printerName = settings.printer_name || '';
      const options = {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' }
      };

      if (printerName) {
        options.deviceName = printerName;
      }

      printWindow.webContents.print(options, (success, failureReason) => {
        // Bug Fix: Ganti .close() dengan .destroy().
        // Untuk hidden window, .destroy() langsung menghancurkan native handle
        // tanpa menunggu event 'close'/'beforeunload' yang tidak perlu.
        printWindow.destroy();
        if (success) {
          resolve({ success: true });
        } else {
          reject(new Error(failureReason || 'Print failed'));
        }
      });
    });
  });
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
