import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { SEED_MENU } from './menu';

// backend/assets/menu — sama untuk `tsx src/...` maupun `node dist/...`.
const ASSET_DIR = path.join(__dirname, '..', '..', 'assets', 'menu');

// Tambahkan item menu bawaan yang belum ada. Item yang sudah ada (termasuk
// yang diubah/dinonaktifkan admin) tidak disentuh, kecuali melengkapi
// deskripsi kosong dan foto yang belum pernah diisi.
export async function seedMenu(): Promise<void> {
  let added = 0;
  let images = 0;
  for (const [i, m] of SEED_MENU.entries()) {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO menu_items
         (id, category, name, description, price, monogram, accent, tag, hot, sold_out, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.category, m.name, m.description, m.price, m.monogram, m.accent, m.tag ?? null, m.hot ? 1 : 0, m.soldOut ? 1 : 0, i + 1],
    );
    added += r.affectedRows;
    // Item dari versi lama belum punya urutan (0) → samakan dengan daftar bawaan.
    await pool.query('UPDATE menu_items SET sort_order = ? WHERE id = ? AND sort_order = 0', [i + 1, m.id]);

    await pool.query(
      `UPDATE menu_items SET description = ? WHERE id = ? AND deleted_at IS NULL AND (description IS NULL OR description = '')`,
      [m.description, m.id],
    );

    // Foto bawaan hanya dipasang kalau belum pernah ada foto (image_updated_at
    // NULL). Kalau admin menghapus fotonya, image_updated_at terisi → tidak
    // dipasang ulang.
    const file = path.join(ASSET_DIR, `${m.id}.jpg`);
    if (existsSync(file)) {
      const [u] = await pool.query<ResultSetHeader>(
        `UPDATE menu_items SET image_mime = 'image/jpeg', image_data = ?, image_updated_at = NOW()
          WHERE id = ? AND deleted_at IS NULL AND image_data IS NULL AND image_updated_at IS NULL`,
        [readFileSync(file), m.id],
      );
      images += u.affectedRows;
    }
  }
  if (added || images) console.log(`[menu] seed: ${added} item baru, ${images} foto dipasang`);
}
