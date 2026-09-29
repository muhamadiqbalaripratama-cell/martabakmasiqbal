import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export const ordersRouter = Router();

const TAX_RATE = 0.11;
const DISCOUNT_RATE = 0.1;

// Metode pembayaran yang diterima: Tunai, QRIS, Transfer Bank BCA.
const PAYMENT_METHODS = ['cash', 'qris', 'transfer-bca'];

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Cek isi file benar-benar gambar sesuai mime, bukan sekadar percaya label klien.
function matchesMagic(buf: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

type ProofInput = { mime?: string; data?: string };

function parseProof(p: ProofInput | undefined): { mime: string; data: Buffer } | string {
  if (!p || typeof p.data !== 'string' || typeof p.mime !== 'string') return 'transfer_proof_required';
  if (!PROOF_MIMES.includes(p.mime)) return 'transfer_proof_invalid_type';
  const data = Buffer.from(p.data, 'base64');
  if (data.length === 0) return 'transfer_proof_required';
  if (data.length > PROOF_MAX_BYTES) return 'transfer_proof_too_large';
  if (!matchesMagic(data, p.mime)) return 'transfer_proof_invalid_type';
  return { mime: p.mime, data };
}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

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
  // Wajib untuk transfer-bca: gambar bukti transfer dalam base64.
  transfer_proof?: ProofInput;
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
  let proof: { mime: string; data: Buffer } | null = null;
  if (body.payment_method === 'transfer-bca') {
    const parsed = parseProof(body.transfer_proof);
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed });
    proof = parsed;
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

    if (proof) {
      await conn.query(
        `INSERT INTO order_attachments (order_id, kind, mime, size_bytes, data)
         VALUES (?, 'transfer_proof', ?, ?, ?)`,
        [orderId, proof.mime, proof.data.length, proof.data],
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

// Ringkasan penjualan per hari untuk layar Laporan. ?date=YYYY-MM-DD (default hari ini).
ordersRouter.get('/summary', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
         FROM orders
        WHERE status = 'paid' AND DATE(created_at) = COALESCE(?, CURDATE())
        GROUP BY payment_method`,
      [date],
    );
    const by_method = rows.map((r) => ({
      payment_method: String(r.payment_method),
      count: Number(r.count),
      total: Number(r.total),
    }));
    res.json({
      count: by_method.reduce((s, r) => s + r.count, 0),
      total: by_method.reduce((s, r) => s + r.total, 0),
      by_method,
    });
  } catch (e) {
    console.error('[orders.summary]', e);
    res.status(500).json({ error: 'failed' });
  }
});

// ?date=YYYY-MM-DD → semua pesanan hari itu; tanpa date → 50 terbaru.
ordersRouter.get('/', async (req, res) => {
  const date = isDate(req.query.date) ? req.query.date : null;
  try {
    const [rows] = await pool.query(
      `SELECT o.id, LPAD(o.id, 4, '0') AS order_no,
              o.type, o.table_no, o.customer_name, o.total, o.payment_method, o.status, o.created_at,
              EXISTS (SELECT 1 FROM order_attachments a
                       WHERE a.order_id = o.id AND a.kind = 'transfer_proof') AS has_proof
         FROM orders o
        ${date ? 'WHERE DATE(o.created_at) = ?' : ''}
        ORDER BY o.created_at DESC
        LIMIT ${date ? 1000 : 50}`,
      date ? [date] : [],
    );
    res.json(rows);
  } catch (e) {
    console.error('[orders.list]', e);
    res.status(500).json({ error: 'failed_to_list_orders' });
  }
});

ordersRouter.get('/:id/proof', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mime, data FROM order_attachments WHERE order_id = ? AND kind = 'transfer_proof'`,
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.setHeader('Content-Type', rows[0].mime);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(rows[0].data);
  } catch (e) {
    console.error('[orders.proof]', e);
    res.status(500).json({ error: 'failed' });
  }
});

ordersRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  try {
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, LPAD(o.id, 4, '0') AS order_no,
              EXISTS (SELECT 1 FROM order_attachments a
                       WHERE a.order_id = o.id AND a.kind = 'transfer_proof') AS has_proof
         FROM orders o WHERE o.id = ?`,
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
