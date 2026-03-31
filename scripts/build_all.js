const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const POS_APP_ROOT = path.resolve(__dirname, '..');
const POS_ADMIN_SRC = path.resolve(POS_APP_ROOT, '../pos-admin');
const PRICE_CHECKER_SRC = path.resolve(POS_APP_ROOT, 'price-checker');

const ADMIN_DIST_DEST = path.resolve(POS_APP_ROOT, 'mobile-admin-dist');
// Price checker is static, so we can just ensure it's copied if needed
// But Electron Builder will pick it up from 'price-checker' folder directly if configured.

console.log('🚀 Starting Bundled Portable Build...');

// 1. Clean previous builds
console.log('🧹 Cleaning old artifacts...');
if (fs.existsSync(ADMIN_DIST_DEST)) {
    fs.rmSync(ADMIN_DIST_DEST, { recursive: true, force: true });
}

// 2. Build POS Admin (Sibling Project)
console.log('🔨 Building POS Admin from sibling directory...');
if (!fs.existsSync(POS_ADMIN_SRC)) {
    console.error('❌ Error: Sibling pos-admin directory not found at:', POS_ADMIN_SRC);
    process.exit(1);
}

try {
    console.log('   Running npm install in pos-admin...');
    execSync('npm install', { cwd: POS_ADMIN_SRC, stdio: 'inherit' });

    console.log('   Running npm run build in pos-admin...');
    execSync('npm run build', { cwd: POS_ADMIN_SRC, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error building POS Admin:', error.message);
    process.exit(1);
}

// 3. Copy Admin Dist to POS App
console.log('📦 Copying POS Admin build to mobile-admin-dist...');
const adminDistSrc = path.join(POS_ADMIN_SRC, 'dist');
if (!fs.existsSync(adminDistSrc)) {
    console.error('❌ Error: POS Admin build output not found at:', adminDistSrc);
    process.exit(1);
}

// Use fs.cpSync for recursive copy (Node 16.7+)
fs.cpSync(adminDistSrc, ADMIN_DIST_DEST, { recursive: true });

// 4. Verify Price Checker
console.log('🔍 Verifying Price Checker...');
if (!fs.existsSync(PRICE_CHECKER_SRC)) {
    console.warn('⚠️ Warning: Price Checker folder not found at:', PRICE_CHECKER_SRC);
    // Not fatal, proceed
} else {
    console.log('   Price Checker found.');
}

console.log('✅ Build Preparation Complete!');
console.log('   Ready for electron-builder packaging.');
