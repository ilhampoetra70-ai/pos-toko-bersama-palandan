const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./database');

const JWT_SECRET = 'pos-cashier-secret-key-2024-local-only';
const TOKEN_EXPIRY = '12h';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function login(username, password) {
  const user = database.getUserByUsername(username);
  if (!user) return { success: false, error: 'User tidak ditemukan' };
  if (!user.active) return { success: false, error: 'Akun tidak aktif' };
  if (!verifyPassword(password, user.password_hash)) return { success: false, error: 'Password salah' };

  // Update last login timestamp
  database.updateUserLastLogin(user.id);

  const token = generateToken(user);
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

module.exports = { hashPassword, verifyPassword, generateToken, verifyToken, login, seedDefaultAdmin };
