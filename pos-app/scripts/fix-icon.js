/**
 * fix-icon.js
 * Terapkan icon ke EXE hasil build menggunakan rcedit.
 *
 * Usage:
 *   node scripts/fix-icon.js                     → fix dist-electron/win-unpacked/
 *   node scripts/fix-icon.js "path/ke/folder"    → fix folder custom
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');

// --- Cari rcedit: node_modules dulu, lalu cache electron-builder ---
function findRcedit() {
  // 1. node_modules/rcedit (installed via npm)
  const fromNpm = path.join(ROOT, 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe');
  if (fs.existsSync(fromNpm)) return fromNpm;

  // 2. Cache electron-builder (fallback)
  const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign');
  if (!fs.existsSync(cacheDir)) return null;
  const versions = fs.readdirSync(cacheDir).sort().reverse();
  for (const ver of versions) {
    const rcedit = path.join(cacheDir, ver, 'rcedit-x64.exe');
    if (fs.existsSync(rcedit)) return rcedit;
  }
  return null;
}

// --- Cari icon.ico ---
function findIcon() {
  const outputDir = path.dirname(targetDir); // e.g. "TOKO BERSAMA FINAL VER"
  const candidates = [
    // ICO yang di-generate electron-builder dari PNG saat build
    path.join(outputDir, '.icon-ico', 'icon.ico'),
    path.join(ROOT, 'dist-electron', '.icon-ico', 'icon.ico'),
    path.join(ROOT, 'build', 'icon.ico'),
    path.join(ROOT, 'icon.ico'),
  ];
  return candidates.find(f => fs.existsSync(f)) || null;
}

// --- Main ---
const targetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'dist-electron', 'win-unpacked');

// Cari EXE utama di folder (bukan DLL)
function findMainExe(dir) {
  const candidates = ['POS Cashier.exe', 'Toko Bersama.exe'];
  for (const name of candidates) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  // Fallback: cari .exe pertama di root folder
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.exe'));
  return files.length ? path.join(dir, files[0]) : null;
}

const exePath = findMainExe(targetDir);

if (!exePath) {
  console.error(`❌ EXE tidak ditemukan di: ${targetDir}`);
  process.exit(1);
}

const rcedit = findRcedit();
if (!rcedit) {
  console.error('❌ rcedit tidak ditemukan. Pastikan electron-builder sudah pernah dijalankan.');
  process.exit(1);
}

const icon = findIcon();
if (!icon) {
  console.error('❌ icon.ico tidak ditemukan. Jalankan build sekali dulu agar dist-electron/.icon-ico/ terbentuk.');
  process.exit(1);
}

console.log(`📁 Target  : ${exePath}`);
console.log(`🖼️  Icon    : ${icon}`);
console.log(`🔧 rcedit  : ${rcedit}`);

const tmpExe = path.join(os.tmpdir(), 'fix_icon_tmp.exe');

try {
  // Kerja via temp file untuk hindari masalah path spasi
  fs.copyFileSync(exePath, tmpExe);
  execFileSync(rcedit, [tmpExe, '--set-icon', icon]);
  fs.copyFileSync(tmpExe, exePath);
  fs.unlinkSync(tmpExe);
  console.log('✅ Icon berhasil diterapkan!');
} catch (err) {
  try { fs.unlinkSync(tmpExe); } catch {}
  if (err.code === 'EBUSY') {
    console.error('❌ File sedang dipakai (aplikasi masih berjalan). Tutup aplikasinya dulu, lalu jalankan ulang script ini.');
  } else {
    console.error('❌ Gagal menerapkan icon:', err.message);
  }
  process.exit(1);
}
