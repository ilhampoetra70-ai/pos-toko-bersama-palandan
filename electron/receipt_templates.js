const templates = {
  // ==========================================
  // 58mm Templates - Optimized for C58BT 58mm
  // Resolution: 203 DPI, 384 dots width
  // Format: 4-COLUMN LAYOUT (Item | Qty | Harga | Total)
  // ==========================================
  
  '58mm-1': {
    name: 'Simple (C58BT Optimized)',
    width: '58mm',
    render: (data) => `
      <style>
        /* C58BT 58mm Optimized: 203 DPI, thermal direct, 384 dots */
        body { 
          font-family: 'Courier New', 'Courier', monospace; 
          font-size: 12px;  /* Optimal for C58BT 58mm (384 dots) */
          width: ${data.widthPx}px; 
          padding: 3px 4px;  /* Minimal horizontal padding untuk maksimalkan printable area 48mm */
          padding-top: 15mm;  /* Spasi jari di atas header */
          line-height: 1.25;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed black; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { 
          border-bottom: 1px solid black; 
          text-align: left; 
          padding: 3px 2px;
          font-size: 0.85em;
        }
        td { 
          padding: 2px 2px;
          vertical-align: top;
          font-size: 0.9em;
          border-bottom: 1px dashed #000;
        }
        th.center, td.center { text-align: center; }
        th.right, td.right { text-align: right; }
      </style>
      
      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name ? `<div class="center bold" style="margin-bottom: 4px;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone ? `<div class="center">${data.storePhone}</div>` : ''}
      ${data.sections.header_text ? `<div class="center" style="margin-top: 5px; font-style: italic;">${data.headerText}</div>` : ''}
      <div class="line"></div>
      
      ${data.sections.invoice_info ? `
      <div style="font-size: 0.9em;">
        <div style="display:flex; justify-content:space-between;">
          <span>No: ${data.invoiceNumber}</span>
          <span style="font-size: 0.85em;">${data.date}</span>
        </div>
        <div>Kasir: ${data.cashierName}</div>
        ${data.notes ? `<div style="font-style: italic; margin-top: 3px; font-size: 0.85em;">Cat: ${data.notes}</div>` : ''}
        ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      </div>
      <div class="line"></div>
      ` : ''}
      
      <!-- 4-COLUMN TABLE: Item | Qty | Harga | Total -->
      <table>
        <thead>
          <tr>
            <th width="32%">Item</th>
            <th width="10%" class="center">Qty</th>
            <th width="29%" class="right">Harga</th>
            <th width="29%" class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="center">${item.qty}</td>
              <td class="right">${Number(item.price).toLocaleString('id-ID')}</td>
              <td class="right">${Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="line"></div>
      <div style="display:flex; justify-content:flex-end;">
        <table style="width: 60%">
          <tr><td>Total</td><td class="right bold">${Number(data.total).toLocaleString('id-ID')}</td></tr>
          ${data.sections.payment_info ? (data.paymentMethod === 'cash' ? `
          <tr><td>Tunai</td><td class="right">${Number(data.amountPaid).toLocaleString('id-ID')}</td></tr>
          <tr><td>Kembali</td><td class="right">${Number(data.changeAmount).toLocaleString('id-ID')}</td></tr>` : `<tr><td>Metode</td><td class="right">${data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>`) : ''}
        </table>
      </div>
      <div class="line"></div>
      ${data.sections.footer_text ? `<div class="center" style="margin-top: 5px;">${data.footerText}</div>` : ''}
    `
  },
  '58mm-2': {
    name: 'Compact (C58BT Optimized)',
    width: '58mm',
    render: (data) => `
      <style>
        /* C58BT 58mm Compact: Super hemat kertas */
        body { 
          font-family: 'Courier New', 'Courier', monospace; 
          font-size: 11px;    /* Ekstra kecil untuk banyak item */
          width: ${data.widthPx}px; 
          padding: 3px 4px;   /* Minimal horizontal padding untuk 48mm printable */
          padding-top: 15mm;  /* Spasi jari di atas header */
          line-height: 1.15;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px solid black; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { 
          border-bottom: 1px solid black; 
          padding: 2px 1px;
          font-size: 0.8em;
        }
        td { 
          padding: 1px 1px;
          vertical-align: top;
          font-size: 0.85em;
          border-bottom: 1px dashed #000;
        }
        th.center, td.center { text-align: center; }
        th.right, td.right { text-align: right; }
      </style>
      
      ${data.sections.store_name ? `<div class="center bold" style="font-size: 1.1em; margin-bottom: 2px;">${data.storeName}</div>` : ''}
      ${data.sections.header_text ? `<div class="center" style="font-size: 0.85em; margin-bottom: 4px;">${data.headerText}</div>` : ''}
      <div class="line"></div>
      
      ${data.sections.invoice_info ? `
      <div style="font-size: 0.85em;">
        <div style="display:flex; justify-content:space-between;">
          <span>${data.invoiceNumber}</span>
          <span>${data.date.split(' ')[1] || data.date}</span>
        </div>
        <div>Kasir: ${data.cashierName}</div>
        ${data.notes ? `<div style="font-style: italic; font-size: 0.8em;">Cat: ${data.notes}</div>` : ''}
        ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      </div>
      <div class="line"></div>
      ` : ''}
      
      <!-- 4-COLUMN TABLE -->
      <table>
        <thead>
          <tr>
            <th width="32%" style="font-size: 0.8em;">Item</th>
            <th width="10%" class="center" style="font-size: 0.8em;">Qty</th>
            <th width="29%" class="right" style="font-size: 0.8em;">Harga</th>
            <th width="29%" class="right" style="font-size: 0.8em;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td style="font-size: 0.85em;">${item.name}</td>
              <td class="center" style="font-size: 0.85em;">${item.qty}</td>
              <td class="right" style="font-size: 0.85em;">${Number(item.price).toLocaleString('id-ID')}</td>
              <td class="right" style="font-size: 0.85em;">${Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="line"></div>
      <div style="display:flex; justify-content:flex-end;">
        <table style="width: 55%">
          <tr class="bold" style="font-size: 1.05em;">
            <td>TOTAL</td>
            <td class="right">${Number(data.total).toLocaleString('id-ID')}</td>
          </tr>
          ${data.paymentMethod === 'cash' ? `
          <tr style="font-size: 0.85em;"><td>Tunai</td><td class="right">${Number(data.amountPaid).toLocaleString('id-ID')}</td></tr>
          <tr style="font-size: 0.85em;"><td>Kembali</td><td class="right">${Number(data.changeAmount).toLocaleString('id-ID')}</td></tr>
          ` : ''}
        </table>
      </div>
    `
  },
  '58mm-3': {
    name: 'Modern (C58BT Optimized)',
    width: '58mm',
    render: (data) => `
      <style>
        /* C58BT 58mm Modern: Clean dengan border */
        body { 
          font-family: 'Courier New', 'Courier', monospace; 
          font-size: 12px;
          width: ${data.widthPx}px; 
          padding: 3px 4px;   /* Minimal horizontal padding untuk 48mm printable */
          padding-top: 15mm;  /* Spasi jari di atas header */
          line-height: 1.25;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed black; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { 
          border-bottom: 2px solid black; 
          padding: 3px 2px;
          font-size: 0.85em;
        }
        td { 
          padding: 2px 2px;
          border-bottom: 1px dashed #000;
        }
        th.center, td.center { text-align: center; }
        th.right, td.right { text-align: right; }
        .header-box { 
          border: 2px solid #000; 
          padding: 6px; 
          text-align: center; 
          margin-bottom: 8px;
        }
      </style>
      
      ${data.sections.store_name ? `
      <div class="header-box">
        <div style="font-size: 1.2em; font-weight: bold;">${data.storeName}</div>
      </div>
      ` : ''}
      
      ${data.sections.header_text ? `<div class="center" style="margin-bottom: 8px; font-style: italic;">${data.headerText}</div>` : ''}

      ${data.sections.invoice_info ? `
      <div style="font-size: 0.85em; margin-bottom: 8px;">
        <div>${data.date} | ${data.cashierName}</div>
        <div>No: ${data.invoiceNumber}</div>
        ${data.notes ? `<div style="font-style: italic;">Cat: ${data.notes}</div>` : ''}
        ${data.customerName ? `<div>Kpd: ${data.customerName}</div>` : ''}
      </div>
      ` : ''}
      
      <!-- 4-COLUMN TABLE -->
      <table>
        <thead>
          <tr>
            <th width="32%">Item</th>
            <th width="10%" class="center">Qty</th>
            <th width="29%" class="right">Harga</th>
            <th width="29%" class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="center">${item.qty}</td>
              <td class="right">${Number(item.price).toLocaleString('id-ID')}</td>
              <td class="right">${Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="line"></div>
      <div style="border: 2px solid #000; padding: 8px; margin-top: 8px;">
        <div style="display:flex; justify-content:space-between; font-weight: bold; font-size: 1.1em;">
          <span>TOTAL</span>
          <span>${Number(data.total).toLocaleString('id-ID')}</span>
        </div>
        ${data.paymentMethod === 'cash' ? `
        <div style="display:flex; justify-content:space-between; font-size: 0.9em; margin-top: 4px;">
          <span>Tunai</span>
          <span>${Number(data.amountPaid).toLocaleString('id-ID')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight: bold; font-size: 0.9em;">
          <span>Kembali</span>
          <span>${Number(data.changeAmount).toLocaleString('id-ID')}</span>
        </div>
        ` : ''}
      </div>
      ${data.sections.footer_text ? `<div class="center" style="margin-top: 8px; font-style: italic;">${data.footerText}</div>` : ''}
    `
  },
  '58mm-4': { name: 'Classic (Dashed)', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-5': { name: 'Bold Header', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-6': { name: 'Minimalist', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-7': { name: 'Retro', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder
  '58mm-8': { name: 'Detailed', width: '58mm', render: (data) => templates['58mm-1'].render(data) }, // Placeholder

  // ------------------------------------------
  // 58mm Extended Templates (Dot-Matrix Friendly)
  // ------------------------------------------

  // Formal Plus — complete layout: full store info, invoice table, 2-row items,
  // subtotal/diskon/pajak/total breakdown, payment method + cash change detail
  '58mm-9': {
    name: 'Formal Plus',
    width: '58mm',
    render: (data) => `
      <style>
        /* OPTIMIZED FOR THERMAL PRINTERS */
        body { font-family: 'Courier New', 'Courier', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 3px 4px; line-height: 1.3; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .sm     { font-size: 0.88em; }
        .line   { border-top: 1px dashed #000; margin: 5px 0; }
        .line-s { border-top: 1px solid  #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 1px 0; }
        .lbl { width: 42%; }
        .item-detail { font-size: 0.9em; border-bottom: 1px dashed #000; }
        .sum-total td { font-weight: bold; font-size: 1.05em; border-top: 1px solid #000; padding-top: 3px; }
      </style>

      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name    ? `<div class="center bold" style="font-size:1.15em; letter-spacing:0.5px;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center sm">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone   ? `<div class="center sm">Telp: ${data.storePhone}</div>` : ''}
      ${data.sections.header_text   ? `<div class="center sm" style="margin-top:2px; font-style:italic;">${data.headerText}</div>` : ''}
      <div class="line-s"></div>

      ${data.sections.invoice_info ? `
      <table class="sm">
        <tr><td class="lbl">No. Faktur</td><td>: ${data.invoiceNumber}</td></tr>
        <tr><td class="lbl">Tanggal</td><td>: ${data.date}</td></tr>
        <tr><td class="lbl">Kasir</td><td>: ${data.cashierName}</td></tr>
        ${data.customerName    ? `<tr><td class="lbl">Pelanggan</td><td>: ${data.customerName}</td></tr>` : ''}
        ${data.customerAddress ? `<tr><td class="lbl">Alamat</td><td>: ${data.customerAddress}</td></tr>` : ''}
        ${data.notes           ? `<tr><td class="lbl">Catatan</td><td>: <i>${data.notes}</i></td></tr>` : ''}
      </table>
      <div class="line"></div>
      ` : ''}

      <table>
        ${data.items.map(item => `
          <tr><td colspan="2" class="bold">${item.name}</td></tr>
          <tr class="item-detail">
            <td>${item.qty} x ${Number(item.price).toLocaleString('id-ID')}</td>
            <td class="right">${Number(item.subtotal).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')}
      </table>
      <div class="line"></div>

      <table>
        <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
        ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
        ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
        <tr class="sum-total"><td>TOTAL</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
      </table>

      ${data.sections.payment_info ? `
      <div class="line"></div>
      <table class="sm">
        <tr><td class="lbl">Metode Bayar</td><td>: ${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
        ${data.paymentMethod === 'cash' ? `
        <tr><td class="lbl">Jumlah Bayar</td><td>: ${data.formatCurrency(data.amountPaid)}</td></tr>
        <tr class="bold"><td class="lbl">Kembalian</td><td>: ${data.formatCurrency(data.changeAmount)}</td></tr>
        ` : ''}
      </table>
      ` : ''}

      <div class="line-s"></div>
      ${data.sections.footer_text ? `<div class="center sm" style="margin-top:3px;">${data.footerText}</div>` : ''}
    `
  },

  // Tabel 3 Kolom — column-header table (ITEM | QTY | SUBTOTAL),
  // unit price shown below item name, complete financial summary
  '58mm-10': {
    name: 'Tabel 3 Kolom',
    width: '58mm',
    render: (data) => `
      <style>
        /* OPTIMIZED FOR THERMAL PRINTERS */
        body { font-family: 'Courier New', 'Courier', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 3px 4px; line-height: 1.3; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .sm     { font-size: 0.88em; }
        .line   { border-top: 1px dashed #000; margin: 5px 0; }
        .line-s { border-top: 1px solid  #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { vertical-align: top; padding: 1px 0; }
        th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 0; font-weight: bold; }
        tbody tr { border-bottom: 1px dashed #000; }
        .c-name  { width: 52%; }
        .c-qty   { width: 12%; text-align: center; }
        .c-total { width: 36%; text-align: right; }
        .sum-lbl { width: 55%; }
        .sum-val { width: 45%; text-align: right; }
        .grand-total td { font-weight: bold; font-size: 1.05em; border-top: 1px solid #000; padding-top: 3px; }
      </style>

      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name    ? `<div class="center bold" style="font-size:1.1em;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center sm">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone   ? `<div class="center sm">Telp: ${data.storePhone}</div>` : ''}
      ${data.sections.header_text   ? `<div class="center sm" style="font-style:italic; margin-top:2px;">${data.headerText}</div>` : ''}
      <div class="line"></div>

      ${data.sections.invoice_info ? `
      <div class="sm">
        <div>No: ${data.invoiceNumber}</div>
        <div>Tgl: ${data.date} | Kasir: ${data.cashierName}</div>
        ${data.customerName ? `<div>Kpd: ${data.customerName}${data.customerAddress ? `, ${data.customerAddress}` : ''}</div>` : ''}
        ${data.notes ? `<div><i>Ket: ${data.notes}</i></div>` : ''}
      </div>
      <div class="line"></div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th class="c-name">ITEM</th>
            <th class="c-qty">QTY</th>
            <th class="c-total">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td class="c-name" style="padding:2px 0;">
                ${item.name}
                <br/><span class="sm">@ ${Number(item.price).toLocaleString('id-ID')}</span>
              </td>
              <td class="c-qty" style="padding:2px 0; text-align:center;">${item.qty}</td>
              <td class="c-total" style="padding:2px 0;">${Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="line"></div>

      <table>
        <tr><td class="sum-lbl">Subtotal</td><td class="sum-val">${data.formatCurrency(data.subtotal)}</td></tr>
        ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td class="sum-lbl">Diskon</td><td class="sum-val">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
        ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td class="sum-lbl">Pajak</td><td class="sum-val">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
        <tr class="grand-total"><td class="sum-lbl">TOTAL</td><td class="sum-val">${data.formatCurrency(data.total)}</td></tr>
        ${data.sections.payment_info ? `
        <tr class="sm"><td class="sum-lbl" style="padding-top:3px;">Metode Bayar</td><td class="sum-val" style="padding-top:3px;">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
        ${data.paymentMethod === 'cash' ? `
        <tr class="sm"><td class="sum-lbl">Dibayar</td><td class="sum-val">${data.formatCurrency(data.amountPaid)}</td></tr>
        <tr class="bold"><td class="sum-lbl">Kembali</td><td class="sum-val">${data.formatCurrency(data.changeAmount)}</td></tr>
        ` : ''} ` : ''}
      </table>
      <div class="line-s"></div>
      ${data.sections.footer_text ? `<div class="center sm" style="margin-top:3px;">${data.footerText}</div>` : ''}
    `
  },

  // Garis Ganda — CSS double-border framing for store title and total section,
  // all data fields, elegant formal look for high-end retail
  '58mm-11': {
    name: 'Garis Ganda',
    width: '58mm',
    render: (data) => `
      <style>
        /* OPTIMIZED FOR THERMAL PRINTERS */
        body { font-family: 'Courier New', 'Courier', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 3px 4px; line-height: 1.3; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .sm     { font-size: 0.88em; }
        .line   { border-top: 1px dashed #000; margin: 5px 0; }
        .dbl    { border-top: 3px double #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 1px 0; }
        .store-frame { border-top: 3px double #000; border-bottom: 3px double #000; padding: 4px 0; text-align: center; margin: 3px 0; }
        .item-name { font-weight: bold; }
        tr.sm { border-bottom: 1px dashed #000; }
        .total-frame { border-top: 3px double #000; border-bottom: 3px double #000; padding: 4px 0; margin: 5px 0; }
        .total-frame td { font-weight: bold; font-size: 1.1em; }
        .lbl { width: 45%; }
      </style>

      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name ? `
      <div class="store-frame">
        <div class="bold" style="font-size:1.1em;">${data.storeName}</div>
        ${data.sections.store_address ? `<div class="sm">${data.storeAddress}</div>` : ''}
        ${data.sections.store_phone ? `<div class="sm">Telp: ${data.storePhone}</div>` : ''}
      </div>
      ` : `
      ${data.sections.store_address ? `<div class="center sm">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone ? `<div class="center sm">Telp: ${data.storePhone}</div>` : ''}
      `}
      ${data.sections.header_text ? `<div class="center sm" style="font-style:italic; margin-bottom:4px;">${data.headerText}</div>` : ''}

      ${data.sections.invoice_info ? `
      <div class="line"></div>
      <table class="sm">
        <tr><td class="lbl">Faktur</td><td>: ${data.invoiceNumber}</td></tr>
        <tr><td class="lbl">Tanggal</td><td>: ${data.date}</td></tr>
        <tr><td class="lbl">Kasir</td><td>: ${data.cashierName}</td></tr>
        ${data.customerName    ? `<tr><td class="lbl">Pelanggan</td><td>: ${data.customerName}</td></tr>` : ''}
        ${data.customerAddress ? `<tr><td class="lbl">Alamat</td><td>: ${data.customerAddress}</td></tr>` : ''}
        ${data.notes           ? `<tr><td class="lbl">Catatan</td><td>: <i>${data.notes}</i></td></tr>` : ''}
      </table>
      ` : ''}

      <div class="dbl"></div>
      <table>
        ${data.items.map(item => `
          <tr><td colspan="2" class="item-name">${item.name}</td></tr>
          <tr class="sm">
            <td>${item.qty} x ${Number(item.price).toLocaleString('id-ID')}</td>
            <td class="right">${Number(item.subtotal).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')}
      </table>

      ${data.sections.discount_line && data.discountAmount > 0 || data.sections.tax_line && data.taxAmount > 0 ? `
      <div class="line"></div>
      <table class="sm">
        <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
        ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
        ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
      </table>
      ` : ''}

      <div class="total-frame">
        <table>
          <tr class="bold">
            <td style="font-size:1.1em;">TOTAL BAYAR</td>
            <td class="right" style="font-size:1.1em;">${data.formatCurrency(data.total)}</td>
          </tr>
        </table>
      </div>

      ${data.sections.payment_info ? `
      <table class="sm">
        <tr><td class="lbl">Metode</td><td>: ${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
        ${data.paymentMethod === 'cash' ? `
        <tr><td class="lbl">Dibayar</td><td>: ${data.formatCurrency(data.amountPaid)}</td></tr>
        <tr class="bold"><td class="lbl">Kembalian</td><td>: ${data.formatCurrency(data.changeAmount)}</td></tr>
        ` : ''}
      </table>
      ` : ''}

      <div class="dbl"></div>
      ${data.sections.footer_text ? `<div class="center sm" style="margin-top:3px;">${data.footerText}</div>` : ''}
    `
  },

  // Nota Ringkas — compact 3-column single-row items (name+unit price | qty | subtotal),
  // invoice info on minimal lines, full financial summary, ideal for high-volume stores
  '58mm-12': {
    name: 'Nota Ringkas',
    width: '58mm',
    render: (data) => `
      <style>
        /* OPTIMIZED FOR THERMAL PRINTERS */
        body { font-family: 'Courier New', 'Courier', monospace; font-size: ${data.fontSize}; width: ${data.widthPx}px; padding: 3px 4px; line-height: 1.3; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .sm     { font-size: 0.85em; }
        .line   { border-top: 1px dashed #000; margin: 4px 0; }
        .line-s { border-top: 1px solid  #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { vertical-align: top; padding: 0; }
        th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 0; font-weight: bold; font-size: 0.85em; }
        tbody tr { border-bottom: 1px dashed #000; }
        .c-name  { width: 50%; }
        .c-qty   { width: 10%; text-align: center; }
        .c-sub   { width: 40%; text-align: right; }
        .sum-lbl { width: 55%; }
        .sum-val { width: 45%; text-align: right; }
        .total-row td { font-weight: bold; font-size: 1.05em; border-top: 1px solid #000; padding-top: 2px; }
      </style>

      ${data.sections.logo ? data.logoHTML : ''}
      ${data.sections.store_name    ? `<div class="center bold" style="font-size:1.1em;">${data.storeName}</div>` : ''}
      ${data.sections.store_address ? `<div class="center sm">${data.storeAddress}</div>` : ''}
      ${data.sections.store_phone   ? `<div class="center sm">${data.storePhone}</div>` : ''}
      ${data.sections.header_text   ? `<div class="center sm" style="font-style:italic;">${data.headerText}</div>` : ''}

      <div class="line-s"></div>
      ${data.sections.invoice_info ? `
      <div class="sm">
        <div>${data.invoiceNumber} | ${data.date}</div>
        <div>Kasir: ${data.cashierName}${data.customerName ? ` | ${data.customerName}` : ''}</div>
        ${data.notes ? `<div><i>${data.notes}</i></div>` : ''}
      </div>
      <div class="line"></div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th class="c-name">ITEM</th>
            <th class="c-qty">QTY</th>
            <th class="c-sub">JUMLAH</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr style="padding: 1px 0;">
              <td class="c-name" style="padding:2px 0;">
                ${item.name}
                <br/><span class="sm">@ ${Number(item.price).toLocaleString('id-ID')}</span>
              </td>
              <td class="c-qty" style="padding:2px 0; text-align:center;">${item.qty}</td>
              <td class="c-sub" style="padding:2px 0;">${Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="line"></div>

      <table>
        <tr><td class="sum-lbl sm">Subtotal</td><td class="sum-val sm">${data.formatCurrency(data.subtotal)}</td></tr>
        ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td class="sum-lbl sm">Diskon</td><td class="sum-val sm">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
        ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td class="sum-lbl sm">Pajak</td><td class="sum-val sm">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
        <tr class="total-row"><td class="sum-lbl">TOTAL</td><td class="sum-val">${data.formatCurrency(data.total)}</td></tr>
        ${data.sections.payment_info ? `
        <tr><td class="sum-lbl sm" style="padding-top:2px;">Metode</td><td class="sum-val sm" style="padding-top:2px;">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
        ${data.paymentMethod === 'cash' ? `
        <tr><td class="sum-lbl sm">Dibayar</td><td class="sum-val sm">${data.formatCurrency(data.amountPaid)}</td></tr>
        <tr class="bold"><td class="sum-lbl">Kembali</td><td class="sum-val">${data.formatCurrency(data.changeAmount)}</td></tr>
        ` : ''}
        ` : ''}
      </table>
      <div class="line-s"></div>
      ${data.sections.footer_text ? `<div class="center sm" style="margin-top:2px;">${data.footerText}</div>` : ''}
    `
  },

  // ==========================================
  // Continuous Form 9.5×11" Templates (CF)
  // OPTIMIZED FOR DOT MATRIX & THERMAL PRINTERS
  // Font: Monospace (Courier) - Font A/B compatible
  // Page break handling, margin safety
  // ==========================================

  // CF-1: Standar CF — OPTIMIZED VERSION
  'cf-1': {
    name: 'Standar CF (Optimized)',
    width: 'cf',
    render: (data) => {
      // FONT SIZES OPTIMIZED FOR THERMAL/DOT MATRIX PRINTERS
      // Font A (12x24) = ~13px, Font B (9x17) = ~10px
      const fs = ({ '9px': '12px', '10px': '14px', '11px': '16px' }[data.fontSize] || '14px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          /* THERMAL PRINTER OPTIMIZATIONS */
          @page { margin: 10mm; size: auto; }
          body { 
            font-family: 'Courier New', 'Courier', monospace; 
            font-size: ${fs}; 
            width: ${data.widthPx}px; 
            padding: 20px 25px; 
            line-height: 1.4; 
            color: #000 !important; 
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            page-break-inside: avoid;
          }
          .right { text-align: right; } 
          .center { text-align: center; } 
          .bold { font-weight: bold; }
          hr.thick { border: none; border-top: 3px solid #000; margin: 12px 0; }
          hr.dash  { border: none; border-top: 2px dashed #000; margin: 10px 0; }
          /* HEADER - PREVENT CUTOFF */
          .store-header { 
            text-align: center; 
            padding: 15px 0 12px 0;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .store-name { font-size: 1.6em; font-weight: bold; margin: 0 0 6px; letter-spacing: 1px; }
          .store-sub  { font-size: 1em; line-height: 1.3; }
          .two-col { display: flex; justify-content: space-between; gap: 25px; margin: 12px 0; }
          .two-col > div { flex: 1; }
          .kv { width: 100%; border-collapse: collapse; }
          .kv td.k { font-weight: bold; width: 35%; white-space: nowrap; padding: 3px 0; }
          .kv td.sep { width: 10px; padding: 3px 0; }
          .kv td.v { padding: 3px 0; }
          /* TABLE STYLES - HIGH CONTRAST */
          table.items { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 12px 0;
            page-break-inside: auto;
          }
          table.items thead { display: table-header-group; }
          table.items thead th { 
            background: #000 !important; 
            color: #fff !important; 
            padding: 8px 10px; 
            text-align: left;
            font-weight: bold;
            border: 2px solid #000;
          }
          table.items thead th.right  { text-align: right; }
          table.items thead th.center { text-align: center; }
          table.items tbody tr { page-break-inside: avoid; }
          table.items tbody td { 
            padding: 6px 10px; 
            border-bottom: 1px solid #000; 
            vertical-align: top; 
          }
          table.items tbody td.right  { text-align: right; }
          table.items tbody td.center { text-align: center; }
          table.items tfoot td { 
            padding: 8px 10px; 
            border-top: 3px solid #000; 
            font-weight: bold;
            background: #f0f0f0;
          }
          .sum-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
          table.sum { width: 42%; border-collapse: collapse; }
          table.sum td { padding: 5px 10px; }
          table.sum td.right { text-align: right; }
          table.sum .total td { 
            font-weight: bold; 
            font-size: 1.15em; 
            border-top: 3px solid #000; 
            border-bottom: 2px solid #000;
            padding: 8px 10px;
            background: #e8e8e8;
          }
          table.sum .pay td { font-size: 0.95em; padding: 4px 10px; }
          .footer { 
            border-top: 2px dashed #000; 
            padding-top: 12px; 
            margin-top: 20px; 
            text-align: center; 
            font-size: 1em;
            page-break-inside: avoid;
          }
          /* PREVENT PAGE BREAK AFTER HEADER */
          .store-header, .two-col { page-break-after: avoid; }
        </style>

        ${data.sections.logo ? data.logoHTML : ''}
        ${data.sections.store_name ? `
        <div class="store-header">
          <div class="store-name">${data.storeName}</div>
          ${data.sections.store_address ? `<div class="store-sub">${data.storeAddress}</div>` : ''}
          ${data.sections.store_phone   ? `<div class="store-sub">Telp: ${data.storePhone}</div>` : ''}
          ${data.sections.header_text   ? `<div class="store-sub" style="font-style:italic;margin-top:4px;">${data.headerText}</div>` : ''}
        </div>
        ` : `
          ${data.sections.store_address ? `<div class="center">${data.storeAddress}</div>` : ''}
          ${data.sections.store_phone   ? `<div class="center">Telp: ${data.storePhone}</div>` : ''}
          ${data.sections.header_text   ? `<div class="center" style="font-style:italic;">${data.headerText}</div>` : ''}
        `}
        <hr class="thick" />

        ${data.sections.invoice_info ? `
        <div class="two-col">
          <div>
            <table class="kv">
              <tr><td class="k">No. Faktur</td><td class="sep">:</td><td class="v">${data.invoiceNumber}</td></tr>
              <tr><td class="k">Tanggal</td><td class="sep">:</td><td class="v">${data.date}</td></tr>
              <tr><td class="k">Kasir</td><td class="sep">:</td><td class="v">${data.cashierName}</td></tr>
              ${data.notes ? `<tr><td class="k">Catatan</td><td class="sep">:</td><td class="v"><i>${data.notes}</i></td></tr>` : ''}
            </table>
          </div>
          <div>
            ${data.customerName ? `
            <table class="kv">
              <tr><td class="k">Pelanggan</td><td class="sep">:</td><td class="v">${data.customerName}</td></tr>
              ${data.customerAddress ? `<tr><td class="k">Alamat</td><td class="sep">:</td><td class="v">${data.customerAddress}</td></tr>` : ''}
            </table>` : ''}
          </div>
        </div>
        <hr class="dash" />
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th style="width:4%">No</th>
              <th style="width:49%">Nama Barang</th>
              <th class="center" style="width:9%">Qty</th>
              <th class="right" style="width:19%">Harga Satuan</th>
              <th class="right" style="width:19%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.name}</td>
                <td class="center">${item.qty}</td>
                <td class="right">${data.formatCurrency(item.price)}</td>
                <td class="right">${data.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="right">${data.items.length} jenis barang</td>
              <td class="center bold">${totalQty}</td>
              <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="sum-wrap">
          <table class="sum">
            <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
            ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
            ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
            <tr class="total"><td>TOTAL</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
            ${data.sections.payment_info ? `
            <tr class="pay"><td>Metode Bayar</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
            ${data.paymentMethod === 'cash' ? `
            <tr class="pay"><td>Jumlah Bayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
            <tr class="pay bold"><td>Kembalian</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
            ` : ''}` : ''}
          </table>
        </div>
        ${data.sections.footer_text ? `<div class="footer">${data.footerText}</div>` : ''}
      `;
    }
  },

  // CF-2: Invoice Bisnis — OPTIMIZED FOR THERMAL PRINTERS
  'cf-2': {
    name: 'Invoice Bisnis (Optimized)',
    width: 'cf',
    render: (data) => {
      const fs = ({ '9px': '12px', '10px': '14px', '11px': '16px' }[data.fontSize] || '14px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          @page { margin: 10mm; size: auto; }
          body { 
            font-family: 'Courier New', 'Courier', monospace;
            font-size: ${fs}; 
            width: ${data.widthPx}px; 
            padding: 20px 25px; 
            line-height: 1.4; 
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          hr.thick { border: none; border-top: 2px solid #000; margin: 10px 0; }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 20px; }
          .store-block { flex: 1; }
          .store-name { font-size: 1.5em; font-weight: bold; margin: 0 0 4px; }
          .store-sub  { font-size: 0.9em; }
          .invoice-box { border: 2px solid #000; padding: 10px 14px; min-width: 260px; }
          .invoice-box .ibox-title { font-weight: bold; font-size: 1.05em; text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 1px; }
          .kv { width: 100%; border-collapse: collapse; }
          .kv td.k { font-weight: bold; width: 42%; padding: 1px 0; }
          .kv td.sep { width: 8px; padding: 1px 0; }
          .kv td.v { padding: 1px 0; }
          table.items { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table.items th { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 8px; text-align: left; font-size: 0.88em; text-transform: uppercase; letter-spacing: 0.5px; }
          table.items th.right  { text-align: right; }
          table.items th.center { text-align: center; }
          table.items td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
          table.items td.right  { text-align: right; }
          table.items td.center { text-align: center; }
          table.items tfoot td { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; padding: 6px 8px; }
          .bottom { display: flex; justify-content: flex-end; margin-top: 10px; }
          .sum-box { border: 1px solid #000; padding: 0; width: 40%; }
          .sum-box .sbox-title { background: #000; color: #fff; padding: 5px 10px; font-weight: bold; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; }
          table.sum { width: 100%; border-collapse: collapse; }
          table.sum td { padding: 4px 10px; border-bottom: 1px solid #eee; }
          table.sum td.right { text-align: right; }
          table.sum .total td { font-weight: bold; font-size: 1.1em; border-top: 2px solid #000; background: #f8f8f8; padding: 6px 10px; }
          table.sum .pay td { font-size: 0.9em; }
          .footer { border-top: 1px solid #000; padding-top: 8px; margin-top: 15px; text-align: center; font-style: italic; font-size: 0.9em; }
        </style>

        <div class="header-row">
          <div class="store-block">
            ${data.sections.logo ? data.logoHTML : ''}
            ${data.sections.store_name    ? `<div class="store-name">${data.storeName}</div>` : ''}
            ${data.sections.store_address ? `<div class="store-sub">${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone   ? `<div class="store-sub">Telp: ${data.storePhone}</div>` : ''}
            ${data.sections.header_text   ? `<div class="store-sub" style="font-style:italic;margin-top:4px;">${data.headerText}</div>` : ''}
          </div>
          ${data.sections.invoice_info ? `
          <div class="invoice-box">
            <div class="ibox-title">NOTA PENJUALAN</div>
            <table class="kv">
              <tr><td class="k">No. Faktur</td><td class="sep">:</td><td class="v">${data.invoiceNumber}</td></tr>
              <tr><td class="k">Tanggal</td><td class="sep">:</td><td class="v">${data.date}</td></tr>
              <tr><td class="k">Kasir</td><td class="sep">:</td><td class="v">${data.cashierName}</td></tr>
              ${data.customerName    ? `<tr><td class="k">Kpd</td><td class="sep">:</td><td class="v">${data.customerName}</td></tr>` : ''}
              ${data.customerAddress ? `<tr><td class="k">Alamat</td><td class="sep">:</td><td class="v">${data.customerAddress}</td></tr>` : ''}
              ${data.notes           ? `<tr><td class="k">Catatan</td><td class="sep">:</td><td class="v"><i>${data.notes}</i></td></tr>` : ''}
            </table>
          </div>
          ` : ''}
        </div>
        <hr class="thick" />

        <table class="items">
          <thead>
            <tr>
              <th style="width:4%">No</th>
              <th style="width:49%">Nama Barang</th>
              <th class="center" style="width:9%">Qty</th>
              <th class="right" style="width:19%">Harga Satuan</th>
              <th class="right" style="width:19%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.name}</td>
                <td class="center">${item.qty}</td>
                <td class="right">${data.formatCurrency(item.price)}</td>
                <td class="right">${data.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="right">${data.items.length} jenis, ${totalQty} barang</td>
              <td class="center">${totalQty}</td>
              <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="bottom">
          <div class="sum-box">
            <div class="sbox-title">Ringkasan Pembayaran</div>
            <table class="sum">
              <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
              ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
              ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak / PPn</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
              <tr class="total"><td>TOTAL BAYAR</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
              ${data.sections.payment_info ? `
              <tr class="pay"><td>Metode</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
              ${data.paymentMethod === 'cash' ? `
              <tr class="pay"><td>Dibayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
              <tr class="pay bold"><td>Kembalian</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
              ` : ''}` : ''}
            </table>
          </div>
        </div>
        ${data.sections.footer_text ? `<div class="footer">${data.footerText}</div>` : ''}
      `;
    }
  },

  // CF-3: Nota Tabel Penuh — all-border grid table, double-title underline,
  // meta boxes for invoice and customer, summary in headed box
  'cf-3': {
    name: 'Nota Tabel Penuh',
    width: 'cf',
    render: (data) => {
      const fs = ({ '9px': '11px', '10px': '13px', '11px': '15px' }[data.fontSize] || '13px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: ${fs}; width: ${data.widthPx}px; padding: 15px 20px; line-height: 1.4; color: #000; }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          .store-title { text-align: center; font-size: 1.4em; font-weight: bold; border-bottom: 3px double #000; padding-bottom: 6px; margin-bottom: 4px; }
          .store-info  { text-align: center; font-size: 0.9em; margin: 2px 0; }
          .hdr-text    { text-align: center; font-style: italic; margin: 6px 0 10px; }
          .meta-grid { display: flex; gap: 12px; margin: 10px 0 12px; }
          .meta-box { flex: 1; border: 1px solid #000; padding: 6px 10px; }
          .meta-box .box-label { font-size: 0.8em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd; margin-bottom: 4px; padding-bottom: 2px; }
          .kv { width: 100%; border-collapse: collapse; }
          .kv td.k { font-weight: bold; width: 40%; padding: 1px 0; }
          .kv td.sep { width: 8px; padding: 1px 0; }
          .kv td.v { padding: 1px 0; }
          table.items { width: 100%; border-collapse: collapse; margin: 8px 0; }
          table.items th { border: 1px solid #000; padding: 6px 8px; background: #000; color: #fff; text-align: left; }
          table.items th.right  { text-align: right; }
          table.items th.center { text-align: center; }
          table.items td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: top; }
          table.items td.right  { text-align: right; }
          table.items td.center { text-align: center; }
          table.items tr:nth-child(even) td { background: #f8f8f8; }
          table.items tfoot td { border: 1px solid #000; background: #f0f0f0; font-weight: bold; padding: 6px 8px; }
          .sum-section { display: flex; justify-content: flex-end; margin-top: 10px; }
          .sum-box { border: 1px solid #000; width: 40%; }
          .sum-box .sbox-head { background: #000; color: #fff; padding: 5px 10px; font-weight: bold; font-size: 0.85em; text-transform: uppercase; }
          table.sum { width: 100%; border-collapse: collapse; }
          table.sum td { padding: 5px 10px; border-bottom: 1px solid #eee; }
          table.sum td.right { text-align: right; }
          table.sum .total td { font-weight: bold; font-size: 1.05em; border-top: 2px solid #000; background: #f5f5f5; }
          table.sum .pay td { font-size: 0.9em; }
          .footer-line { border-top: 1px dashed #000; padding-top: 8px; margin-top: 15px; text-align: center; font-size: 0.9em; }
        </style>

        ${data.sections.logo ? data.logoHTML : ''}
        ${data.sections.store_name    ? `<div class="store-title">${data.storeName}</div>` : ''}
        ${data.sections.store_address ? `<div class="store-info">${data.storeAddress}</div>` : ''}
        ${data.sections.store_phone   ? `<div class="store-info">Telp: ${data.storePhone}</div>` : ''}
        ${data.sections.header_text   ? `<div class="hdr-text">${data.headerText}</div>` : ''}

        ${data.sections.invoice_info ? `
        <div class="meta-grid">
          <div class="meta-box">
            <div class="box-label">Info Transaksi</div>
            <table class="kv">
              <tr><td class="k">No. Faktur</td><td class="sep">:</td><td class="v">${data.invoiceNumber}</td></tr>
              <tr><td class="k">Tanggal</td><td class="sep">:</td><td class="v">${data.date}</td></tr>
              <tr><td class="k">Kasir</td><td class="sep">:</td><td class="v">${data.cashierName}</td></tr>
              ${data.notes ? `<tr><td class="k">Catatan</td><td class="sep">:</td><td class="v"><i>${data.notes}</i></td></tr>` : ''}
            </table>
          </div>
          <div class="meta-box">
            <div class="box-label">Data Pelanggan</div>
            ${data.customerName ? `
            <table class="kv">
              <tr><td class="k">Nama</td><td class="sep">:</td><td class="v">${data.customerName}</td></tr>
              ${data.customerAddress ? `<tr><td class="k">Alamat</td><td class="sep">:</td><td class="v">${data.customerAddress}</td></tr>` : ''}
            </table>
            ` : `<p style="font-style:italic;color:#777;font-size:0.9em;margin:0;">Pelanggan umum</p>`}
          </div>
        </div>
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th style="width:4%">No</th>
              <th style="width:49%">Nama Barang</th>
              <th class="center" style="width:9%">Qty</th>
              <th class="right" style="width:19%">Harga Satuan</th>
              <th class="right" style="width:19%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.name}</td>
                <td class="center">${item.qty}</td>
                <td class="right">${data.formatCurrency(item.price)}</td>
                <td class="right">${data.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="right">${data.items.length} jenis barang</td>
              <td class="center">${totalQty}</td>
              <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="sum-section">
          <div class="sum-box">
            <div class="sbox-head">Rincian Pembayaran</div>
            <table class="sum">
              <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
              ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
              ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak / PPn</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
              <tr class="total"><td>TOTAL BAYAR</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
              ${data.sections.payment_info ? `
              <tr class="pay"><td>Metode Bayar</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
              ${data.paymentMethod === 'cash' ? `
              <tr class="pay"><td>Dibayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
              <tr class="pay bold"><td>Kembalian</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
              ` : ''}` : ''}
            </table>
          </div>
        </div>
        ${data.sections.footer_text ? `<div class="footer-line">${data.footerText}</div>` : ''}
      `;
    }
  },

  // CF-4: Formal Resmi — outer border frame, letterhead centered store header,
  // two-col invoice info, full-border items table, summary box, kasir signature line
  'cf-4': {
    name: 'Formal Resmi',
    width: 'cf',
    render: (data) => {
      const fs = ({ '9px': '11px', '10px': '13px', '11px': '15px' }[data.fontSize] || '13px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: ${fs}; width: ${data.widthPx}px; padding: 0; line-height: 1.5; color: #000; }
          .outer { border: 2px solid #000; margin: 10px; padding: 15px 20px; }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          .letterhead { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 12px; }
          .lh-name { font-size: 1.6em; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
          .lh-sub  { font-size: 0.9em; }
          .sec-title { font-weight: bold; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; margin: 12px 0 6px; padding-bottom: 3px; }
          .two-col { display: flex; gap: 20px; }
          .two-col > div { flex: 1; }
          .kv { width: 100%; border-collapse: collapse; }
          .kv td.k { font-weight: bold; width: 42%; white-space: nowrap; padding: 1px 0; }
          .kv td.sep { width: 8px; padding: 1px 0; }
          .kv td.v { padding: 1px 0; }
          table.items { width: 100%; border-collapse: collapse; margin: 8px 0; }
          table.items th { border: 1px solid #000; padding: 7px 8px; text-align: left; }
          table.items th.right  { text-align: right; }
          table.items th.center { text-align: center; }
          table.items td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: top; }
          table.items td.right  { text-align: right; }
          table.items td.center { text-align: center; }
          table.items tfoot td { border: 1px solid #000; font-weight: bold; padding: 6px 8px; background: #f0f0f0; }
          .sum-area { display: flex; justify-content: flex-end; margin-top: 12px; }
          table.sum { width: 42%; border-collapse: collapse; }
          table.sum td { padding: 4px 8px; border-bottom: 1px solid #eee; }
          table.sum td.right { text-align: right; }
          table.sum .total td { font-weight: bold; font-size: 1.1em; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 8px; }
          table.sum .pay td { font-size: 0.9em; }
          .sign-area { display: flex; justify-content: flex-end; margin-top: 30px; }
          .sign-box { text-align: center; width: 200px; }
          .sign-line { border-bottom: 1px solid #000; height: 50px; margin-bottom: 4px; }
          .sign-label { font-size: 0.85em; }
          .footer-line { border-top: 1px dashed #000; padding-top: 8px; margin-top: 12px; text-align: center; font-size: 0.9em; }
        </style>

        <div class="outer">
          ${data.sections.logo ? data.logoHTML : ''}
          ${data.sections.store_name ? `
          <div class="letterhead">
            <div class="lh-name">${data.storeName}</div>
            ${data.sections.store_address ? `<div class="lh-sub">${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone   ? `<div class="lh-sub">Telp: ${data.storePhone}</div>` : ''}
            ${data.sections.header_text   ? `<div class="lh-sub" style="font-style:italic;margin-top:4px;">${data.headerText}</div>` : ''}
          </div>
          ` : `
            ${data.sections.store_address ? `<div class="center">${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone   ? `<div class="center">Telp: ${data.storePhone}</div>` : ''}
            ${data.sections.header_text   ? `<div class="center" style="font-style:italic;">${data.headerText}</div>` : ''}
          `}

          ${data.sections.invoice_info ? `
          <div class="sec-title">Informasi Transaksi</div>
          <div class="two-col">
            <div>
              <table class="kv">
                <tr><td class="k">No. Faktur</td><td class="sep">:</td><td class="v">${data.invoiceNumber}</td></tr>
                <tr><td class="k">Tanggal</td><td class="sep">:</td><td class="v">${data.date}</td></tr>
                <tr><td class="k">Kasir</td><td class="sep">:</td><td class="v">${data.cashierName}</td></tr>
                ${data.notes ? `<tr><td class="k">Catatan</td><td class="sep">:</td><td class="v"><i>${data.notes}</i></td></tr>` : ''}
              </table>
            </div>
            <div>
              ${data.customerName ? `
              <table class="kv">
                <tr><td class="k">Pelanggan</td><td class="sep">:</td><td class="v">${data.customerName}</td></tr>
                ${data.customerAddress ? `<tr><td class="k">Alamat</td><td class="sep">:</td><td class="v">${data.customerAddress}</td></tr>` : ''}
              </table>` : ''}
            </div>
          </div>
          ` : ''}

          <div class="sec-title">Rincian Barang</div>
          <table class="items">
            <thead>
              <tr>
                <th style="width:4%">No</th>
                <th style="width:49%">Nama Barang</th>
                <th class="center" style="width:9%">Qty</th>
                <th class="right" style="width:19%">Harga Satuan</th>
                <th class="right" style="width:19%">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name}</td>
                  <td class="center">${item.qty}</td>
                  <td class="right">${data.formatCurrency(item.price)}</td>
                  <td class="right">${data.formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="right">${data.items.length} jenis, ${totalQty} unit</td>
                <td class="center">${totalQty}</td>
                <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="sum-area">
            <table class="sum">
              <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
              ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
              ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak / PPn</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
              <tr class="total"><td>TOTAL BAYAR</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
              ${data.sections.payment_info ? `
              <tr class="pay"><td>Metode Bayar</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
              ${data.paymentMethod === 'cash' ? `
              <tr class="pay"><td>Dibayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
              <tr class="pay bold"><td>Kembalian</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
              ` : ''}` : ''}
            </table>
          </div>

          <div class="sign-area">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">Kasir / Petugas</div>
            </div>
          </div>
          ${data.sections.footer_text ? `<div class="footer-line">${data.footerText}</div>` : ''}
        </div>
      `;
    }
  },

  // CF-5: Ringkas CF — minimal single-line header (store left, contact right),
  // compact invoice row, clean thin-border table, no background fills
  'cf-5': {
    name: 'Ringkas CF',
    width: 'cf',
    render: (data) => {
      const fs = ({ '9px': '11px', '10px': '13px', '11px': '15px' }[data.fontSize] || '13px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: ${fs}; width: ${data.widthPx}px; padding: 12px 20px; line-height: 1.4; color: #000; }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          .sm { font-size: 0.88em; }
          .store-row { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; gap: 20px; }
          .store-name { font-size: 1.3em; font-weight: bold; margin: 0 0 2px; }
          .store-right { text-align: right; }
          .inv-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          table.items { width: 100%; border-collapse: collapse; margin: 8px 0; }
          table.items th { border-bottom: 2px solid #000; padding: 5px 6px; text-align: left; font-size: 0.85em; text-transform: uppercase; }
          table.items th.right  { text-align: right; }
          table.items th.center { text-align: center; }
          table.items td { padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
          table.items td.right  { text-align: right; }
          table.items td.center { text-align: center; }
          table.items tfoot td { border-top: 2px solid #000; font-weight: bold; padding: 5px 6px; }
          .bottom-row { display: flex; justify-content: flex-end; margin-top: 8px; }
          table.sum { width: 38%; border-collapse: collapse; }
          table.sum td { padding: 3px 6px; }
          table.sum td.right { text-align: right; }
          table.sum .total td { font-weight: bold; font-size: 1.05em; border-top: 1px solid #000; padding-top: 5px; }
          table.sum .pay td { font-size: 0.88em; }
          .footer { text-align: center; font-size: 0.85em; border-top: 1px dashed #000; padding-top: 6px; margin-top: 12px; }
        </style>

        <div class="store-row">
          <div>
            ${data.sections.logo ? data.logoHTML : ''}
            ${data.sections.store_name  ? `<div class="store-name">${data.storeName}</div>` : ''}
            ${data.sections.header_text ? `<div class="sm" style="font-style:italic;">${data.headerText}</div>` : ''}
          </div>
          <div class="store-right sm">
            ${data.sections.store_address ? `<div>${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone   ? `<div>Telp: ${data.storePhone}</div>` : ''}
          </div>
        </div>

        ${data.sections.invoice_info ? `
        <div class="inv-row sm">
          <div>
            <div>No: <b>${data.invoiceNumber}</b></div>
            <div>${data.date} | Kasir: ${data.cashierName}</div>
            ${data.notes ? `<div><i>${data.notes}</i></div>` : ''}
          </div>
          <div class="right">
            ${data.customerName    ? `<div>Kpd: <b>${data.customerName}</b></div>` : ''}
            ${data.customerAddress ? `<div>${data.customerAddress}</div>` : ''}
          </div>
        </div>
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th style="width:4%">No</th>
              <th style="width:49%">Nama Barang</th>
              <th class="center" style="width:9%">Qty</th>
              <th class="right" style="width:19%">Harga</th>
              <th class="right" style="width:19%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.name}</td>
                <td class="center">${item.qty}</td>
                <td class="right">${data.formatCurrency(item.price)}</td>
                <td class="right">${data.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">${data.items.length} item</td>
              <td class="center">${totalQty}</td>
              <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="bottom-row">
          <table class="sum">
            <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
            ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
            ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
            <tr class="total"><td>TOTAL</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
            ${data.sections.payment_info ? `
            <tr class="pay"><td>Metode</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
            ${data.paymentMethod === 'cash' ? `
            <tr class="pay"><td>Dibayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
            <tr class="pay bold"><td>Kembali</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
            ` : ''}` : ''}
          </table>
        </div>
        ${data.sections.footer_text ? `<div class="footer">${data.footerText}</div>` : ''}
      `;
    }
  },

  // CF-6: Modern Bersih — gray section backgrounds (header, invoice bar, summary bar),
  // dark-header table, clean sectioned layout with no outer border
  'cf-6': {
    name: 'Modern Bersih',
    width: 'cf',
    render: (data) => {
      const fs = ({ '9px': '11px', '10px': '13px', '11px': '15px' }[data.fontSize] || '13px');
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: ${fs}; width: ${data.widthPx}px; padding: 0; line-height: 1.5; color: #000; }
          .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
          .sm { font-size: 0.88em; }
          .sec-hdr { background: #f0f0f0; border-bottom: 2px solid #000; padding: 12px 20px; }
          .store-name { font-size: 1.5em; font-weight: bold; margin: 0 0 2px; }
          .store-sub  { font-size: 0.9em; }
          .sec-inv { display: flex; border-bottom: 1px solid #ccc; }
          .inv-col { flex: 1; padding: 10px 20px; }
          .inv-col:first-child { border-right: 1px solid #ccc; }
          .inv-col .col-title { font-size: 0.8em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 5px; }
          .kv { width: 100%; border-collapse: collapse; }
          .kv td.k { font-weight: bold; width: 40%; font-size: 0.9em; padding: 1px 0; }
          .kv td.sep { width: 8px; font-size: 0.9em; padding: 1px 0; }
          .kv td.v { font-size: 0.9em; padding: 1px 0; }
          .sec-items { padding: 0 20px; }
          table.items { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table.items thead th { background: #333; color: #fff; padding: 7px 8px; text-align: left; font-size: 0.88em; }
          table.items thead th.right  { text-align: right; }
          table.items thead th.center { text-align: center; }
          table.items tbody tr:nth-child(even) { background: #fafafa; }
          table.items tbody td { padding: 5px 8px; border-bottom: 1px solid #ebebeb; vertical-align: top; }
          table.items tbody td.right  { text-align: right; }
          table.items tbody td.center { text-align: center; }
          table.items tfoot { background: #f0f0f0; }
          table.items tfoot td { padding: 6px 8px; border-top: 2px solid #333; font-weight: bold; }
          .sec-sum { background: #f0f0f0; border-top: 1px solid #ccc; padding: 12px 20px; display: flex; justify-content: flex-end; }
          table.sum { width: 40%; border-collapse: collapse; }
          table.sum td { padding: 3px 8px; }
          table.sum td.right { text-align: right; }
          table.sum .total td { font-size: 1.1em; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 8px; }
          table.sum .pay td { font-size: 0.9em; }
          .sec-footer { padding: 8px 20px; border-top: 1px dashed #000; text-align: center; font-size: 0.88em; font-style: italic; }
        </style>

        <div class="sec-hdr">
          ${data.sections.logo ? data.logoHTML : ''}
          ${data.sections.store_name    ? `<div class="store-name">${data.storeName}</div>` : ''}
          ${data.sections.store_address ? `<div class="store-sub">${data.storeAddress}</div>` : ''}
          ${data.sections.store_phone   ? `<div class="store-sub">Telp: ${data.storePhone}</div>` : ''}
          ${data.sections.header_text   ? `<div class="store-sub" style="font-style:italic;margin-top:4px;">${data.headerText}</div>` : ''}
        </div>

        ${data.sections.invoice_info ? `
        <div class="sec-inv">
          <div class="inv-col">
            <div class="col-title">Info Transaksi</div>
            <table class="kv">
              <tr><td class="k">No. Faktur</td><td class="sep">:</td><td class="v">${data.invoiceNumber}</td></tr>
              <tr><td class="k">Tanggal</td><td class="sep">:</td><td class="v">${data.date}</td></tr>
              <tr><td class="k">Kasir</td><td class="sep">:</td><td class="v">${data.cashierName}</td></tr>
              ${data.notes ? `<tr><td class="k">Catatan</td><td class="sep">:</td><td class="v"><i>${data.notes}</i></td></tr>` : ''}
            </table>
          </div>
          <div class="inv-col">
            <div class="col-title">Data Pelanggan</div>
            ${data.customerName ? `
            <table class="kv">
              <tr><td class="k">Nama</td><td class="sep">:</td><td class="v">${data.customerName}</td></tr>
              ${data.customerAddress ? `<tr><td class="k">Alamat</td><td class="sep">:</td><td class="v">${data.customerAddress}</td></tr>` : ''}
            </table>
            ` : `<div class="sm" style="color:#888;font-style:italic;">Pelanggan umum</div>`}
          </div>
        </div>
        ` : ''}

        <div class="sec-items">
          <table class="items">
            <thead>
              <tr>
                <th style="width:4%">No</th>
                <th style="width:49%">Nama Barang</th>
                <th class="center" style="width:9%">Qty</th>
                <th class="right" style="width:19%">Harga Satuan</th>
                <th class="right" style="width:19%">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name}</td>
                  <td class="center">${item.qty}</td>
                  <td class="right">${data.formatCurrency(item.price)}</td>
                  <td class="right">${data.formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">${data.items.length} jenis, ${totalQty} unit</td>
                <td class="center">${totalQty}</td>
                <td class="right bold" colspan="2">${data.formatCurrency(data.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="sec-sum">
          <table class="sum">
            <tr><td>Subtotal</td><td class="right">${data.formatCurrency(data.subtotal)}</td></tr>
            ${data.sections.discount_line && data.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- ${data.formatCurrency(data.discountAmount)}</td></tr>` : ''}
            ${data.sections.tax_line && data.taxAmount > 0 ? `<tr><td>Pajak / PPn</td><td class="right">${data.formatCurrency(data.taxAmount)}</td></tr>` : ''}
            <tr class="total"><td>TOTAL BAYAR</td><td class="right">${data.formatCurrency(data.total)}</td></tr>
            ${data.sections.payment_info ? `
            <tr class="pay"><td>Metode Bayar</td><td class="right">${data.paymentMethod === 'cash' ? 'Tunai' : data.paymentMethod === 'transfer' ? 'Transfer' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod}</td></tr>
            ${data.paymentMethod === 'cash' ? `
            <tr class="pay"><td>Dibayar</td><td class="right">${data.formatCurrency(data.amountPaid)}</td></tr>
            <tr class="pay bold"><td>Kembalian</td><td class="right">${data.formatCurrency(data.changeAmount)}</td></tr>
            ` : ''}` : ''}
          </table>
        </div>
        ${data.sections.footer_text ? `<div class="sec-footer">${data.footerText}</div>` : ''}
      `;
    }
  },

  // ==========================================
  // 80mm Templates - Optimized for HPRT 80mm
  // Resolution: 203 DPI, 640 dots width
  // ==========================================
  '80mm-1': {
    name: 'Standard 80mm (HPRT Optimized)',
    width: '80mm',
    render: (data) => `
      <style>
        /* HPRT 80mm Optimized: 203 DPI, thermal direct */
        body { 
          font-family: 'Courier New', 'Courier', monospace; 
          font-size: 14px;  /* Optimal for HPRT 80mm width */
          width: ${data.widthPx}px; 
          padding: 10px;
          padding-top: 18mm;  /* Spasi jari di atas header */
          line-height: 1.4; 
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed black; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        th { 
          border-bottom: 1px solid black; 
          text-align: left; 
          padding: 5px 3px;
          font-size: 0.9em;
        }
        td { 
          padding: 4px 3px;
          font-size: 0.95em;
        }
        th.center, td.center { text-align: center; }
        th.right, td.right { text-align: right; }
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

// 58mm Variations - Updated for 4-column layout
templates['58mm-4'] = createVariation('58mm-1', { name: 'Big Header', css: '.center.bold { font-size: 1.5em; text-transform: uppercase; }' });
templates['58mm-5'] = createVariation('58mm-2', { name: 'Extra Compact', css: 'body { font-size: 10px; } th, td { padding: 1px !important; }' });
templates['58mm-6'] = createVariation('58mm-3', { name: 'Boxed Total', css: '.header-box { background: #f5f5f5; }' });
templates['58mm-7'] = createVariation('58mm-2', { name: 'Eco (Small)', css: 'body { font-size: 10px; } .line { border-top: 1px dotted #ccc; }' });
templates['58mm-8'] = createVariation('58mm-3', { name: 'Outlined (Formal)', css: '.header-box { border: 2px solid #000; background: #fff; } body { border: 1px solid #ddd; padding: 5px; }' });

// 80mm Variations
templates['80mm-2'] = createVariation('80mm-1', { name: 'Corporate', css: 'body { font-family: "Times New Roman", serif; } .bold { font-family: Arial, sans-serif; }' });
templates['80mm-3'] = createVariation('80mm-1', { name: 'Restaurant (Centered)', css: 'table { text-align: center; } th, td, .right { text-align: center; }' });
templates['80mm-4'] = createVariation('80mm-1', { name: 'Striped', css: 'tr:nth-child(even) { background-color: #eee; }' });
templates['80mm-5'] = createVariation('80mm-1', { name: 'Large Text', css: 'body { font-size: 14px; }' });
templates['80mm-6'] = createVariation('80mm-1', { name: 'Boxed', css: 'body { border: 1px solid black; min-height: 500px; padding: 15px; }' });
templates['80mm-7'] = createVariation('80mm-1', { name: 'Elegant', css: '.line { border-top: 1px double black; border-bottom: 2px solid black; height: 3px; }' });
templates['80mm-8'] = createVariation('80mm-1', { name: 'Minimal', css: '.line { display: none; } th { border-bottom: 2px solid black; }' });


// Import thermal-optimized templates
const { thermalTemplates } = require('./receipt_templates_thermal');

// Merge all templates into main templates
Object.assign(templates, thermalTemplates);

module.exports = {
  getTemplate: (id) => templates[id] || templates['58mm-1'],
  getAllTemplates: () => Object.entries(templates).map(([id, t]) => ({ id, name: t.name, width: t.width }))
};
