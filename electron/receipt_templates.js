const templates = {
  // ==========================================
  // 58mm Templates
  // ==========================================
  '58mm-1': {
    name: 'Simple (Default)',
    width: '58mm',
    render: (data) => `
      <style>
        body { font-family: 'Courier New', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 5px; line-height: 1.3; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed black; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        td { vertical-align: top; padding: 2px 0; }
      </style>
      
      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name ? `<div class="center bold" style="margin-bottom: 4px;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone ? `<div class="center">${data.storePhone}</div>` : ''}
      ${data.sections.header_text ? `<div class="center" style="margin-top: 5px; font-style: italic;">${data.headerText}</div>` : ''}
      <div class="line"></div>
      ${data.sections.invoice_info ? `
      <div>${data.date}</div>
      <div>No: ${data.invoiceNumber}</div>
      <div>Kasir: ${data.cashierName}</div>
      ${data.notes ? `<div style="font-style: italic; margin-top: 4px;">Catatan: ${data.notes}</div>` : ''}
      ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      ${data.customerAddress ? `<div>Alamat: ${data.customerAddress}</div>` : ''}
      <div class="line"></div>
      ` : ''}
      <table>
        ${data.items.map(item => `
          <tr><td colspan="3">${item.name}</td></tr>
          <tr>
            <td>${item.qty} x ${data.formatCurrency(item.price)}</td>
            <td class="right">${data.formatCurrency(item.subtotal)}</td>
          </tr>
        `).join('')}
      </table>
      <div class="line"></div>
      <table>
        <tr><td>Total</td><td class="right bold">${data.formatCurrency(data.total)}</td></tr>
        ${data.sections.payment_info ? (data.paymentMethod === 'cash' ? `<tr><td>Tunai</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
        <tr><td>Kembali</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>` : '') : ''}
      </table>
      <div class="line"></div>
      ${data.sections.footer_text ? `<div class="center" style="margin-top: 5px;">${data.footerText}</div>` : ''}
    `
  },
  '58mm-2': {
    name: 'Compact',
    width: '58mm',
    render: (data) => `
      <style>
        body { font-family: sans-serif; font-size: ${parseInt(data.fontSize) - 1}px; width: ${data.widthPx}px; padding: 2px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px solid black; margin: 3px 0; }
        table { width: 100%; }
      </style>
      
      ${data.sections.store_name ? `<div class="center bold" style="font-size: 1.2em; margin-bottom: 2px;">${data.storeName}</div>` : ''}
      ${data.sections.header_text ? `<div class="center" style="font-size: 0.9em; margin-bottom: 4px;">${data.headerText}</div>` : ''}
      <div class="line"></div>
      ${data.sections.invoice_info ? `
      <div style="display:flex; justify-content:space-between">
        <span>${data.date.split(' ')[1]}</span>
        <span>${data.invoiceNumber}</span>
      </div>
      <div>Kasir: ${data.cashierName}</div>
      ${data.notes ? `<div style="font-style: italic;">Catatan: ${data.notes}</div>` : ''}
      ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      <div class="line"></div>
      ` : ''}
      <table>
        ${data.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td class="right">${item.qty}</td>
            <td class="right">${data.formatCurrency(item.subtotal)}</td>
          </tr>
        `).join('')}
      </table>
      <div class="line"></div>
      <div style="display:flex; justify-content:space-between; font-size:1.1em" class="bold">
        <span>TOTAL</span>
        <span>${data.formatCurrency(data.total)}</span>
      </div>
    `
  },
  '58mm-3': {
    name: 'Modern',
    width: '58mm',
    render: (data) => `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 10px; line-height: 1.4; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        /* Dot-Matrix friendly: No inverted colors, use borders instead */
        .header { border: 2px solid #000; padding: 8px; text-align: center; border-radius: 4px; margin-bottom: 10px; font-weight: bold; }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .item-name { flex: 1; font-weight: 500; margin-bottom: 2px; }
        .item-price { text-align: right; }
        .total-box { border: 2px solid #000; padding: 8px; margin-top: 10px; border-radius: 4px; }
      </style>
      
      ${data.sections.store_name ? `
      <div class="header">
        <div style="font-size: 1.2em">${data.storeName}</div>
      </div>
      ` : ''}
      
      ${data.sections.header_text ? `<div class="center" style="margin-bottom: 10px; font-style: italic;">${data.headerText}</div>` : ''}

      ${data.sections.invoice_info ? `
      <div class="center" style="font-size: 0.8em; color: #333; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
        ${data.date} | ${data.cashierName}
        ${data.notes ? `<br/><i>Catatan: ${data.notes}</i>` : ''}
        ${data.customerName ? `<br/>Kpd: ${data.customerName}` : ''}
      </div>
      ` : ''}
      
      ${data.items.map(item => `
        <div style="margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
          <div class="item-name">${item.name}</div>
          <div class="item-row" style="font-size: 0.9em;">
            <span>${item.qty} x ${data.formatCurrency(item.price)}</span>
            <span>${data.formatCurrency(item.subtotal)}</span>
          </div>
        </div>
      `).join('')}
      
      <div class="total-box">
        <div class="item-row bold" style="font-size: 1.1em;">
          <span>TOTAL</span>
          <span>${data.formatCurrency(data.total)}</span>
        </div>
      </div>
      ${data.sections.footer_text ? `<div class="center" style="margin-top: 10px; font-style: italic;">${data.footerText}</div>` : ''}
    `
  },
  '58mm-4': { name: 'Classic (Dashed)', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-5': { name: 'Bold Header', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-6': { name: 'Minimalist', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-7': { name: 'Retro', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-8': { name: 'Detailed', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder

  // ==========================================
  // 80mm Templates
  // ==========================================
  '80mm-1': {
    name: 'Standard 80mm',
    width: '80mm',
    render: (data) => `
      <style>
        body { font-family: 'Courier New', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 10px; line-height: 1.4; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed black; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        th { border-bottom: 1px solid black; text-align: left; padding: 4px 0; }
        td { padding: 4px 0; }
      </style>
      
      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name ? `<div class="center bold" style="font-size: 1.2em; margin-bottom: 5px;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone ? `<div class="center">${data.storePhone}</div>` : ''}
      ${data.sections.header_text ? `<div class="center" style="margin-top: 10px; font-style: italic;">${data.headerText}</div>` : ''}
      <br/>
      ${data.sections.invoice_info ? `
      <div style="display:flex; justify-content:space-between;">
        <span>Faktur: ${data.invoiceNumber}</span>
        <span>Tanggal: ${data.date}</span>
      </div>
      <div>Kasir: ${data.cashierName}</div>
      ${data.notes ? `<div style="font-style: italic; margin-top: 4px;">Catatan: ${data.notes}</div>` : ''}
      ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      ${data.customerAddress ? `<div>Alamat: ${data.customerAddress}</div>` : ''}
      <div class="line"></div>
      ` : ''}
      <table>
        <thead>
          <tr>
            <th width="40%">Item</th>
            <th width="20%" class="center">Qty</th>
            <th width="20%" class="right">Harga</th>
            <th width="20%" class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="center">${item.qty}</td>
              <td class="right">${data.formatCurrency(item.price)}</td>
              <td class="right">${data.formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <div style="display:flex; justify-content:flex-end;">
        <table style="width: 50%">
          <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
          ${data.sections.tax_line ? `<tr><td>Pajak</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
          ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
          <tr class="bold" style="font-size:1.1em"><td>TOTAL</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
        </table>
      </div>
      ${data.sections.footer_text ? `<div class="center" style="margin-top:20px;">${data.footerText}</div>` : ''}
    `
  },
  '80mm-2': { name: 'Corporate', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-3': { name: 'Restaurant', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-4': { name: 'Modern Grid', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-5': { name: 'Big Text', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-6': { name: 'Compact 80', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-7': { name: 'Detailed List', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
  '80mm-8': { name: 'Minimal 80', width: '80mm', render: (data) => templates['80mm-1'].render(data) }, // Placeholder
};

// Fill in placeholders with variations
const createVariation = (baseKey, overrides) => {
  return {
    ...templates[baseKey],
    render: (data) => {
      let html = templates[baseKey].render(data);
      // Simple string replacements to create variations without duplicating full code
      if (overrides.css) html = html.replace('</style>', `${overrides.css}</style>`);
      return html;
    },
    ...overrides
  };
};

// 58mm Variations
templates['58mm-4'] = createVariation('58mm-1', { name: 'Big Header', css: '.center.bold { font-size: 1.5em; text-transform: uppercase; }' });
templates['58mm-5'] = createVariation('58mm-1', { name: 'Centered Items', css: 'td { text-align: center; } .right { text-align: center; }' });
templates['58mm-6'] = createVariation('58mm-2', { name: 'Boxed Total', css: '.bold { border: 1px solid black; padding: 5px; display: block; margin-top: 5px; }' });
templates['58mm-7'] = createVariation('58mm-1', { name: 'Eco (Small)', css: 'body { font-size: 9px; } .line { border-top: 1px dotted #ccc; }' });
templates['58mm-8'] = createVariation('58mm-3', { name: 'Outlined (Formal)', css: '.header { border: 2px solid #000; background: #fff; color: #000; } .total-box { border: 2px solid #000; } body { border: 1px solid #ddd; padding: 5px; }' });

// 80mm Variations
templates['80mm-2'] = createVariation('80mm-1', { name: 'Corporate', css: 'body { font-family: "Times New Roman", serif; } .bold { font-family: Arial, sans-serif; }' });
templates['80mm-3'] = createVariation('80mm-1', { name: 'Restaurant (Centered)', css: 'table { text-align: center; } th, td, .right { text-align: center; }' });
templates['80mm-4'] = createVariation('80mm-1', { name: 'Striped', css: 'tr:nth-child(even) { background-color: #eee; }' });
templates['80mm-5'] = createVariation('80mm-1', { name: 'Large Text', css: 'body { font-size: 14px; }' });
templates['80mm-6'] = createVariation('80mm-1', { name: 'Boxed', css: 'body { border: 1px solid black; min-height: 500px; padding: 15px; }' });
templates['80mm-7'] = createVariation('80mm-1', { name: 'Elegant', css: '.line { border-top: 1px double black; border-bottom: 2px solid black; height: 3px; }' });
templates['80mm-8'] = createVariation('80mm-1', { name: 'Minimal', css: '.line { display: none; } th { border-bottom: 2px solid black; }' });


module.exports = {
  getTemplate: (id) => templates[id] || templates['58mm-1'],
  getAllTemplates: () => Object.entries(templates).map(([id, t]) => ({ id, name: t.name, width: t.width }))
};
