const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('./database');
const totp = require('./totp');

const TOKEN_EXPIRY = '12h';

// Cache secret setelah pertama kali dibaca (DB query sekali saja per sesi)
let _cachedJwtSecret = null;

/**
 * Dapatkan JWT secret dengan urutan prioritas:
 * 1. process.env.JWT_SECRET (override manual / CI)
 * 2. Nilai tersimpan di tabel settings (persisten lintas restart)
 * 3. Auto-generate 64-byte hex secret, simpan ke DB (first-run)
 */
function getJwtSecret() {
  if (_cachedJwtSecret) return _cachedJwtSecret;

  if (process.env.JWT_SECRET) {
    _cachedJwtSecret = process.env.JWT_SECRET;
    return _cachedJwtSecret;
  }

  const settings = database.getSettings();
  if (settings.jwt_secret) {
    _cachedJwtSecret = settings.jwt_secret;
    return _cachedJwtSecret;
  }

  // First-run: buat secret acak dan simpan ke database
  _cachedJwtSecret = crypto.randomBytes(64).toString('hex');
  database.updateSetting('jwt_secret', _cachedJwtSecret);
  console.log('[Auth] JWT secret baru dibuat dan disimpan di database.');
  return _cachedJwtSecret;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user, deviceId = null) {
  const payload = { id: user.id, username: user.username, role: user.role, name: user.name };
  if (deviceId) payload.device_id = deviceId;
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    // Cek apakah token diterbitkan sebelum logout terakhir user (server-side invalidation)
    const user = database.get('SELECT logged_out_at FROM users WHERE id = ?', [decoded.id]);
    if (user && user.logged_out_at > 0 && decoded.iat < user.logged_out_at) return null;
    return decoded;
  } catch {
    return null;
  }
}

function invalidateToken(userId) {
  database.invalidateUserToken(userId);
}

// Public API paths yang tidak butuh autentikasi
const PUBLIC_API_PATHS = new Set(['/health', '/auth/login', '/store', '/products/search']);

function requireAuth(req, res, next) {
  // Lewati autentikasi untuk endpoint publik
  if (PUBLIC_API_PATHS.has(req.path)) return next();

  // Price checker barcode lookup — tidak butuh token
  if (req.method === 'GET' && /^\/product\/[^/]+$/.test(req.path)) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }

  // Untuk token yang menyertakan device_id: pastikan sesi perangkat masih aktif di DB.
  // Ini memastikan token langsung ditolak saat sesi dicabut melalui fitur "Cabut Perangkat",
  // tanpa menunggu token kedaluwarsa secara alami (12 jam).
  if (decoded.device_id) {
    const session = database.getDeviceSessionByDeviceId(decoded.id, decoded.device_id);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Sesi perangkat telah dicabut. Silakan login ulang.' });
    }
  }

  req.user = decoded; // { id, username, role, name, device_id? }
  next();
}

function login(username, password, deviceId = null, deviceName = null) {
  const user = database.getUserByUsername(username);
  const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

  if (!user) {
    verifyPassword(password, dummyHash);
    return { success: false, error: 'Username atau password salah.' };
  }
  if (!user.active) {
    return { success: false, error: 'Akun tidak aktif' };
  }
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'Username atau password salah.' };
  }

  // Update last login timestamp
  database.updateUserLastLogin(user.id);

  // Semua role dicatat device session-nya agar sesi bisa dicabut via "Cabut Perangkat"
  if (deviceId) {
    const existing = database.getDeviceSessionByDeviceId(user.id, deviceId);
    if (!existing) {
      const count = database.countDeviceSessions(user.id);
      if (count >= 2) {
        const oldest = database.getOldestDeviceSession(user.id);
        if (oldest) database.deleteDeviceSessionById(oldest.id);
      }
    }
    database.upsertDeviceSession(user.id, deviceId, deviceName);
  }

  const token = generateToken(user, deviceId || null);
  return {
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name, password_changed: user.password_changed }
  };
}

function seedDefaultAdmin() {
  const existing = database.getUserByUsername('admin');
  if (!existing) {
    database.createUser({
      username: 'admin',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      name: 'Administrator'
    });
    console.log('Default admin created: admin / admin123');
  }
}

// ===================== TOTP FUNCTIONS =====================

/**
 * Cek apakah TOTP sudah diaktifkan untuk user
 * @param {number} userId - ID user
 * @returns {boolean}
 */
function isTOTPEnabled(userId) {
  const user = database.getUserById(userId);
  return user?.totp_enabled === 1;
}

/**
 * Cek apakah TOTP tersedia di sistem (ada admin yang mengaktifkannya)
 * @returns {boolean}
 */
function isTOTPAvailable() {
  const settings = database.getSettings();
  return !!settings.totp_admin_enabled;
}

/**
 * Generate TOTP setup untuk admin
 * @param {number} adminId - ID admin
 * @returns {Promise<Object>} - Setup data
 */
async function generateTOTPSetup(adminId) {
  const user = database.getUserById(adminId);
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Hanya admin yang dapat mengaktifkan TOTP.' };
  }

  const setup = await totp.createTOTPData(user.username);

  // Simpan encrypted secret sementara (belum aktif sampai diverifikasi)
  database.updateUser(adminId, {
    totp_secret_temp: setup.encryptedSecret,
    totp_backup_codes_temp: JSON.stringify(setup.hashedBackupCodes),
  });

  return {
    success: true,
    data: {
      qrCode: setup.qrCode,
      manualEntryKey: setup.manualEntryKey,
      backupCodes: setup.backupCodes,
    }
  };
}

/**
 * Verifikasi dan aktifkan TOTP
 * @param {number} adminId - ID admin
 * @param {string} token - 6 digit token dari authenticator
 * @returns {Object}
 */
function verifyAndEnableTOTP(adminId, token) {
  if (!totp.isValidTokenFormat(token)) {
    return { success: false, error: 'Format token tidak valid. Masukkan 6 digit angka.' };
  }

  const user = database.getUserById(adminId);
  if (!user || !user.totp_secret_temp) {
    return { success: false, error: 'Setup TOTP tidak ditemukan. Silakan mulai ulang setup.' };
  }

  const isValid = totp.verifyTOTP(token, user.totp_secret_temp);
  if (!isValid) {
    return { success: false, error: 'Token tidak valid. Pastikan waktu device Anda tepat.' };
  }

  // Aktifkan TOTP
  database.updateUser(adminId, {
    totp_secret: user.totp_secret_temp,
    totp_backup_codes: user.totp_backup_codes_temp,
    totp_enabled: 1,
    totp_enabled_at: Date.now(),
    // Hapus temp data
    totp_secret_temp: null,
    totp_backup_codes_temp: null,
  });

  // Mark system sebagai TOTP-enabled
  database.updateSetting('totp_admin_enabled', '1');

  return { success: true };
}

/**
 * Disable TOTP
 * @param {number} adminId - ID admin
 * @param {string} password - Password admin untuk konfirmasi
 * @returns {Object}
 */
function disableTOTP(adminId, password) {
  const user = database.getUserById(adminId);
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'Password salah.' };
  }

  database.updateUser(adminId, {
    totp_secret: null,
    totp_backup_codes: null,
    totp_enabled: 0,
    totp_enabled_at: null,
    totp_secret_temp: null,
    totp_backup_codes_temp: null,
  });

  // Check if any other admin has TOTP enabled
  const otherAdminWithTOTP = database.get(
    'SELECT id FROM users WHERE role = ? AND totp_enabled = 1 AND id != ?',
    ['admin', adminId]
  );

  if (!otherAdminWithTOTP) {
    database.updateSetting('totp_admin_enabled', '0');
  }

  return { success: true };
}

/**
 * Reset password dengan TOTP token atau backup code
 * @param {string} username - Username
 * @param {string} totpCode - 6 digit TOTP atau backup code
 * @param {string} newPassword - Password baru
 * @returns {Object}
 */
function resetPasswordWithTOTP(username, totpCode, newPassword) {
  const user = database.getUserByUsername(username);
  if (!user) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  // Cek apakah TOTP tersedia di sistem
  const settings = database.getSettings();
  if (!settings.totp_admin_enabled) {
    return { success: false, error: 'Fitur TOTP belum diaktifkan. Hubungi administrator.' };
  }

  // Jika user adalah admin, verifikasi TOTP mereka sendiri
  if (user.role === 'admin') {
    if (!user.totp_enabled) {
      return { success: false, error: 'Admin belum mengaktifkan TOTP.' };
    }

    let isValid = false;
    let usedBackupCode = false;

    // Coba verifikasi sebagai TOTP token (6 digit)
    if (totp.isValidTokenFormat(totpCode)) {
      isValid = totp.verifyTOTP(totpCode, user.totp_secret);
    }

    // Jika gagal, coba sebagai backup code
    if (!isValid && user.totp_backup_codes) {
      const hashedCodes = JSON.parse(user.totp_backup_codes);
      if (totp.verifyBackupCode(totpCode, hashedCodes)) {
        isValid = true;
        usedBackupCode = true;

        // Remove used backup code
        const normalizedInput = totpCode.replace(/-/g, '').toUpperCase();
        const newHashedCodes = hashedCodes.filter(hash => {
          const testHash = crypto.createHash('sha256').update(normalizedInput).digest('hex');
          return hash !== testHash;
        });
        database.updateUser(user.id, {
          totp_backup_codes: JSON.stringify(newHashedCodes)
        });
      }
    }

    if (!isValid) {
      return { success: false, error: 'Kode TOTP atau backup code tidak valid.' };
    }

    // Update password
    const newHash = hashPassword(newPassword);
    database.updateUser(user.id, { ...user, password_hash: newHash });

    return {
      success: true,
      usedBackupCode,
      warning: usedBackupCode ? 'Backup code telah digunakan dan tidak dapat digunakan lagi.' : undefined
    };
  }

  // Untuk non-admin: verifikasi dengan TOTP admin
  const adminWithTOTP = database.get(
    'SELECT * FROM users WHERE role = ? AND totp_enabled = 1 LIMIT 1',
    ['admin']
  );

  if (!adminWithTOTP) {
    return { success: false, error: 'Tidak ada admin dengan TOTP yang aktif.' };
  }

  let isValid = false;
  let usedBackupCode = false;

  // Coba verifikasi sebagai TOTP token
  if (totp.isValidTokenFormat(totpCode)) {
    isValid = totp.verifyTOTP(totpCode, adminWithTOTP.totp_secret);
  }

  // Jika gagal, coba sebagai backup code admin
  if (!isValid && adminWithTOTP.totp_backup_codes) {
    const hashedCodes = JSON.parse(adminWithTOTP.totp_backup_codes);
    if (totp.verifyBackupCode(totpCode, hashedCodes)) {
      isValid = true;
      usedBackupCode = true;

      // Remove used backup code
      const normalizedInput = totpCode.replace(/-/g, '').toUpperCase();
      const newHashedCodes = hashedCodes.filter(hash => {
        const testHash = crypto.createHash('sha256').update(normalizedInput).digest('hex');
        return hash !== testHash;
      });
      database.updateUser(adminWithTOTP.id, {
        totp_backup_codes: JSON.stringify(newHashedCodes)
      });
    }
  }

  if (!isValid) {
    return { success: false, error: 'Kode TOTP atau backup code admin tidak valid.' };
  }

  // Update password user
  const newHash = hashPassword(newPassword);
  database.updateUser(user.id, { ...user, password_hash: newHash });

  return {
    success: true,
    adminName: adminWithTOTP.name,
    usedBackupCode,
    warning: usedBackupCode ? 'Backup code admin telah digunakan dan tidak dapat digunakan lagi.' : undefined
  };
}

/**
 * Regenerate backup codes
 * @param {number} adminId - ID admin
 * @param {string} password - Password untuk konfirmasi
 * @returns {Object}
 */
function regenerateBackupCodes(adminId, password) {
  const user = database.getUserById(adminId);
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  if (!user.totp_enabled) {
    return { success: false, error: 'TOTP belum diaktifkan.' };
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'Password salah.' };
  }

  const newCodes = totp.generateBackupCodes(8);
  const newHashedCodes = totp.hashBackupCodes(newCodes);

  database.updateUser(adminId, {
    totp_backup_codes: JSON.stringify(newHashedCodes)
  });

  return {
    success: true,
    data: {
      backupCodes: newCodes,
    }
  };
}

/**
 * Get TOTP status untuk admin
 * @param {number} adminId - ID admin
 * @returns {Object}
 */
function getTOTPStatus(adminId) {
  const user = database.getUserById(adminId);
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  const backupCodes = user.totp_backup_codes ? JSON.parse(user.totp_backup_codes) : [];

  return {
    success: true,
    data: {
      enabled: user.totp_enabled === 1,
      enabledAt: user.totp_enabled_at,
      remainingBackupCodes: backupCodes.length,
    }
  };
}

// ===================== LEGACY MASTER KEY FUNCTIONS (Deprecated) =====================
// Master Key akan dihapus setelah migrasi TOTP selesai

function seedMasterKey() {
  const settings = database.getSettings();
  if (!settings.master_key_hash) {
    const hash = hashPassword('master123');
    database.updateSetting('master_key_hash', hash);
    console.log('[Deprecated] Master Key seeded: master123');
    console.log('[Info] Sebaiknya aktifkan TOTP untuk keamanan yang lebih baik.');
  }
}

function resetPasswordWithMasterKey(username, masterKey, newPassword) {
  console.log('[Warning] Menggunakan Master Key - pertimbangkan untuk migrasi ke TOTP');

  const settings = database.getSettings();
  if (!settings.master_key_hash) {
    return { success: false, error: 'Master Key belum diatur.' };
  }

  if (!verifyPassword(masterKey, settings.master_key_hash)) {
    return { success: false, error: 'Master Key salah.' };
  }

  const user = database.getUserByUsername(username);
  if (!user) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  const newHash = hashPassword(newPassword);
  database.updateUser(user.id, { ...user, password_hash: newHash });
  return { success: true };
}

function changeMasterKey(oldMasterKey, newMasterKey) {
  console.log('[Warning] Mengubah Master Key - pertimbangkan untuk migrasi ke TOTP');

  const settings = database.getSettings();

  // Verify old master key
  if (!settings.master_key_hash) {
    return { success: false, error: 'Master Key belum diatur.' };
  }

  if (!verifyPassword(oldMasterKey, settings.master_key_hash)) {
    return { success: false, error: 'Master Key lama salah.' };
  }

  // Set new master key
  const newHash = hashPassword(newMasterKey);
  database.updateSetting('master_key_hash', newHash);

  return { success: true };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  invalidateToken,
  requireAuth,
  login,
  seedDefaultAdmin,
  seedMasterKey,
  resetPasswordWithMasterKey,
  changeMasterKey,

  // TOTP exports
  isTOTPEnabled,
  isTOTPAvailable,
  generateTOTPSetup,
  verifyAndEnableTOTP,
  disableTOTP,
  resetPasswordWithTOTP,
  regenerateBackupCodes,
  getTOTPStatus,
};
