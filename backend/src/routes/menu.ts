import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { currentUser } from '../auth';
import { parseImage } from '../images';

// Dipasang di belakang requireAuth() (lihat index.ts): semua route butuh login.
// Ubah menu khusus admin, kecuali tandai habis/tersedia yang boleh operator.
export const menuRouter = Router();

const CATEGORIES = ['manis', 'asin', 'drink', 'paket'] as const;
const ACCENTS = ['green', 'yellow', 'cream', 'cocoa'] as const;
const ID_PREFIX: Record<string, string> = { manis: 'm', asin: 'a', drink: 'd', paket: 'p' };
const IMAGE_MAX_BYTES = 3 * 1024 * 1024;

const isAdmin = (res: Parameters<typeof currentUser>[0]) => currentUser(res).role === 'admin';

const SELECT = `
  SELECT id, category, name, description, price, monogram, accent, tag,
         CAST(hot AS UNSIGNED) AS hot,
         CAST(sold_out AS UNSIGNED) AS sold_out,
         CAST(active AS UNSIGNED) AS active,
         sort_order,
         IF(image_data IS NULL, NULL, UNIX_TIMESTAMP(image_updated_at)) AS image_version
    FROM menu_items`;

// ?all=1 (admin) ikut menampilkan item nonaktif.
menuRouter.get('/', async (req, res) => {
  const all = req.query.all === '1' && isAdmin(res);
  try {
    const [rows] = await pool.query(
      `${SELECT} ${all ? '' : 'WHERE active = 1'}
       ORDER BY FIELD(category, 'manis', 'asin', 'drink', 'paket'), sort_order, name`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[menu.list]', e);
    res.status(500).json({ error: 'failed_to_fetch_menu' });
  }
});

menuRouter.get('/:id/image', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT image_mime, image_data FROM menu_items WHERE id = ? AND image_data IS NOT NULL',
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.setHeader('Content-Type', rows[0].image_mime);
    // URL foto memuat ?v=<image_version>, jadi aman di-cache lama.
    res.setHeader('Cache-Control', 'private, max-age=604800');
    res.send(rows[0].image_data);
  } catch (e) {
    console.error('[menu.image]', e);
    res.status(500).json({ error: 'failed' });
  }
});

type MenuInput = {
  category?: string;
  name?: string;
  description?: string | null;
  price?: number;
  tag?: string | null;
  hot?: boolean;
  sold_out?: boolean;
  active?: boolean;
  accent?: string;
};

// Validasi field yang dikirim. Mengembalikan kolom SQL + nilai, atau kode error.
function validate(b: MenuInput, creating: boolean): { cols: string[]; vals: unknown[] } | string {
  const cols: string[] = [];
  const vals: unknown[] = [];
  if (b.category !== undefined || creating) {
    if (!CATEGORIES.includes(b.category as (typeof CATEGORIES)[number])) return 'invalid_category';
    cols.push('category');
    vals.push(b.category);
  }
  if (b.name !== undefined || creating) {
    const name = String(b.name ?? '').trim();
    if (!name) return 'name_required';
    cols.push('name');
    vals.push(name.slice(0, 255));
  }
  if (b.price !== undefined || creating) {
    const price = Math.floor(Number(b.price));
    if (!Number.isFinite(price) || price < 0 || price > 100_000_000) return 'invalid_price';
    cols.push('price');
    vals.push(price);
  }
  if (b.description !== undefined) {
    cols.push('description');
    vals.push(b.description ? String(b.description).trim().slice(0, 2000) : null);
  }
  if (b.tag !== undefined) {
    cols.push('tag');
    vals.push(b.tag ? String(b.tag).trim().slice(0, 64) : null);
  }
  if (b.accent !== undefined) {
    if (!ACCENTS.includes(b.accent as (typeof ACCENTS)[number])) return 'invalid_accent';
    cols.push('accent');
    vals.push(b.accent);
  }
  for (const k of ['hot', 'sold_out', 'active'] as const) {
    if (b[k] !== undefined) {
      cols.push(k);
      vals.push(b[k] ? 1 : 0);
    }
  }
  return { cols, vals };
}

async function getItem(id: string) {
  const [rows] = await pool.query<RowDataPacket[]>(`${SELECT} WHERE id = ?`, [id]);
  return rows[0];
}

menuRouter.post('/', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  const body = req.body as MenuInput;
  const v = validate(body, true);
  if (typeof v === 'string') return res.status(400).json({ error: v });
  const name = String(body.name).trim();
  const id = `${ID_PREFIX[body.category!]}${Date.now().toString(36)}`;
  const monogram = (name.replace(/^martabak\s+(manis|telur)\s+/i, '')[0] || name[0]).toUpperCase();
  try {
    const [[{ next }]] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM menu_items WHERE category = ?',
      [body.category],
    );
    const cols = ['id', 'monogram', 'sort_order', ...v.cols];
    const vals = [id, monogram, next, ...v.vals];
    if (!cols.includes('accent')) {
      cols.push('accent');
      vals.push(body.category === 'manis' ? 'cocoa' : body.category === 'asin' ? 'yellow' : body.category === 'drink' ? 'cream' : 'green');
    }
    await pool.query(`INSERT INTO menu_items (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, vals);
    res.status(201).json(await getItem(id));
  } catch (e) {
    console.error('[menu.create]', e);
    res.status(500).json({ error: 'failed' });
  }
});

menuRouter.patch('/:id', async (req, res) => {
  const body = req.body as MenuInput;
  // Operator hanya boleh menandai habis / tersedia.
  if (!isAdmin(res) && Object.keys(body).some((k) => k !== 'sold_out')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const v = validate(body, false);
  if (typeof v === 'string') return res.status(400).json({ error: v });
  if (v.cols.length === 0) return res.status(400).json({ error: 'nothing_to_update' });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE menu_items SET ${v.cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...v.vals, req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json(await getItem(req.params.id));
  } catch (e) {
    console.error('[menu.update]', e);
    res.status(500).json({ error: 'failed' });
  }
});

menuRouter.put('/:id/image', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  const img = parseImage(req.body, IMAGE_MAX_BYTES);
  if (typeof img === 'string') return res.status(400).json({ error: `image_${img}` });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      'UPDATE menu_items SET image_mime = ?, image_data = ?, image_updated_at = NOW() WHERE id = ?',
      [img.mime, img.data, req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json(await getItem(req.params.id));
  } catch (e) {
    console.error('[menu.image.put]', e);
    res.status(500).json({ error: 'failed' });
  }
});

menuRouter.delete('/:id/image', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  try {
    // image_updated_at tetap diisi supaya foto bawaan tidak dipasang ulang.
    const [r] = await pool.query<ResultSetHeader>(
      'UPDATE menu_items SET image_mime = NULL, image_data = NULL, image_updated_at = NOW() WHERE id = ?',
      [req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json(await getItem(req.params.id));
  } catch (e) {
    console.error('[menu.image.delete]', e);
    res.status(500).json({ error: 'failed' });
  }
});
