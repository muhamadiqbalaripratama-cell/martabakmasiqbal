import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { currentUser } from '../auth';
import { parseImage } from '../images';

// Add-on menu (ukuran, topping, tambahan isian, dll), dikelompokkan per grup.
// Dipasang di belakang requireAuth(): semua route butuh login; ubah = admin.
export const optionsRouter = Router();

const IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const ACCENTS = ['green', 'yellow', 'cream', 'cocoa'];
const NOT_DELETED = 'o.deleted_at IS NULL';

const isAdmin = (res: Parameters<typeof currentUser>[0]) => currentUser(res).role === 'admin';

const OPTION_SELECT = `
  SELECT o.id, o.group_id, o.label, o.sub, o.price, o.monogram, o.accent, o.sort_order,
         CAST(o.is_default AS UNSIGNED) AS is_default,
         CAST(o.sold_out AS UNSIGNED) AS sold_out,
         IF(o.image_data IS NULL, NULL, UNIX_TIMESTAMP(o.image_updated_at)) AS image_version
    FROM menu_options o`;

// { groups: [{ id, category, label, kind, max, options: [...] }] }
optionsRouter.get('/', async (_req, res) => {
  try {
    const [groups] = await pool.query<RowDataPacket[]>(
      `SELECT id, category, label, kind, max_select AS max FROM option_groups
        ORDER BY FIELD(category, 'manis', 'asin', 'drink', 'paket'), sort_order`,
    );
    const [options] = await pool.query<RowDataPacket[]>(`${OPTION_SELECT} WHERE ${NOT_DELETED} ORDER BY o.sort_order, o.label`);
    res.json({ groups: groups.map((g) => ({ ...g, options: options.filter((o) => o.group_id === g.id) })) });
  } catch (e) {
    console.error('[options.list]', e);
    res.status(500).json({ error: 'failed' });
  }
});

optionsRouter.get('/:id/image', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.image_mime, o.image_data FROM menu_options o WHERE o.id = ? AND o.image_data IS NOT NULL AND ${NOT_DELETED}`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.setHeader('Content-Type', rows[0].image_mime);
    res.setHeader('Cache-Control', 'private, max-age=604800');
    res.send(rows[0].image_data);
  } catch (e) {
    console.error('[options.image]', e);
    res.status(500).json({ error: 'failed' });
  }
});

type OptionInput = {
  group_id?: string;
  label?: string;
  sub?: string | null;
  price?: number;
  is_default?: boolean;
  sold_out?: boolean;
  accent?: string;
};

function validate(b: OptionInput, creating: boolean): { cols: string[]; vals: unknown[] } | string {
  const cols: string[] = [];
  const vals: unknown[] = [];
  if (creating) {
    if (!b.group_id) return 'group_required';
    cols.push('group_id');
    vals.push(String(b.group_id));
  }
  if (b.label !== undefined || creating) {
    const label = String(b.label ?? '').trim();
    if (!label) return 'name_required';
    cols.push('label');
    vals.push(label.slice(0, 64));
  }
  if (b.price !== undefined || creating) {
    const price = Math.floor(Number(b.price ?? 0));
    if (!Number.isFinite(price) || price < 0 || price > 10_000_000) return 'invalid_price';
    cols.push('price');
    vals.push(price);
  }
  if (b.sub !== undefined) {
    cols.push('sub');
    vals.push(b.sub ? String(b.sub).trim().slice(0, 128) : null);
  }
  if (b.accent !== undefined) {
    if (!ACCENTS.includes(b.accent)) return 'invalid_accent';
    cols.push('accent');
    vals.push(b.accent);
  }
  for (const k of ['is_default', 'sold_out'] as const) {
    if (b[k] !== undefined) {
      cols.push(k);
      vals.push(b[k] ? 1 : 0);
    }
  }
  return { cols, vals };
}

async function getOption(id: string) {
  const [rows] = await pool.query<RowDataPacket[]>(`${OPTION_SELECT} WHERE o.id = ? AND ${NOT_DELETED}`, [id]);
  return rows[0];
}

// Grup "pilih satu" hanya boleh punya satu pilihan awal.
async function enforceSingleDefault(optionId: string) {
  await pool.query(
    `UPDATE menu_options o
       JOIN option_groups g ON g.id = o.group_id
       JOIN menu_options me ON me.id = ? AND me.group_id = o.group_id
        SET o.is_default = 0
      WHERE g.kind = 'single' AND o.id <> ?`,
    [optionId, optionId],
  );
}

optionsRouter.post('/', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  const body = req.body as OptionInput;
  const v = validate(body, true);
  if (typeof v === 'string') return res.status(400).json({ error: v });
  try {
    const [[group]] = await pool.query<RowDataPacket[]>('SELECT id FROM option_groups WHERE id = ?', [body.group_id]);
    if (!group) return res.status(400).json({ error: 'invalid_group' });
    const [[{ next }]] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM menu_options WHERE group_id = ?',
      [body.group_id],
    );
    const id = `o${Date.now().toString(36)}`;
    const label = String(body.label).trim();
    const cols = ['id', 'monogram', 'sort_order', ...v.cols];
    const vals = [id, label[0].toUpperCase(), next, ...v.vals];
    await pool.query(`INSERT INTO menu_options (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, vals);
    if (body.is_default) await enforceSingleDefault(id);
    res.status(201).json(await getOption(id));
  } catch (e) {
    console.error('[options.create]', e);
    res.status(500).json({ error: 'failed' });
  }
});

optionsRouter.patch('/:id', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  const body = req.body as OptionInput;
  const v = validate({ ...body, group_id: undefined }, false);
  if (typeof v === 'string') return res.status(400).json({ error: v });
  if (v.cols.length === 0) return res.status(400).json({ error: 'nothing_to_update' });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE menu_options o SET ${v.cols.map((c) => `o.${c} = ?`).join(', ')} WHERE o.id = ? AND ${NOT_DELETED}`,
      [...v.vals, req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    if (body.is_default) await enforceSingleDefault(req.params.id);
    res.json(await getOption(req.params.id));
  } catch (e) {
    console.error('[options.update]', e);
    res.status(500).json({ error: 'failed' });
  }
});

optionsRouter.put('/:id/image', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  const img = parseImage(req.body, IMAGE_MAX_BYTES);
  if (typeof img === 'string') return res.status(400).json({ error: `image_${img}` });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE menu_options o SET o.image_mime = ?, o.image_data = ?, o.image_updated_at = NOW() WHERE o.id = ? AND ${NOT_DELETED}`,
      [img.mime, img.data, req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json(await getOption(req.params.id));
  } catch (e) {
    console.error('[options.image.put]', e);
    res.status(500).json({ error: 'failed' });
  }
});

optionsRouter.delete('/:id/image', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE menu_options o SET o.image_mime = NULL, o.image_data = NULL, o.image_updated_at = NOW() WHERE o.id = ? AND ${NOT_DELETED}`,
      [req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json(await getOption(req.params.id));
  } catch (e) {
    console.error('[options.image.delete]', e);
    res.status(500).json({ error: 'failed' });
  }
});

// Hapus add-on (ditandai deleted_at supaya seed tidak membuatnya ulang).
optionsRouter.delete('/:id', async (req, res) => {
  if (!isAdmin(res)) return res.status(403).json({ error: 'forbidden' });
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE menu_options o SET o.deleted_at = NOW(), o.image_mime = NULL, o.image_data = NULL WHERE o.id = ? AND ${NOT_DELETED}`,
      [req.params.id],
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[options.delete]', e);
    res.status(500).json({ error: 'failed' });
  }
});
