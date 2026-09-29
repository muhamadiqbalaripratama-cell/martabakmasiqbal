import { Router } from 'express';
import { pool } from '../db';

export const menuRouter = Router();

menuRouter.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, category, name, price, monogram, accent, tag,
              CAST(hot AS UNSIGNED) AS hot,
              CAST(sold_out AS UNSIGNED) AS sold_out
         FROM menu_items
        ORDER BY category, name`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[menu.list]', e);
    res.status(500).json({ error: 'failed_to_fetch_menu' });
  }
});
