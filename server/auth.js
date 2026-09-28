import crypto from 'node:crypto';

const COOKIE = 'cu_admin';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD = process.env.ADMIN_PASSWORD || '';
// Without SESSION_SECRET, sessions simply end whenever the server restarts.
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
// Mixing in the password means changing it logs every existing session out.
const KEY = crypto.createHash('sha256').update(`${SECRET}:${PASSWORD}`).digest();

export const adminConfigured = PASSWORD.length > 0;

function sign(value) {
  return crypto.createHmac('sha256', KEY).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

const cookieOptions = (req) => ({ httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/api/admin' });

export function checkPassword(candidate) {
  return adminConfigured && typeof candidate === 'string' && safeEqual(candidate, PASSWORD);
}

export function isAdmin(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function startSession(req, res) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_MS })).toString('base64url');
  res.cookie(COOKIE, `${payload}.${sign(payload)}`, { ...cookieOptions(req), maxAge: MAX_AGE_MS });
}

export function endSession(req, res) {
  res.clearCookie(COOKIE, cookieOptions(req));
}

export function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Please log in again.' });
  next();
}
