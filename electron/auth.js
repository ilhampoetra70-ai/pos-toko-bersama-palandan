const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('./database');

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
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
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
  if (!user) return { success: false, error: 'User tidak ditemukan' };
  if (!user.active) return { success: false, error: 'Akun tidak aktif' };
  if (!verifyPassword(password, user.password_hash)) return { success: false, error: 'Password salah' };

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
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
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

function seedMasterKey() {
  const settings = database.getSettings();
  if (!settings.master_key_hash) {
    const hash = hashPassword('master123');
    database.updateSetting('master_key_hash', hash);
    console.log('Master Key seeded: master123');
  }
}

function resetPasswordWithMasterKey(username, masterKey, newPassword) {
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

module.exports = { hashPassword, verifyPassword, generateToken, verifyToken, requireAuth, login, seedDefaultAdmin, seedMasterKey, resetPasswordWithMasterKey, changeMasterKey };
