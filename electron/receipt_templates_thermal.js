/**
 * THERMAL PRINTER OPTIMIZED TEMPLATES
 * For Continuous Form (9.5" x 11") Dot Matrix & Thermal Printers
 * 
 * Optimizations:
 * - Font: Courier New (monospace) - compatible with Font A/B
 * - High contrast: pure black #000
 * - Page break control: prevent header cutoff
 * - Margin safety: proper padding
 * - Print-friendly: avoid background colors, use borders
 */

const thermalTemplates = {
  // ==========================================
  // CF-THERMAL-1: Simplified High-Contrast Template
  // Best for: Dot Matrix & Thermal Printers with Continuous Form
  // Font: Uses printer's built-in Font A (12x24) or Font B (9x17)
  // ==========================================
  'cf-thermal-1': {
    name: 'CF Thermal Simple (Recommended)',
    width: 'cf',
    render: (data) => {
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="color-scheme" content="only light">
          <style>
            /* === THERMAL PRINTER OPTIMIZATIONS === */
            @page {
              margin: 15mm 12mm;
              size: auto;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', 'Courier', 'Consolas', monospace;
              font-size: 13pt; /* Font A size equivalent */
              line-height: 1.3;
              color: #000000 !important;
              background: #ffffff !important;
              width: 100%;
              max-width: 210mm;
              padding: 10mm;
              padding-top: 20mm;  /* Spasi jari di atas header */
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Prevent header cutoff - keep header with first page */
            .header-section {
              page-break-inside: avoid;
              page-break-after: avoid;
              margin-bottom: 5mm;
            }
            
            .store-name {
              font-size: 18pt;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2mm;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .store-info {
              text-align: center;
              font-size: 11pt;
              margin-bottom: 1mm;
            }
            
            .divider {
              border-top: 2px solid #000;
              margin: 4mm 0;
            }
            
            .divider-thick {
              border-top: 3px solid #000;
              margin: 5mm 0;
            }
            
            /* Invoice Info */
            .invoice-info {
              width: 100%;
              margin: 4mm 0;
              page-break-inside: avoid;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
            }
            
            .info-label {
              font-weight: bold;
              min-width: 35mm;
            }
            
            .info-value {
              flex: 1;
            }
            
            /* Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 5mm 0;
              page-break-inside: auto;
            }
            
            .items-table thead {
              display: table-header-group;
            }
            
            .items-table th {
              text-align: left;
              padding: 2mm 1mm;
              border-bottom: 2px solid #000;
              font-weight: bold;
              font-size: 12pt;
            }
            
            .items-table th.right {
              text-align: right;
            }
            
            .items-table th.center {
              text-align: center;
            }
            
            .items-table td {
              padding: 1.5mm 1mm;
              border-bottom: 1px dashed #000;
              vertical-align: top;
            }
            
            .items-table td.right {
              text-align: right;
            }
            
            .items-table td.center {
              text-align: center;
            }
            
            .items-table tbody tr {
              page-break-inside: avoid;
            }
            
            .items-table tfoot td {
              padding: 2mm 1mm;
              border-top: 2px solid #000;
              font-weight: bold;
              background: #f5f5f5 !important;
            }
            
            /* Summary Section */
            .summary-section {
              width: 100%;
              margin: 5mm 0;
              page-break-inside: avoid;
            }
            
            .summary-row {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 1mm;
            }
            
            .summary-label {
              min-width: 50mm;
              text-align: right;
              padding-right: 3mm;
            }
            
            .summary-value {
              min-width: 35mm;
              text-align: right;
            }
            
            .summary-total {
              font-weight: bold;
              font-size: 14pt;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 2mm 0;
              margin: 3mm 0;
            }
            
            .summary-total .summary-label,
            .summary-total .summary-value {
              font-weight: bold;
            }
            
            /* Footer */
            .footer-section {
              margin-top: 8mm;
              padding-top: 4mm;
              border-top: 1px dashed #000;
              text-align: center;
              font-size: 11pt;
              page-break-inside: avoid;
            }
            
            .footer-text {
              margin-bottom: 2mm;
            }
            
            .thank-you {
              font-weight: bold;
              margin-top: 3mm;
            }
            
            /* Utility */
            .bold {
              font-weight: bold;
            }
            
            .center {
              text-align: center;
            }
            
            .right {
              text-align: right;
            }
            
            /* Page break utilities */
            .page-break {
              page-break-after: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <!-- HEADER - Prevent Cutoff -->
          <div class="header-section">
            ${data.sections.store_name ? `<div class="store-name">${data.storeName}</div>` : ''}
            ${data.sections.store_address ? `<div class="store-info">${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone ? `<div class="store-info">Telp: ${data.storePhone}</div>` : ''}
            ${data.sections.header_text ? `<div class="store-info" style="font-style:italic;margin-top:2mm;">${data.headerText}</div>` : ''}
          </div>
          
          <div class="divider-thick"></div>
          
          <!-- INVOICE INFO -->
          ${data.sections.invoice_info ? `
          <div class="invoice-info no-break">
            <div class="info-row">
              <span class="info-label">No. Faktur</span>
              <span class="info-value">: ${data.invoiceNumber}</span>
              <span style="margin-left:auto;">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kasir</span>
              <span class="info-value">: ${data.cashierName}</span>
            </div>
            ${data.customerName ? `
            <div class="info-row">
              <span class="info-label">Pelanggan</span>
              <span class="info-value">: ${data.customerName}</span>
            </div>
            ` : ''}
            ${data.notes ? `
            <div class="info-row">
              <span class="info-label">Catatan</span>
              <span class="info-value">: ${data.notes}</span>
            </div>
            ` : ''}
          </div>
          <div class="divider"></div>
          ` : ''}
          
          <!-- ITEMS TABLE -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width:5%">No</th>
                <th style="width:50%">Nama Barang</th>
                <th class="center" style="width:10%">Qty</th>
                <th class="right" style="width:17%">Harga</th>
                <th class="right" style="width:18%">Jumlah</th>
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
                <td colspan="2" class="right">${data.items.length} jenis, ${totalQty} pcs</td>
                <td class="center bold">${totalQty}</td>
                <td colspan="2" class="right bold">${data.formatCurrency(data.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="divider"></div>
          
          <!-- SUMMARY -->
          <div class="summary-section no-break">
            ${data.sections.discount_line && data.discountAmount > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span class="summary-value">${data.formatCurrency(data.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Diskon</span>
              <span class="summary-value">-${data.formatCurrency(data.discountAmount)}</span>
            </div>
            ` : ''}
            
            ${data.sections.tax_line && data.taxAmount > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Pajak</span>
              <span class="summary-value">${data.formatCurrency(data.taxAmount)}</span>
            </div>
            ` : ''}
            
            <div class="summary-row summary-total">
              <span class="summary-label">TOTAL BAYAR</span>
              <span class="summary-value">${data.formatCurrency(data.total)}</span>
            </div>
            
            ${data.sections.payment_info ? `
            <div style="margin-top:4mm;">
              <div class="summary-row">
                <span class="summary-label">Metode Bayar</span>
                <span class="summary-value">${data.paymentMethod === 'cash' ? 'TUNAI' : data.paymentMethod === 'transfer' ? 'TRANSFER' : data.paymentMethod === 'qris' ? 'QRIS' : data.paymentMethod.toUpperCase()}</span>
              </div>
              ${data.paymentMethod === 'cash' ? `
              <div class="summary-row">
                <span class="summary-label">Jumlah Dibayar</span>
                <span class="summary-value">${data.formatCurrency(data.amountPaid)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Kembalian</span>
                <span class="summary-value bold">${data.formatCurrency(data.changeAmount)}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          
          <!-- FOOTER -->
          ${data.sections.footer_text ? `
          <div class="footer-section">
            <div class="footer-text">${data.footerText}</div>
            <div class="thank-you">TERIMA KASIH</div>
          </div>
          ` : '<div class="footer-section"><div class="thank-you">TERIMA KASIH ATAS KUNJUNGAN ANDA</div></div>'}
        </body>
        </html>
      `;
    }
  },

  // ==========================================
  // CF-THERMAL-2: Compact Version (Font B style)
  // Smaller font for more items per page
  // ==========================================
  'cf-thermal-2': {
    name: 'CF Thermal Compact',
    width: 'cf',
    render: (data) => {
      const totalQty = data.items.reduce((s, i) => s + i.qty, 0);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 12mm 10mm; size: auto; }
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11pt; /* Smaller - Font B equivalent */
              line-height: 1.25;
              color: #000 !important;
              background: #fff !important;
              width: 100%;
              max-width: 210mm;
              padding: 8mm;
              padding-top: 18mm;  /* Spasi jari di atas header */
              -webkit-print-color-adjust: exact;
            }
            
            .header { 
              page-break-inside: avoid; 
              page-break-after: avoid;
              text-align: center;
              margin-bottom: 4mm;
            }
            
            .store-name { font-size: 16pt; font-weight: bold; margin-bottom: 1mm; }
            .store-info { font-size: 10pt; margin-bottom: 0.5mm; }
            
            .line { border-top: 1px solid #000; margin: 3mm 0; }
            .line-thick { border-top: 2px solid #000; margin: 4mm 0; }
            
            .info { margin: 3mm 0; font-size: 10pt; }
            .info-row { display: flex; margin-bottom: 0.5mm; }
            .info-label { font-weight: bold; min-width: 25mm; }
            
            table.items {
              width: 100%;
              border-collapse: collapse;
              margin: 4mm 0;
              font-size: 10pt;
            }
            
            table.items th {
              text-align: left;
              padding: 1.5mm 1mm;
              border-bottom: 1px solid #000;
              font-weight: bold;
            }
            
            table.items td {
              padding: 1mm;
              border-bottom: 0.5px dashed #000;
              vertical-align: top;
            }
            
            table.items td.right { text-align: right; }
            table.items td.center { text-align: center; }
            
            table.items tfoot td {
              padding: 2mm 1mm;
              border-top: 1px solid #000;
              font-weight: bold;
            }
            
            .summary { margin: 4mm 0; }
            .sum-row { 
              display: flex; 
              justify-content: flex-end; 
              margin-bottom: 0.5mm;
              font-size: 10pt;
            }
            .sum-label { min-width: 40mm; text-align: right; padding-right: 2mm; }
            .sum-value { min-width: 30mm; text-align: right; }
            
            .sum-total {
              font-weight: bold;
              font-size: 12pt;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 1.5mm 0;
              margin: 2mm 0;
            }
            
            .footer {
              margin-top: 6mm;
              padding-top: 3mm;
              border-top: 1px dashed #000;
              text-align: center;
              font-size: 10pt;
            }
            
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            ${data.sections.store_name ? `<div class="store-name">${data.storeName}</div>` : ''}
            ${data.sections.store_address ? `<div class="store-info">${data.storeAddress}</div>` : ''}
            ${data.sections.store_phone ? `<div class="store-info">Telp: ${data.storePhone}</div>` : ''}
          </div>
          
          <div class="line-thick"></div>
          
          ${data.sections.invoice_info ? `
          <div class="info">
            <div class="info-row"><span class="info-label">No:</span> ${data.invoiceNumber}</div>
            <div class="info-row"><span class="info-label">Tgl:</span> ${data.date}</div>
            <div class="info-row"><span class="info-label">Kasir:</span> ${data.cashierName}</div>
            ${data.customerName ? `<div class="info-row"><span class="info-label">Kpd:</span> ${data.customerName}</div>` : ''}
          </div>
          <div class="line"></div>
          ` : ''}
          
          <table class="items">
            <thead>
              <tr>
                <th style="width:5%">#</th>
                <th style="width:55%">Item</th>
                <th class="center" style="width:10%">Qty</th>
                <th class="right" style="width:30%">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.name}<br/><small>@${data.formatCurrency(item.price)}</small></td>
                  <td class="center">${item.qty}</td>
                  <td class="right">${data.formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="right">Total ${totalQty} item</td>
                <td colspan="2" class="right bold">${data.formatCurrency(data.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="summary">
            ${data.discountAmount > 0 ? `
            <div class="sum-row"><span class="sum-label">Diskon:</span><span class="sum-value">-${data.formatCurrency(data.discountAmount)}</span></div>
            ` : ''}
            <div class="sum-row sum-total"><span class="sum-label">TOTAL:</span><span class="sum-value">${data.formatCurrency(data.total)}</span></div>
            ${data.paymentMethod === 'cash' ? `
            <div class="sum-row"><span class="sum-label">Tunai:</span><span class="sum-value">${data.formatCurrency(data.amountPaid)}</span></div>
            <div class="sum-row"><span class="sum-label">Kembali:</span><span class="sum-value bold">${data.formatCurrency(data.changeAmount)}</span></div>
            ` : `<div class="sum-row"><span class="sum-label">Metode:</span><span class="sum-value">${data.paymentMethod}</span></div>`}
          </div>
          
          <div class="footer">
            ${data.sections.footer_text ? `<div>${data.footerText}</div>` : ''}
            <div style="margin-top:2mm;font-weight:bold;">TERIMA KASIH</div>
          </div>
        </body>
        </html>
      `;
    }
  }
};

// Merge with existing templates
module.exports = { thermalTemplates };
