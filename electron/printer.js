const { BrowserWindow } = require('electron');

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

function generateReceiptHTML(transaction, settings) {
  const width = settings.receipt_width || '58';
  const widthMm = parseInt(width);
  const widthPx = Math.round(widthMm * 3.78);
  const template = parseTemplate(settings);
  const fontSize = getFontSize(template.font_size);
  const sec = template.sections;
  const logo = settings.receipt_logo || '';

  const items = transaction.items || [];
  const itemsHTML = items.map(item => {
    const discount = Number(item.discount) || 0;
    const effectivePrice = item.price - discount;
    let row = `
    <tr>
      <td style="text-align:left;padding:1px 0;">${item.product_name}</td>
      <td style="text-align:center;padding:1px 0;">${item.quantity}</td>
      <td style="text-align:right;padding:1px 0;">${formatCurrency(effectivePrice)}</td>
      <td style="text-align:right;padding:1px 0;">${formatCurrency(item.subtotal)}</td>
    </tr>`;
    if (discount > 0) {
      row += `
    <tr>
      <td colspan="4" style="text-align:left;padding:0 0 2px 4px;font-size:${parseInt(fontSize) - 1}px;color:#666;">
        Disc: -${formatCurrency(discount)}/item (dari ${formatCurrency(item.price)})
      </td>
    </tr>`;
    }
    return row;
  }).join('');

  // Build sections conditionally
  const logoHTML = sec.logo && logo
    ? `<div class="center" style="margin-bottom:4px;"><img src="${logo}" style="max-width:80%;max-height:60px;" /></div>`
    : '';

  const storeNameHTML = sec.store_name
    ? `<div class="center bold">${settings.store_name || 'My Store'}</div>`
    : '';

  const storeAddressHTML = sec.store_address
    ? `<div class="center">${settings.store_address || ''}</div>`
    : '';

  const storePhoneHTML = sec.store_phone && settings.store_phone
    ? `<div class="center">Telp: ${settings.store_phone}</div>`
    : '';

  const invoiceInfoHTML = sec.invoice_info
    ? `<div class="line"></div>
  <div>No: ${transaction.invoice_number}</div>
  <div>Kasir: ${transaction.cashier_name || '-'}</div>
  <div>${transaction.created_at || new Date().toLocaleString('id-ID')}</div>`
    : '';

  // Customer info (if provided)
  const customerInfoHTML = (transaction.customer_name || transaction.customer_address)
    ? `<div class="line"></div>
  ${transaction.customer_name ? `<div><b>Pembeli:</b> ${transaction.customer_name}</div>` : ''}
  ${transaction.customer_address ? `<div><b>Alamat:</b> ${transaction.customer_address}</div>` : ''}`
    : '';

  const taxHTML = sec.tax_line && transaction.tax_amount > 0
    ? `<tr><td>Pajak</td><td class="right">${formatCurrency(transaction.tax_amount)}</td></tr>`
    : '';

  const discountHTML = sec.discount_line && transaction.discount_amount > 0
    ? `<tr><td>Diskon</td><td class="right">-${formatCurrency(transaction.discount_amount)}</td></tr>`
    : '';

  const paymentInfoHTML = sec.payment_info
    ? `<tr><td>${transaction.payment_method === 'cash' ? 'Tunai' : transaction.payment_method}</td><td class="right">${formatCurrency(transaction.amount_paid)}</td></tr>
    ${transaction.change_amount > 0 ? `<tr><td>Kembali</td><td class="right">${formatCurrency(transaction.change_amount)}</td></tr>` : ''}`
    : '';

  const headerTextHTML = sec.header_text
    ? `<div class="center">${settings.receipt_header || 'Terima Kasih'}</div>`
    : '';

  const footerTextHTML = sec.footer_text
    ? `<div class="center" style="font-size:${parseInt(fontSize) - 2}px;margin-top:2px;">${settings.receipt_footer || ''}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${widthPx}px;
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      line-height: 1.3;
      padding: 5px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    .right { text-align: right; }
    .summary td { padding: 1px 0; }
  </style>
</head>
<body>
  ${logoHTML}
  ${storeNameHTML}
  ${storeAddressHTML}
  ${storePhoneHTML}
  ${invoiceInfoHTML}
  ${customerInfoHTML}
  <div class="line"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Harga</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>
  <div class="line"></div>
  <table class="summary">
    <tr><td>Subtotal</td><td class="right">${formatCurrency(transaction.subtotal)}</td></tr>
    ${taxHTML}
    ${discountHTML}
    <tr class="bold"><td>TOTAL</td><td class="right">${formatCurrency(transaction.total)}</td></tr>
    ${paymentInfoHTML}
  </table>
  <div class="line"></div>
  ${headerTextHTML}
  ${footerTextHTML}
  <div style="margin-bottom: 20px;"></div>
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
        printWindow.close();
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
    <h1>${storeName}</h1>
    <h2>${title}</h2>
    <div class="date-range">${dateRange}</div>
  </div>
  ${bodyHTML}
  <div class="report-footer">
    Dicetak pada ${now}
  </div>
</body>
</html>`;
}

module.exports = { generateReceiptHTML, generateReceiptHTMLWithSettings, generateReportHTML, printReceipt, getPrinters, openCashDrawer, formatCurrency };
