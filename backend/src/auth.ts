import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './db';

export type Role = 'operator' | 'admin';
export const ROLES: Role[] = ['operator', 'admin'];

export type AuthUser = { id: number; username: string; name: string; role: Role };

const COOKIE = 'pos_session';
const SESSION_TTL_HOURS = 12; // satu shift
export const PASSWORD_MIN = 8;

// ─── Password (scrypt, bawaan Node — tanpa dependency native) ───────

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Dipakai saat username tidak ada supaya waktu respons tetap sama
// (tidak membocorkan username mana yang terdaftar).
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'));

// ─── Sesi (token acak di cookie, hash-nya di DB) ────────────────────

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function cookieFlags(maxAgeSec: number): string {
  // Set COOKIE_SECURE=true kalau aplikasi diakses lewat HTTPS.
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  return `Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
}

async function createSession(res: Response, userId: number): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [sha256(token), userId, SESSION_TTL_HOURS],
  );
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieFlags(SESSION_TTL_HOURS * 3600)}`);
}

async function userFromRequest(req: Request): Promise<AuthUser | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.username, u.name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.active = 1`,
    [sha256(token)],
  );
  const r = rows[0];
  return r ? { id: r.id, username: r.username, name: r.name, role: r.role } : null;
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = readCookie(req, COOKIE);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags(0)}`);
}

export async function revokeUserSessions(userId: number): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

// ─── Middleware ──────────────────────────────────────────────────────

export const currentUser = (res: Response): AuthUser => res.locals.user as AuthUser;

// requireAuth() = semua user yang login; requireAuth('admin') = admin saja.
export function requireAuth(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userFromRequest(req);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: 'forbidden' });
      res.locals.user = user;
      next();
    } catch (e) {
      console.error('[auth]', e);
      res.status(500).json({ error: 'auth_failed' });
    }
  };
}

// ─── Login dengan pembatasan percobaan ───────────────────────────────

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();

export async function login(req: Request, res: Response) {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!username || !password) return res.status(400).json({ error: 'credentials_required' });

  const ip = String(req.headers['x-real-ip'] || req.ip);
  const key = `${ip}|${username}`;
  const f = failures.get(key);
  if (f && f.until > Date.now()) {
    return res.status(429).json({ error: 'too_many_attempts', retry_after_sec: Math.ceil((f.until - Date.now()) / 1000) });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, name, role, password_hash FROM users WHERE username = ? AND active = 1',
    [username],
  );
  const row = rows[0];
  let ok = false;
  if (row) ok = await verifyPassword(password, row.password_hash);
  else await verifyPassword(password, await DUMMY_HASH);

  if (!ok) {
    // until > 0 yang sudah lewat = masa kunci selesai → hitung dari awal.
    const count = (f && f.until === 0 ? f.count : 0) + 1;
    if (failures.size > 10_000) failures.clear();
    failures.set(key, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  failures.delete(key);
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  await createSession(res, row.id);
  const user: AuthUser = { id: row.id, username: row.username, name: row.name, role: row.role };
  res.json({ user });
}

// ─── Akun awal ───────────────────────────────────────────────────────

// Saat tabel users masih kosong, buat akun dari env. Kalau ADMIN_PASSWORD
// tidak di-set, password acak dibuat dan dicetak sekali di log container.
export async function bootstrapUsers(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM users');
  if (Number(rows[0].n) > 0) return;

  const seed: { username: string; name: string; role: Role; password: string; generated: boolean }[] = [];
  const adminPass = process.env.ADMIN_PASSWORD || randomBytes(9).toString('base64url');
  seed.push({
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    name: 'Admin',
    role: 'admin',
    password: adminPass,
    generated: !process.env.ADMIN_PASSWORD,
  });
  if (process.env.OPERATOR_USERNAME && process.env.OPERATOR_PASSWORD) {
    seed.push({
      username: process.env.OPERATOR_USERNAME.toLowerCase(),
      name: 'Operator',
      role: 'operator',
      password: process.env.OPERATOR_PASSWORD,
      generated: false,
    });
  }

  for (const u of seed) {
    await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [u.username, u.name, u.role, await hashPassword(u.password)],
    );
    console.log(
      u.generated
        ? `[auth] akun ${u.role} dibuat: username="${u.username}" password="${u.password}" — segera ganti!`
        : `[auth] akun ${u.role} dibuat: username="${u.username}"`,
    );
  }
}
