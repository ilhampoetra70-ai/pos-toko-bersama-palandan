export function formatCurrency(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

/**
 * Parse timestamp dari SQLite ke Date object yang benar.
 * SQLite CURRENT_TIMESTAMP menyimpan UTC tanpa penanda timezone
 * (format: 'YYYY-MM-DD HH:MM:SS'). Tanpa normalisasi, V8/Electron
 * memparsing string ini sebagai waktu lokal sehingga meleset
 * sejumlah offset timezone (misal 7 jam untuk WIB).
 *
 * Solusi: tambahkan 'Z' untuk memaksa parsing sebagai UTC,
 * lalu JavaScript otomatis mengkonversi ke waktu lokal saat ditampilkan.
 */
function parseDbDate(dateStr) {
  if (!dateStr) return null;
  // Jika sudah ada penanda timezone (Z atau ±HH:MM), parse langsung
  if (/Z|[+-]\d{2}:?\d{2}$/.test(String(dateStr))) {
    return new Date(dateStr);
  }
  // SQLite format 'YYYY-MM-DD HH:MM:SS' → tambah T dan Z untuk UTC
  return new Date(String(dateStr).replace(' ', 'T') + 'Z');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = parseDbDate(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = parseDbDate(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Full datetime with seconds for audit trail
export function formatDateTimeFull(dateStr) {
  if (!dateStr) return '-';
  const d = parseDbDate(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '-';
  const d = parseDbDate(dateStr);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num) {
  return Number(num || 0).toLocaleString('id-ID');
}
