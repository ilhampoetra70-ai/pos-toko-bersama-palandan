/**
 * Print Handler - Fungsi terpusat untuk menangani print di Electron POS
 * 
 * Masalah yang diatasi:
 * - Electron mengambil pageSize dari Windows default printer, bukan deviceName
 * - Solusi: Selalu set pageSize eksplisit berdasarkan tipe printer tujuan
 * - Dynamic height: Ukur tinggi konten aktual sebelum print
 */

const { BrowserWindow } = require('electron');

const PRINT_TIMEOUT_MS = 15000; // 15 detik timeout

// ─── KONFIGURASI PRINTER ─────────────────────────────────

const PRINTER_CONFIGS = {
  '58mm': {
    name: 'Thermal 58mm',
    width: 58000,   // 58mm dalam micrometer
    margins: { marginType: 'none' },
    scaleFactor: 100
  },
  '80mm': {
    name: 'Thermal 80mm',
    width: 80000,   // 80mm dalam micrometer
    margins: { marginType: 'none' },
    scaleFactor: 100
  },
  'cf': {
    name: 'Continuous Form',
    pageSize: 'Legal',  // CF menggunakan kertas Legal
    margins: { marginType: 'none' },
    scaleFactor: 100
  },
  'a4': {
    name: 'A4 Standard',
    pageSize: 'A4',
    margins: { marginType: 'default' },
    scaleFactor: 100
  }
};

// ─── DETEKSI TIPE PRINTER ────────────────────────────────

function detectPrinterType(deviceName) {
  if (!deviceName) return '58mm'; // Default fallback
  
  const nameLower = deviceName.toLowerCase();
  
  // Deteksi 58mm
  if (nameLower.includes('58') || 
      nameLower.includes('eppos') || 
      nameLower.includes('pos-58') ||
      (nameLower.includes('tm-t82') && !nameLower.includes('iii'))) {
    return '58mm';
  }
  
  // Deteksi 80mm
  if (nameLower.includes('80') || 
      nameLower.includes('tm-t82iii') ||
      nameLower.includes('tm-t83') ||
      nameLower.includes('hprt')) {
    return '80mm';
  }
  
  // Deteksi Continuous Form / Dot Matrix
  if (nameLower.includes('lx-300') || 
      nameLower.includes('lx-310') ||
      nameLower.includes('lq-310') ||
      nameLower.includes('dot matrix') ||
      nameLower.includes('continuous')) {
    return 'cf';
  }
  
  // Default ke 58mm untuk thermal printer umum
  return '58mm';
}

// ─── FUNGSI PRINT UTAMA ─────────────────────────────────

/**
 * Print HTML dengan konfigurasi yang tepat
 * @param {Object} options
 * @param {string} options.html - HTML content untuk dicetak
 * @param {string} options.deviceName - Nama printer tujuan
 * @param {string} options.printerType - Tipe printer (58mm, 80mm, cf, a4)
 * @param {boolean} options.silent - Silent print (true untuk POS)
 * @param {string} options.windowTitle - Judul window print (debugging)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function printHtml(options) {
  const {
    html,
    deviceName,
    printerType = detectPrinterType(deviceName),
    silent = true,
    windowTitle = 'Print Window'
  } = options;

  const config = PRINTER_CONFIGS[printerType] || PRINTER_CONFIGS['58mm'];
  
  console.log(`[PrintHandler] Starting print...`);
  console.log(`[PrintHandler] Printer: ${deviceName || 'Default'}`);
  console.log(`[PrintHandler] Type: ${printerType}`);

  const printWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    title: windowTitle,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    // Load HTML content
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    
    // Tunggu render selesai
    await new Promise(resolve => setTimeout(resolve, 500));

    // UKUR TINGGI KONTEN AKTUAL (Dynamic Height)
    let contentHeightMm = 297; // Default fallback (A4 height)
    try {
      const scrollHeight = await printWindow.webContents.executeJavaScript(
        'document.body.scrollHeight'
      );
      // Convert px to mm (1mm ≈ 3.78px at 96 DPI)
      contentHeightMm = Math.ceil(scrollHeight / 3.78);
      // Tambah margin bawah 10mm untuk safety
      contentHeightMm += 10;
      // Minimum 50mm, maximum 500mm (5 meter - safety limit)
      contentHeightMm = Math.max(50, Math.min(contentHeightMm, 500));
      console.log(`[PrintHandler] Content height: ${contentHeightMm}mm (scrollHeight: ${scrollHeight}px)`);
    } catch (e) {
      console.warn('[PrintHandler] Failed to measure content height:', e.message);
    }

    // Konfigurasi print dengan pageSize dinamis
    let printOptions;
    if (printerType === 'cf' || printerType === 'a4') {
      // CF dan A4 pakai pageSize standar
      printOptions = {
        silent: silent,
        printBackground: true,
        deviceName: deviceName || undefined,
        pageSize: config.pageSize,
        margins: config.margins,
        scaleFactor: config.scaleFactor
      };
    } else {
      // Thermal printer (58mm, 80mm) pakai dynamic height
      printOptions = {
        silent: silent,
        printBackground: true,
        deviceName: deviceName || undefined,
        pageSize: {
          width: config.width,
          height: contentHeightMm * 1000 // Convert mm to micrometer
        },
        margins: config.margins,
        scaleFactor: config.scaleFactor
      };
      console.log(`[PrintHandler] Dynamic pageSize:`, printOptions.pageSize);
    }

    // Lakukan print dengan TIMEOUT
    const printPromise = new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        printWindow.destroy();
        
        if (success) {
          console.log('[PrintHandler] Print success');
          resolve({ success: true });
        } else {
          console.error('[PrintHandler] Print failed:', failureReason);
          resolve({ 
            success: false, 
            error: translateError(failureReason)
          });
        }
      });
    });

    // Timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        printWindow.destroy();
        reject(new Error('Print timeout: printer tidak merespons setelah 15 detik'));
      }, PRINT_TIMEOUT_MS)
    );

    // Race antara print dan timeout
    return await Promise.race([printPromise, timeoutPromise]);

  } catch (err) {
    printWindow.destroy();
    console.error('[PrintHandler] Error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── TRANSLASI ERROR ────────────────────────────────────

function translateError(failureReason) {
  const errorMap = {
    'cancelled': 'Pencetakan dibatalkan oleh pengguna',
    'invalidPrinter': 'Printer tidak ditemukan. Periksa koneksi atau pilih ulang di Settings.',
    'invalidPageRange': 'Range halaman tidak valid',
    'invalidPageSize': 'Ukuran kertas tidak valid',
    'invalidDeviceName': 'Nama printer tidak valid',
    'printerNotFound': 'Printer tidak ditemukan',
    'unknown': 'Gagal mencetak. Silakan coba lagi.'
  };
  
  return errorMap[failureReason] || `Gagal mencetak: ${failureReason}`;
}

// ─── VALIDASI PRINTER ───────────────────────────────────

async function validatePrinter(webContents, deviceName) {
  try {
    const printers = await webContents.getPrintersAsync();
    const availablePrinters = printers.map(p => p.name);
    
    if (!deviceName) {
      return { valid: true, available: availablePrinters }; // Default printer
    }
    
    const exists = availablePrinters.some(name => 
      name.toLowerCase() === deviceName.toLowerCase()
    );
    
    return {
      valid: exists,
      available: availablePrinters,
      matched: exists ? deviceName : null
    };
  } catch (err) {
    console.error('[PrintHandler] Validation error:', err);
    return { valid: false, available: [], error: err.message };
  }
}

// ─── EXPORTS ────────────────────────────────────────────

module.exports = {
  printHtml,
  validatePrinter,
  detectPrinterType,
  PRINTER_CONFIGS
};
