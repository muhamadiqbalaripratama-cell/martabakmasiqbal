import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from './db';

const COOKIE = 'pm_session';
const SESSION_TTL_HOURS = 24 * 7;
export const PASSWORD_MIN = 8;

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

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Dipakai saat username tidak ada, supaya waktu respons sama.
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'));

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
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  return `Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
}

export type AuthUser = { id: number; username: string };

async function userFromRequest(req: Request): Promise<AuthUser | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [sha256(token)],
  );
  const r = rows[0];
  return r ? { id: r.id, username: r.username } : null;
}

export const currentUser = (res: Response): AuthUser => res.locals.user as AuthUser;

export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userFromRequest(req);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      res.locals.user = user;
      next();
    } catch (e) {
      console.error('[auth]', e);
      res.status(500).json({ error: 'auth_failed' });
    }
  };
}

export async function me(req: Request, res: Response) {
  res.json({ user: await userFromRequest(req) });
}

export async function logout(req: Request, res: Response) {
  const token = readCookie(req, COOKIE);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags(0)}`);
  res.json({ ok: true });
}

// Login dengan pembatasan percobaan (5x salah → kunci 15 menit).
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();

export async function login(req: Request, res: Response) {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!username || !password) return res.status(400).json({ error: 'credentials_required' });

  const key = `${String(req.headers['x-real-ip'] || req.ip)}|${username}`;
  const f = failures.get(key);
  if (f && f.until > Date.now()) {
    return res
      .status(429)
      .json({ error: 'too_many_attempts', retry_after_sec: Math.ceil((f.until - Date.now()) / 1000) });
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, username, password_hash FROM users WHERE username = ?', [
    username,
  ]);
  const row = rows[0];
  let ok = false;
  if (row) ok = await verifyPassword(password, row.password_hash);
  else await verifyPassword(password, await DUMMY_HASH);

  if (!ok) {
    const count = (f && f.until === 0 ? f.count : 0) + 1;
    if (failures.size > 10_000) failures.clear();
    failures.set(key, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  failures.delete(key);
  await pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()');
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR))',
    [sha256(token), row.id, SESSION_TTL_HOURS],
  );
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieFlags(SESSION_TTL_HOURS * 3600)}`);
  res.json({ user: { id: row.id, username: row.username } });
}

export async function changePassword(req: Request, res: Response) {
  const user = currentUser(res);
  const oldPass = String(req.body?.old_password ?? '');
  const newPass = String(req.body?.new_password ?? '');
  if (newPass.length < PASSWORD_MIN) return res.status(400).json({ error: 'password_too_short' });
  const [rows] = await pool.query<RowDataPacket[]>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
  if (!rows[0] || !(await verifyPassword(oldPass, rows[0].password_hash))) {
    return res.status(400).json({ error: 'wrong_password' });
  }
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(newPass), user.id]);
  // Keluarkan sesi lain, sesi ini tetap.
  const token = readCookie(req, COOKIE);
  await pool.query('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', [user.id, sha256(token ?? '')]);
  res.json({ ok: true });
}

// Saat tabel users kosong, buat akun admin dari env (atau password acak di log).
export async function bootstrapAdmin(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM users');
  if (Number(rows[0].n) > 0) return;
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString('base64url');
  await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, await hashPassword(password)]);
  console.log(
    process.env.ADMIN_PASSWORD
      ? `[auth] akun admin dibuat: username="${username}"`
      : `[auth] akun admin dibuat: username="${username}" password="${password}" — segera ganti!`,
  );
}
