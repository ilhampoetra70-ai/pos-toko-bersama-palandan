/**
 * TOTP (Time-based One-Time Password) Service
 * Menggantikan sistem Master Key dengan Google Authenticator
 * 
 * Features:
 * - Generate TOTP secret dengan encryption
 * - Generate QR code untuk setup
 * - Verify TOTP token dengan time window
 * - Backup codes untuk recovery
 * 
 * Encryption: AES-256-GCM dengan key dari machine fingerprint
 */

const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Nama aplikasi untuk QR code
const APP_NAME = 'Toko Bersama';

// Default TOTP options
const TOTP_OPTIONS = {
  window: 2, // Accept 2 steps before and after current time (±60 detik)
  step: 30,  // 30 seconds per token
  digits: 6, // 6 digit token
};

// Set options pada authenticator global
authenticator.options = {
  window: TOTP_OPTIONS.window,
  step: TOTP_OPTIONS.step,
  digits: TOTP_OPTIONS.digits
};

/**
 * Generate encryption key dari machine-specific data
 * Fallback ke environment variable atau default (untuk development)
 */
function getEncryptionKey() {
  // Kombinasi beberapa faktor untuk membuat key unik per machine
  const factors = [
    process.env.USERNAME || process.env.USER || 'default',
    process.env.COMPUTERNAME || process.env.HOSTNAME || 'default',
    require('os').hostname(),
    require('os').platform(),
  ];

  const baseKey = factors.join('|');
  return crypto.scryptSync(baseKey, 'tokobersama-salt', 32);
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Enkripsi secret TOTP
 * @param {string} plaintext - Secret dalam bentuk plain text
 * @returns {string} - Format: iv:authTag:ciphertext (hex)
 */
function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Dekripsi secret TOTP
 * @param {string} encryptedData - Format: iv:authTag:ciphertext (hex)
 * @returns {string|null} - Plain text secret atau null jika gagal
 */
function decryptSecret(encryptedData) {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      return null;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[TOTP] Decryption failed:', error.message);
    return null;
  }
}

/**
 * Generate TOTP setup untuk user
 * @param {string} username - Username untuk ditampilkan di authenticator
 * @returns {Object} - Secret, QR code data URL, dan manual entry key
 */
async function generateTOTPSetup(username) {
  // Generate secret baru menggunakan otplib
  const secret = authenticator.generateSecret();

  // Generate OTPAuth URL
  const otpauth = authenticator.keyuri(username, APP_NAME, secret);

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return {
    secret, // Plain secret - harus dienkripsi sebelum disimpan
    qrCode: qrCodeDataUrl,
    manualEntryKey: secret, // Untuk input manual jika QR code tidak berfungsi
  };
}

/**
 * Generate backup codes untuk recovery
 * @param {number} count - Jumlah backup codes (default: 8)
 * @returns {string[]} - Array backup codes (format: XXXX-XXXX)
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8 karakter alphanumeric uppercase
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash backup codes untuk penyimpanan aman
 * @param {string[]} codes - Array backup codes
 * @returns {string[]} - Array hashed codes
 */
function hashBackupCodes(codes) {
  return codes.map(code => {
    const normalized = code.replace(/-/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  });
}

/**
 * Verifikasi backup code
 * @param {string} inputCode - Code yang diinput user
 * @param {string[]} hashedCodes - Array hashed codes dari database
 * @returns {boolean} - True jika valid
 */
function verifyBackupCode(inputCode, hashedCodes) {
  const normalized = inputCode.replace(/-/g, '').toUpperCase();
  const hashed = crypto.createHash('sha256').update(normalized).digest('hex');
  return hashedCodes.includes(hashed);
}

/**
 * Verifikasi TOTP token
 * @param {string} token - 6 digit token dari authenticator
 * @param {string} encryptedSecret - Secret terenkripsi dari database
 * @returns {boolean} - True jika valid
 */
function verifyTOTP(token, encryptedSecret) {
  try {
    const secret = decryptSecret(encryptedSecret);
    if (!secret) {
      return false;
    }

    return authenticator.verify({
      token,
      secret
    });
  } catch (error) {
    console.error('[TOTP] Verification error:', error.message);
    return false;
  }
}

/**
 * Generate encrypted TOTP data untuk disimpan ke database
 * @param {string} username - Username
 * @returns {Object} - Data lengkap untuk setup
 */
async function createTOTPData(username) {
  const setup = await generateTOTPSetup(username);
  const backupCodes = generateBackupCodes(8);
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  return {
    secret: setup.secret, // Plain secret untuk QR (sebelum disimpan perlu dienkripsi)
    encryptedSecret: encryptSecret(setup.secret),
    qrCode: setup.qrCode,
    manualEntryKey: setup.manualEntryKey,
    backupCodes, // Plain codes untuk ditampilkan sekali
    hashedBackupCodes, // Hashed untuk disimpan
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validasi format TOTP token
 * @param {string} token - Token dari user
 * @returns {boolean} - True jika format valid (6 digit angka)
 */
function isValidTokenFormat(token) {
  return /^\d{6}$/.test(token);
}

/**
 * Validasi format backup code
 * @param {string} code - Code dari user
 * @returns {boolean} - True jika format valid (XXXX-XXXX)
 */
function isValidBackupCodeFormat(code) {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code);
}

module.exports = {
  // Core functions
  generateTOTPSetup,
  verifyTOTP,
  createTOTPData,

  // Encryption
  encryptSecret,
  decryptSecret,

  // Backup codes
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,

  // Validation
  isValidTokenFormat,
  isValidBackupCodeFormat,

  // Constants
  APP_NAME,
  TOTP_OPTIONS,
};
