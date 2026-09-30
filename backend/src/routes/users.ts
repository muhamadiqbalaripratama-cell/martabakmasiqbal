import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { currentUser, hashPassword, PASSWORD_MIN, requireAuth, revokeUserSessions, ROLES, type Role } from '../auth';

// Kelola akun operator & admin. Semua route khusus admin.
export const usersRouter = Router();
usersRouter.use(requireAuth('admin'));

const USERNAME_RE = /^[a-z0-9._-]{3,64}$/;

usersRouter.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, name, role, CAST(active AS UNSIGNED) AS active, created_at
         FROM users ORDER BY role, username`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[users.list]', e);
    res.status(500).json({ error: 'failed' });
  }
});

usersRouter.post('/', async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const name = String(req.body?.name ?? '').trim();
  const role = req.body?.role as Role;
  const password = String(req.body?.password ?? '');
  if (!USERNAME_RE.test(username)) return res.status(400).json({ error: 'invalid_username' });
  if (!name) return res.status(400).json({ error: 'name_required' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'invalid_role' });
  if (password.length < PASSWORD_MIN) return res.status(400).json({ error: 'password_too_short', min: PASSWORD_MIN });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)',
      [username, name.slice(0, 128), role, await hashPassword(password)],
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if ((e as { code?: string }).code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'username_taken' });
    console.error('[users.create]', e);
    res.status(500).json({ error: 'failed' });
  }
});

// Ubah nama / role / password / status aktif. Field yang tidak dikirim tidak berubah.
usersRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' });
  const me = currentUser(res);
  const { name, role, password, active } = req.body ?? {};

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: 'name_required' });
    sets.push('name = ?');
    vals.push(String(name).trim().slice(0, 128));
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'invalid_role' });
    if (id === me.id && role !== 'admin') return res.status(400).json({ error: 'cannot_demote_self' });
    sets.push('role = ?');
    vals.push(role);
  }
  if (password !== undefined) {
    if (String(password).length < PASSWORD_MIN) return res.status(400).json({ error: 'password_too_short', min: PASSWORD_MIN });
    sets.push('password_hash = ?');
    vals.push(await hashPassword(String(password)));
  }
  if (active !== undefined) {
    if (id === me.id && !active) return res.status(400).json({ error: 'cannot_deactivate_self' });
    sets.push('active = ?');
    vals.push(active ? 1 : 0);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'nothing_to_update' });

  try {
    const [r] = await pool.query<ResultSetHeader>(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    // Password diganti / akun dinonaktifkan / role berubah → paksa login ulang.
    if (password !== undefined || active === false || role !== undefined) {
      if (id !== me.id) await revokeUserSessions(id);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, name, role, CAST(active AS UNSIGNED) AS active, created_at FROM users WHERE id = ?',
      [id],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('[users.update]', e);
    res.status(500).json({ error: 'failed' });
  }
});
