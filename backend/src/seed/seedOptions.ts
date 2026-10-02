import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { SEED_GROUPS, SEED_OPTIONS } from './options';

const ASSET_DIR = path.join(__dirname, '..', '..', 'assets', 'addons');

// Sama seperti seedMenu: hanya menambah yang belum ada, tidak menimpa
// perubahan admin, dan add-on yang dihapus (deleted_at) tidak dibuat ulang.
export async function seedOptions(): Promise<void> {
  for (const [i, g] of SEED_GROUPS.entries()) {
    await pool.query(
      `INSERT IGNORE INTO option_groups (id, category, label, kind, max_select, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [g.id, g.category, g.label, g.kind, g.max ?? null, i + 1],
    );
  }
  let added = 0;
  let images = 0;
  for (const [i, o] of SEED_OPTIONS.entries()) {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO menu_options (id, group_id, label, sub, price, is_default, monogram, accent, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.group, o.label, o.sub ?? null, o.price, o.isDefault ? 1 : 0, o.monogram ?? o.label[0], o.accent ?? 'cream', i + 1],
    );
    added += r.affectedRows;
    const file = path.join(ASSET_DIR, `${o.id}.jpg`);
    if (existsSync(file)) {
      const [u] = await pool.query<ResultSetHeader>(
        `UPDATE menu_options SET image_mime = 'image/jpeg', image_data = ?, image_updated_at = NOW()
          WHERE id = ? AND deleted_at IS NULL AND image_data IS NULL AND image_updated_at IS NULL`,
        [readFileSync(file), o.id],
      );
      images += u.affectedRows;
    }
  }
  if (added || images) console.log(`[options] seed: ${added} add-on baru, ${images} foto dipasang`);
}
