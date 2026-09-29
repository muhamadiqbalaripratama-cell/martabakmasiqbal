import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export const ordersRouter = Router();

const TAX_RATE = 0.11;
const DISCOUNT_RATE = 0.1;

// Metode pembayaran yang diterima: Tunai, QRIS, Transfer Bank BCA.
const PAYMENT_METHODS = ['cash', 'qris', 'transfer-bca'];

type IncomingLine = {
  menu_id?: string;
  name?: string;
  mods?: string;
  qty?: number;
  unit_price?: number;
  monogram?: string;
  accent?: string;
};

type CreateOrderBody = {
  lines?: IncomingLine[];
  type?: string;
  table_no?: string;
  customer_name?: string;
  payment_method?: string;
  cash_received?: number;
};

ordersRouter.post('/', async (req, res) => {
  const body = req.body as CreateOrderBody;

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return res.status(400).json({ error: 'lines_required' });
  }
  if (!body.payment_method) {
    return res.status(400).json({ error: 'payment_method_required' });
  }
  if (!PAYMENT_METHODS.includes(body.payment_method)) {
    return res.status(400).json({ error: 'invalid_payment_method', allowed: PAYMENT_METHODS });
  }

  // Sanitize lines
  const lines = body.lines.map((l) => {
    const qty = Math.max(1, Math.floor(Number(l.qty) || 0));
    const unit_price = Math.max(0, Math.floor(Number(l.unit_price) || 0));
    return {
      menu_id: String(l.menu_id || ''),
      name: String(l.name || ''),
      mods: l.mods ? String(l.mods) : null,
      qty,
      unit_price,
      monogram: String(l.monogram || '?').slice(0, 4),
      accent: String(l.accent || 'green'),
    };
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
    const discount = Math.round(subtotal * DISCOUNT_RATE);
    const tax = Math.round((subtotal - discount) * TAX_RATE);
    const total = subtotal - discount + tax;
    const cash_received =
      body.payment_method === 'cash'
        ? Math.max(total, Math.floor(Number(body.cash_received) || total))
        : total;
    const change_due = Math.max(0, cash_received - total);

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders
         (type, table_no, customer_name, subtotal, discount, tax, total,
          payment_method, cash_received, change_due, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [
        body.type || 'dine-in',
        body.table_no || null,
        body.customer_name || null,
        subtotal,
        discount,
        tax,
        total,
        body.payment_method,
        cash_received,
        change_due,
      ],
    );
    const orderId = result.insertId;

    for (const l of lines) {
      await conn.query(
        `INSERT INTO order_lines
           (order_id, menu_id, name, mods, qty, unit_price, monogram, accent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, l.menu_id, l.name, l.mods, l.qty, l.unit_price, l.monogram, l.accent],
      );
    }

    await conn.commit();
    res.status(201).json({
      id: orderId,
      order_no: String(orderId).padStart(4, '0'),
      subtotal,
      discount,
      tax,
      total,
      cash_received,
      change_due,
    });
  } catch (e) {
    await conn.rollback();
    console.error('[orders.create]', e);
    res.status(500).json({ error: 'failed_to_create_order' });
  } finally {
    conn.release();
  }
});

ordersRouter.get('/today/count', async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()',
    );
    res.json({ count: Number(rows[0].count) });
  } catch (e) {
    console.error('[orders.today]', e);
    res.status(500).json({ error: 'failed' });
  }
});

ordersRouter.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, LPAD(id, 4, '0') AS order_no,
              type, table_no, customer_name, total, payment_method, status, created_at
         FROM orders
        ORDER BY created_at DESC
        LIMIT 50`,
    );
    res.json(rows);
  } catch (e) {
    console.error('[orders.list]', e);
    res.status(500).json({ error: 'failed_to_list_orders' });
  }
});

ordersRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  try {
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT *, LPAD(id, 4, '0') AS order_no FROM orders WHERE id = ?`,
      [id],
    );
    if (!orders[0]) return res.status(404).json({ error: 'not_found' });
    const [lines] = await pool.query(
      'SELECT * FROM order_lines WHERE order_id = ? ORDER BY id',
      [id],
    );
    res.json({ ...orders[0], lines });
  } catch (e) {
    console.error('[orders.get]', e);
    res.status(500).json({ error: 'failed' });
  }
});
