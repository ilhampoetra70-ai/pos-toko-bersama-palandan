const WIDTH = 80;

function center(text, width = WIDTH) {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function line(char = '=') {
  return char.repeat(WIDTH);
}

function padRight(str, width) {
  str = String(str);
  return str.length >= width ? str.slice(0, width) : str + ' '.repeat(width - str.length);
}

function padLeft(str, width) {
  str = String(str);
  return str.length >= width ? str.slice(0, width) : ' '.repeat(width - str.length) + str;
}

function tableRow(cols, widths, aligns) {
  const cells = cols.map((col, i) => {
    const w = widths[i] - 2;
    const align = aligns ? aligns[i] : 'left';
    return align === 'right' ? padLeft(String(col), w) : padRight(String(col), w);
  });
  return '| ' + cells.join(' | ') + ' |';
}

function tableSep(widths) {
  return '+' + widths.map(w => '-'.repeat(w)).join('+') + '+';
}

function fmtCurrency(v) {
  return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
}

function fmtNum(v) {
  return Number(v || 0).toLocaleString('id-ID');
}

function buildStockAuditSection(stockAuditData) {
  if (!stockAuditData || stockAuditData.length === 0) return [];

  const lines = [];
  lines.push('');
  lines.push('  LOG PERUBAHAN STOK MANUAL');
  const auditWidths = [26, 10, 14, 18];
  lines.push('  ' + tableSep(auditWidths));
  lines.push('  ' + tableRow(['Produk', 'Jml Ubah', 'Total Ubah', 'Diubah Oleh'], auditWidths, ['left', 'right', 'right', 'left']));
  lines.push('  ' + tableSep(auditWidths));
  for (const log of stockAuditData) {
    const changeText = log.total_change > 0 ? `+${fmtNum(log.total_change)}` : fmtNum(log.total_change);
    lines.push('  ' + tableRow([log.product_name, fmtNum(log.change_count), changeText, log.user_names || '-'], auditWidths, ['left', 'right', 'right', 'left']));
  }
  lines.push('  ' + tableSep(auditWidths));
  lines.push('');
  return lines;
}

function buildTransactionLogSection(txLog) {
  if (!txLog || txLog.length === 0) return [];

  const METHOD = { cash: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer' };
  const lines = [];
  lines.push('');
  lines.push(line('-'));
  lines.push(center('LOG TRANSAKSI'));
  lines.push(line('-'));

  const txWidths = [14, 18, 10, 16, 14];
  lines.push('  ' + tableSep(txWidths));
  lines.push('  ' + tableRow(['Waktu', 'Invoice', 'Metode', 'Total', 'Kasir'], txWidths, ['left', 'left', 'left', 'right', 'left']));
  lines.push('  ' + tableSep(txWidths));

  const items = txLog.slice(0, 300);
  for (const tx of items) {
    const time = tx.created_at ? tx.created_at.slice(0, 16).replace('T', ' ') : '-';
    const method = METHOD[tx.payment_method] || tx.payment_method || '-';
    lines.push('  ' + tableRow([time, tx.invoice_number || '-', method, fmtCurrency(tx.total), tx.cashier_name || '-'], txWidths, ['left', 'left', 'left', 'right', 'left']));

    // Item detail per transaksi (indented)
    const txItems = tx.items || [];
    if (txItems.length > 0) {
      for (const item of txItems) {
        const itemLine = `    ${item.product_name} x${item.quantity}  ${fmtCurrency(item.subtotal)}`;
        lines.push(itemLine.slice(0, WIDTH));
      }
    }
  }

  lines.push('  ' + tableSep(txWidths));
  if (txLog.length > 300) {
    lines.push(`  * Ditampilkan 300 dari ${txLog.length} transaksi.`);
  }
  lines.push('');
  return lines;
}

function buildStockTrailSection(stockTrailData) {
  if (!stockTrailData || stockTrailData.length === 0) return [];

  const lines = [];
  lines.push('');
  lines.push('  LOG MUTASI STOK (HISTORI PERGERAKAN)');
  const trailWidths = [14, 20, 10, 16, 8];
  lines.push('  ' + tableSep(trailWidths));
  lines.push('  ' + tableRow(['Waktu', 'Produk', 'Event', 'Alur', 'Ubah'], trailWidths, ['left', 'left', 'left', 'right', 'right']));
  lines.push('  ' + tableSep(trailWidths));
  const items = stockTrailData.slice(0, 100);
  for (const t of items) {
    const time = t.created_at ? t.created_at.slice(5, 16).replace('T', ' ') : '';
    const flow = `${t.quantity_before}->${t.quantity_after}`;
    const change = t.quantity_change > 0 ? `+${fmtNum(t.quantity_change)}` : fmtNum(t.quantity_change);
    lines.push('  ' + tableRow([time, t.product_name, t.event_type, flow, change], trailWidths, ['left', 'left', 'left', 'right', 'right']));
  }
  lines.push('  ' + tableSep(trailWidths));
  if (stockTrailData.length > 100) {
    lines.push(`  ... dan ${stockTrailData.length - 100} entri lainnya`);
  }
  lines.push('');
  return lines;
}

export function buildSalesPlainText(salesData, hourlyData, dateFrom, dateTo, stockAuditData, stockTrailData) {
  const d = salesData;
  const lines = [];

  lines.push(line('='));
  lines.push(center('RINGKASAN PENJUALAN'));
  lines.push(center(`${dateFrom} s/d ${dateTo}`));
  lines.push(line('='));
  lines.push('');

  lines.push(`  Total Pendapatan    : ${fmtCurrency(d.summary.revenue)}`);
  lines.push(`  Jumlah Transaksi    : ${fmtNum(d.summary.count)}`);
  lines.push(`  Rata-rata Transaksi : ${fmtCurrency(d.summary.average)}`);
  lines.push('');

  // Payment methods
  lines.push('  METODE PEMBAYARAN');
  const payWidths = [24, 14, 24];
  lines.push('  ' + tableSep(payWidths));
  lines.push('  ' + tableRow(['Metode', 'Jumlah', 'Total'], payWidths, ['left', 'right', 'right']));
  lines.push('  ' + tableSep(payWidths));
  for (const p of d.paymentBreakdown) {
    const name = p.payment_method === 'cash' ? 'Tunai' : p.payment_method;
    lines.push('  ' + tableRow([name, fmtNum(p.count), fmtCurrency(p.total)], payWidths, ['left', 'right', 'right']));
  }
  lines.push('  ' + tableSep(payWidths));
  lines.push('');

  // Top products
  lines.push('  10 PRODUK TERLARIS');
  const topWidths = [4, 30, 10, 20];
  lines.push('  ' + tableSep(topWidths));
  lines.push('  ' + tableRow(['#', 'Produk', 'Qty', 'Total'], topWidths, ['right', 'left', 'right', 'right']));
  lines.push('  ' + tableSep(topWidths));
  d.topProducts.forEach((p, i) => {
    lines.push('  ' + tableRow([i + 1, p.product_name, fmtNum(p.qty), fmtCurrency(p.total)], topWidths, ['right', 'left', 'right', 'right']));
  });
  lines.push('  ' + tableSep(topWidths));
  lines.push('');

  // Hourly pattern
  if (hourlyData && hourlyData.length > 0) {
    lines.push('  POLA PENJUALAN PER JAM');
    const hourWidths = [8, 14, 20];
    lines.push('  ' + tableSep(hourWidths));
    lines.push('  ' + tableRow(['Jam', 'Transaksi', 'Total'], hourWidths, ['left', 'right', 'right']));
    lines.push('  ' + tableSep(hourWidths));
    for (const h of hourlyData) {
      if (h.count > 0) {
        lines.push('  ' + tableRow([`${String(h.hour).padStart(2, '0')}:00`, fmtNum(h.count), fmtCurrency(h.total)], hourWidths, ['left', 'right', 'right']));
      }
    }
    lines.push('  ' + tableSep(hourWidths));
    lines.push('');
  }

  // Daily breakdown
  lines.push('  PENJUALAN HARIAN');
  const dayWidths = [14, 14, 24];
  lines.push('  ' + tableSep(dayWidths));
  lines.push('  ' + tableRow(['Tanggal', 'Transaksi', 'Total'], dayWidths, ['left', 'right', 'right']));
  lines.push('  ' + tableSep(dayWidths));
  for (const day of d.dailyBreakdown) {
    lines.push('  ' + tableRow([day.date, fmtNum(day.count), fmtCurrency(day.total)], dayWidths, ['left', 'right', 'right']));
  }
  lines.push('  ' + tableSep(dayWidths));
  lines.push('');

  // Transaction log
  lines.push(...buildTransactionLogSection(d.transactionLog));

  // Stock audit log
  lines.push(...buildStockAuditSection(stockAuditData));

  // Stock trail log
  lines.push(...buildStockTrailSection(stockTrailData));

  lines.push(line('-'));
  lines.push(center(`Dicetak: ${new Date().toLocaleString('id-ID')}`));
  lines.push(line('-'));

  return lines.join('\n');
}

export function buildProfitPlainText(profitData, dateFrom, dateTo, stockAuditData, stockTrailData) {
  const d = profitData;
  const lines = [];

  lines.push(line('='));
  lines.push(center('LAPORAN LABA'));
  lines.push(center(`${dateFrom} s/d ${dateTo}`));
  lines.push(line('='));
  lines.push('');

  lines.push(`  Total Pendapatan : ${fmtCurrency(d.totals.revenue)}`);
  lines.push(`  Total Modal      : ${fmtCurrency(d.totals.cost)}`);
  lines.push(`  Laba Kotor       : ${fmtCurrency(d.totals.profit)}`);
  lines.push(`  Margin           : ${d.totals.margin.toFixed(1)}%`);
  lines.push('');

  lines.push('  DETAIL LABA PER PRODUK');
  const colWidths = [22, 6, 14, 14, 14, 8];
  lines.push('  ' + tableSep(colWidths));
  lines.push('  ' + tableRow(['Produk', 'Qty', 'Pendapatan', 'Modal', 'Laba', 'Margin'], colWidths, ['left', 'right', 'right', 'right', 'right', 'right']));
  lines.push('  ' + tableSep(colWidths));
  for (const p of d.products) {
    const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) + '%' : '0.0%';
    lines.push('  ' + tableRow([
      p.product_name, fmtNum(p.qty), fmtCurrency(p.revenue),
      fmtCurrency(p.total_cost), fmtCurrency(p.profit), margin
    ], colWidths, ['left', 'right', 'right', 'right', 'right', 'right']));
  }
  lines.push('  ' + tableSep(colWidths));
  const totalMargin = d.totals.margin.toFixed(1) + '%';
  lines.push('  ' + tableRow([
    'TOTAL', '', fmtCurrency(d.totals.revenue),
    fmtCurrency(d.totals.cost), fmtCurrency(d.totals.profit), totalMargin
  ], colWidths, ['left', 'right', 'right', 'right', 'right', 'right']));
  lines.push('  ' + tableSep(colWidths));
  lines.push('');

  // Stock audit log
  lines.push(...buildStockAuditSection(stockAuditData));

  // Stock trail log
  lines.push(...buildStockTrailSection(stockTrailData));

  lines.push(line('-'));
  lines.push(center(`Dicetak: ${new Date().toLocaleString('id-ID')}`));
  lines.push(line('-'));

  return lines.join('\n');
}

export function buildComparisonPlainText(comparisonData, dateFrom, dateTo, dateFrom2, dateTo2, stockAuditData, stockTrailData) {
  const d = comparisonData;
  const lines = [];

  lines.push(line('='));
  lines.push(center('PERBANDINGAN PERIODE'));
  lines.push(center(`A: ${dateFrom} s/d ${dateTo}`));
  lines.push(center(`B: ${dateFrom2} s/d ${dateTo2}`));
  lines.push(line('='));
  lines.push('');

  const fmtDelta = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

  const colWidths = [22, 18, 18, 12];
  lines.push('  ' + tableSep(colWidths));
  lines.push('  ' + tableRow(['Metrik', 'Periode A', 'Periode B', 'Perubahan'], colWidths, ['left', 'right', 'right', 'right']));
  lines.push('  ' + tableSep(colWidths));
  lines.push('  ' + tableRow(['Pendapatan', fmtCurrency(d.periodA.revenue), fmtCurrency(d.periodB.revenue), fmtDelta(d.delta.revenue)], colWidths, ['left', 'right', 'right', 'right']));
  lines.push('  ' + tableRow(['Jml Transaksi', fmtNum(d.periodA.count), fmtNum(d.periodB.count), fmtDelta(d.delta.count)], colWidths, ['left', 'right', 'right', 'right']));
  lines.push('  ' + tableRow(['Rata-rata', fmtCurrency(d.periodA.average), fmtCurrency(d.periodB.average), fmtDelta(d.delta.average)], colWidths, ['left', 'right', 'right', 'right']));
  lines.push('  ' + tableSep(colWidths));
  lines.push('');

  lines.push(...buildStockAuditSection(stockAuditData));
  lines.push(...buildStockTrailSection(stockTrailData));

  lines.push(line('-'));
  lines.push(center(`Dicetak: ${new Date().toLocaleString('id-ID')}`));
  lines.push(line('-'));

  return lines.join('\n');
}

export function buildComprehensivePlainText(comprehensiveData, dateFrom, dateTo, stockAuditData, stockTrailData) {
  const c = comprehensiveData;
  const lines = [];

  lines.push(line('='));
  lines.push(center('LAPORAN LENGKAP'));
  lines.push(center(`${dateFrom} s/d ${dateTo}`));
  lines.push(line('='));
  lines.push('');

  // Executive summary
  lines.push(line('-'));
  lines.push(center('RINGKASAN EKSEKUTIF'));
  lines.push(line('-'));
  lines.push('');
  lines.push(`  Total Pendapatan    : ${fmtCurrency(c.sales.summary.revenue)}`);
  lines.push(`  Jumlah Transaksi    : ${fmtNum(c.sales.summary.count)}`);
  lines.push(`  Rata-rata Transaksi : ${fmtCurrency(c.sales.summary.average)}`);
  lines.push(`  Total Laba          : ${fmtCurrency(c.profit.totals.profit)}`);
  lines.push(`  Margin Laba         : ${c.profit.totals.margin.toFixed(1)}%`);
  lines.push(`  Total Modal         : ${fmtCurrency(c.profit.totals.cost)}`);

  const topProduct = c.sales.topProducts[0];
  if (topProduct) {
    lines.push(`  Produk Terlaris     : ${topProduct.product_name} (${fmtNum(topProduct.qty)} qty)`);
  }
  const peakHour = [...c.hourly].sort((a, b) => b.total - a.total)[0];
  if (peakHour && peakHour.total > 0) {
    lines.push(`  Jam Tersibuk        : ${String(peakHour.hour).padStart(2, '0')}:00 (${fmtCurrency(peakHour.total)})`);
  }
  lines.push('');

  // Payment methods
  lines.push(line('-'));
  lines.push(center('METODE PEMBAYARAN'));
  lines.push(line('-'));
  const payWidths = [24, 14, 24];
  lines.push('  ' + tableSep(payWidths));
  lines.push('  ' + tableRow(['Metode', 'Jumlah', 'Total'], payWidths, ['left', 'right', 'right']));
  lines.push('  ' + tableSep(payWidths));
  for (const p of c.sales.paymentBreakdown) {
    const name = p.payment_method === 'cash' ? 'Tunai' : p.payment_method;
    lines.push('  ' + tableRow([name, fmtNum(p.count), fmtCurrency(p.total)], payWidths, ['left', 'right', 'right']));
  }
  lines.push('  ' + tableSep(payWidths));
  lines.push('');

  // Top 5 & Bottom 5 products
  lines.push(line('-'));
  lines.push(center('PERFORMA PRODUK'));
  lines.push(line('-'));
  lines.push('');
  lines.push('  TOP 5 PRODUK TERLARIS');
  const prodWidths = [4, 30, 10, 20];
  lines.push('  ' + tableSep(prodWidths));
  lines.push('  ' + tableRow(['#', 'Produk', 'Qty', 'Total'], prodWidths, ['right', 'left', 'right', 'right']));
  lines.push('  ' + tableSep(prodWidths));
  c.sales.topProducts.slice(0, 5).forEach((p, i) => {
    lines.push('  ' + tableRow([i + 1, p.product_name, fmtNum(p.qty), fmtCurrency(p.total)], prodWidths, ['right', 'left', 'right', 'right']));
  });
  lines.push('  ' + tableSep(prodWidths));
  lines.push('');

  if (c.bottomProducts && c.bottomProducts.length > 0) {
    lines.push('  BOTTOM 5 PRODUK PALING SEDIKIT TERJUAL');
    lines.push('  ' + tableSep(prodWidths));
    lines.push('  ' + tableRow(['#', 'Produk', 'Qty', 'Total'], prodWidths, ['right', 'left', 'right', 'right']));
    lines.push('  ' + tableSep(prodWidths));
    c.bottomProducts.forEach((p, i) => {
      lines.push('  ' + tableRow([i + 1, p.product_name, fmtNum(p.qty), fmtCurrency(p.total)], prodWidths, ['right', 'left', 'right', 'right']));
    });
    lines.push('  ' + tableSep(prodWidths));
    lines.push('');
  }

  // Hourly pattern
  lines.push(line('-'));
  lines.push(center('POLA PENJUALAN PER JAM'));
  lines.push(line('-'));
  const hourWidths = [8, 14, 20];
  lines.push('  ' + tableSep(hourWidths));
  lines.push('  ' + tableRow(['Jam', 'Transaksi', 'Total'], hourWidths, ['left', 'right', 'right']));
  lines.push('  ' + tableSep(hourWidths));
  for (const h of c.hourly) {
    if (h.count > 0) {
      lines.push('  ' + tableRow([`${String(h.hour).padStart(2, '0')}:00`, fmtNum(h.count), fmtCurrency(h.total)], hourWidths, ['left', 'right', 'right']));
    }
  }
  lines.push('  ' + tableSep(hourWidths));
  lines.push('');

  // Profit detail
  lines.push(line('-'));
  lines.push(center('DETAIL LABA PER PRODUK'));
  lines.push(line('-'));
  const profWidths = [22, 6, 14, 14, 14, 8];
  lines.push('  ' + tableSep(profWidths));
  lines.push('  ' + tableRow(['Produk', 'Qty', 'Pendapatan', 'Modal', 'Laba', 'Margin'], profWidths, ['left', 'right', 'right', 'right', 'right', 'right']));
  lines.push('  ' + tableSep(profWidths));
  for (const p of c.profit.products) {
    const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) + '%' : '0.0%';
    lines.push('  ' + tableRow([
      p.product_name, fmtNum(p.qty), fmtCurrency(p.revenue),
      fmtCurrency(p.total_cost), fmtCurrency(p.profit), margin
    ], profWidths, ['left', 'right', 'right', 'right', 'right', 'right']));
  }
  lines.push('  ' + tableSep(profWidths));
  lines.push('');

  // Transaction log summary
  if (c.transactionLog && c.transactionLog.length > 0) {
    lines.push(line('-'));
    lines.push(center('LOG TRANSAKSI'));
    lines.push(line('-'));
    const txWidths = [16, 20, 10, 14, 12];
    lines.push('  ' + tableSep(txWidths));
    lines.push('  ' + tableRow(['Invoice', 'Waktu', 'Metode', 'Total', 'Kasir'], txWidths, ['left', 'left', 'left', 'right', 'left']));
    lines.push('  ' + tableSep(txWidths));
    for (const tx of c.transactionLog.slice(0, 50)) {
      const time = tx.created_at ? tx.created_at.slice(0, 19) : '';
      const method = tx.payment_method === 'cash' ? 'Tunai' : (tx.payment_method || '');
      lines.push('  ' + tableRow([
        tx.invoice_number || '', time, method,
        fmtCurrency(tx.total), tx.cashier_name || ''
      ], txWidths, ['left', 'left', 'left', 'right', 'left']));
    }
    lines.push('  ' + tableSep(txWidths));
    if (c.transactionLog.length > 50) {
      lines.push(`  ... dan ${c.transactionLog.length - 50} transaksi lainnya`);
    }
    lines.push('');
  }

  // Stock audit log
  if (stockAuditData && stockAuditData.length > 0) {
    lines.push(line('-'));
    lines.push(center('LOG PERUBAHAN STOK MANUAL'));
    lines.push(line('-'));
    lines.push(...buildStockAuditSection(stockAuditData));
  }

  // Stock trail log
  if (stockTrailData && stockTrailData.length > 0) {
    lines.push(line('-'));
    lines.push(center('LOG MUTASI STOK (HISTORI PERGERAKAN)'));
    lines.push(line('-'));
    lines.push(...buildStockTrailSection(stockTrailData));
  }

  lines.push(line('='));
  lines.push(center(`Dicetak: ${new Date().toLocaleString('id-ID')}`));
  lines.push(line('='));

  return lines.join('\n');
}
