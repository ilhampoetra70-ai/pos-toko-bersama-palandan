/**
 * PWA Icon Generator
 * Source of truth: The SVG files in price-checker/icons/icon.svg and
 * mobile-admin-dist/icons/icon.svg
 *
 * Run this script whenever the master SVG icons change:
 *   node scripts/generate-pwa-icons.js 
 *
 * PNG files are generated artifacts — do NOT edit them manually.
 * PNG files must remain for PWA manifest Android/iOS compatibility.
 * SVG is used as the primary favicon and scalable icon everywhere else.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'price-checker', 'icons');

// Standard PWA icon sizes
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Regular icon SVG (no extra padding, rounded corners)
const regularSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#2563eb"/>
  <g fill="white">
    <rect x="80" y="140" width="8" height="160" rx="2"/>
    <rect x="100" y="140" width="16" height="160" rx="2"/>
    <rect x="128" y="140" width="8" height="160" rx="2"/>
    <rect x="148" y="140" width="24" height="160" rx="2"/>
    <rect x="184" y="140" width="8" height="160" rx="2"/>
    <rect x="204" y="140" width="16" height="160" rx="2"/>
    <rect x="232" y="140" width="8" height="160" rx="2"/>
    <rect x="252" y="140" width="8" height="160" rx="2"/>
    <rect x="272" y="140" width="24" height="160" rx="2"/>
    <rect x="308" y="140" width="8" height="160" rx="2"/>
    <rect x="328" y="140" width="16" height="160" rx="2"/>
    <rect x="356" y="140" width="8" height="160" rx="2"/>
    <rect x="376" y="140" width="24" height="160" rx="2"/>
    <rect x="412" y="140" width="8" height="160" rx="2"/>
    <rect x="432" y="140" width="8" height="160" rx="2"/>
    <text x="256" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle">Rp</text>
  </g>
</svg>`;

// Maskable icon SVG: full bleed background, content within 80% safe zone (centered)
// Safe zone = 80% of 512 = 409.6, offset = (512-409.6)/2 = 51.2
// Scale content to fit within safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb"/>
  <g fill="white" transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="80" y="140" width="8" height="160" rx="2"/>
    <rect x="100" y="140" width="16" height="160" rx="2"/>
    <rect x="128" y="140" width="8" height="160" rx="2"/>
    <rect x="148" y="140" width="24" height="160" rx="2"/>
    <rect x="184" y="140" width="8" height="160" rx="2"/>
    <rect x="204" y="140" width="16" height="160" rx="2"/>
    <rect x="232" y="140" width="8" height="160" rx="2"/>
    <rect x="252" y="140" width="8" height="160" rx="2"/>
    <rect x="272" y="140" width="24" height="160" rx="2"/>
    <rect x="308" y="140" width="8" height="160" rx="2"/>
    <rect x="328" y="140" width="16" height="160" rx="2"/>
    <rect x="356" y="140" width="8" height="160" rx="2"/>
    <rect x="376" y="140" width="24" height="160" rx="2"/>
    <rect x="412" y="140" width="8" height="160" rx="2"/>
    <rect x="432" y="140" width="8" height="160" rx="2"/>
    <text x="256" y="380" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle">Rp</text>
  </g>
</svg>`;

async function generateIcons() {
  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  const svgBuffer = Buffer.from(regularSvg);
  const maskableSvgBuffer = Buffer.from(maskableSvg);

  console.log('Generating PWA icons...');

  for (const size of SIZES) {
    // Regular icon
    const regularFile = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(regularFile);
    console.log(`  ✓ icon-${size}x${size}.png`);

    // Maskable icon (only for key sizes)
    if ([192, 512].includes(size)) {
      const maskableFile = path.join(ICONS_DIR, `icon-${size}x${size}-maskable.png`);
      await sharp(maskableSvgBuffer)
        .resize(size, size)
        .png()
        .toFile(maskableFile);
      console.log(`  ✓ icon-${size}x${size}-maskable.png`);
    }
  }

  // Generate apple-touch-icon (180x180, standard for iOS)
  const appleFile = path.join(ICONS_DIR, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleFile);
  console.log('  ✓ apple-touch-icon.png (180x180)');

  // Generate favicon 32x32
  const favicon32 = path.join(ICONS_DIR, 'favicon-32x32.png');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(favicon32);
  console.log('  ✓ favicon-32x32.png');

  // Generate favicon 16x16
  const favicon16 = path.join(ICONS_DIR, 'favicon-16x16.png');
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(favicon16);
  console.log('  ✓ favicon-16x16.png');

  console.log('\nDone! All icons generated in price-checker/icons/');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
