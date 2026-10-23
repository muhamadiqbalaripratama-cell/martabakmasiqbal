import { Router, type Request, type Response, type NextFunction } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { changePassword, login, logout, me, requireAdmin } from './auth';
import { getSetting, pool, setSetting } from './db';
import { activePhones, conditionMet, logNotification, monitorState, runOnce, type AlertKind } from './monitor';
import { chooseFeed, FeedError, saveFeed, type FeedMode } from './feeds';
import { fetchCoinGecko, searchCoins } from './prices';
import { getFonnteToken, normalizePhone, sendWhatsApp } from './whatsapp';

// Bungkus handler async supaya error masuk ke handler error Express.
const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const toId = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const isoUtc = (d: unknown) => (d ? new Date(d as string).toISOString() : null);

// ─── Publik ──────────────────────────────────────────────────────────

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => res.json({ ok: true }));

publicRouter.get(
  '/prices',
  h(async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, symbol, name, source, image_url, price, change_24h, price_at, last_feed
         FROM assets WHERE active = 1 ORDER BY sort_order, id`,
    );
    res.json({
      assets: rows.map((r) => ({ ...r, price_at: isoUtc(r.price_at) })),
      monitor: {
        interval_sec: monitorState.intervalSec,
        last_run_at: monitorState.lastRunAt?.toISOString() ?? null,
        last_error: monitorState.lastError,
      },
    });
  }),
);

const RANGES: Record<string, { hours: number; bucketSec: number }> = {
  '24h': { hours: 24, bucketSec: 300 },
  '7d': { hours: 24 * 7, bucketSec: 1800 },
  '30d': { hours: 24 * 30, bucketSec: 7200 },
  '90d': { hours: 24 * 90, bucketSec: 21600 },
};

publicRouter.get(
  '/history/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    const range = RANGES[String(req.query.range || '24h')] ?? RANGES['24h'];
    if (!id) return res.status(400).json({ error: 'bad_id' });
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT FLOOR(UNIX_TIMESTAMP(ts) / ?) * ? AS t, AVG(price) AS p
         FROM price_history
        WHERE asset_id = ? AND ts >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? HOUR)
        GROUP BY t ORDER BY t`,
      [range.bucketSec, range.bucketSec, id, range.hours],
    );
    res.json({ points: rows.map((r) => [Number(r.t) * 1000, Number(r.p)]) });
  }),
);

publicRouter.post('/auth/login', h(login));
publicRouter.post('/auth/logout', h(logout));
publicRouter.get('/auth/me', h(me));

// ─── Admin (wajib login) ─────────────────────────────────────────────

export const adminRouter = Router();
adminRouter.use(requireAdmin());

adminRouter.post('/password', h(changePassword));

// Aset
adminRouter.get(
  '/assets',
  h(async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, (SELECT COUNT(*) FROM alerts al WHERE al.asset_id = a.id AND al.active = 1) AS active_alerts
         FROM assets a ORDER BY sort_order, id`,
    );
    res.json({ assets: rows.map((r) => ({ ...r, price_at: isoUtc(r.price_at) })) });
  }),
);

adminRouter.get(
  '/coins/search',
  h(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return res.json({ coins: [] });
    try {
      res.json({ coins: await searchCoins(q) });
    } catch (e) {
      res.status(502).json({ error: 'search_failed', detail: e instanceof Error ? e.message : String(e) });
    }
  }),
);

adminRouter.post(
  '/assets',
  h(async (req, res) => {
    const coinId = String(req.body?.coingecko_id ?? '').trim().toLowerCase();
    const symbol = String(req.body?.symbol ?? '').trim().toUpperCase().slice(0, 32);
    const name = String(req.body?.name ?? '').trim().slice(0, 128);
    const image = req.body?.image_url ? String(req.body.image_url).slice(0, 512) : null;
    if (!/^[a-z0-9-]{1,128}$/.test(coinId) || !symbol || !name) return res.status(400).json({ error: 'invalid_input' });

    let quote;
    try {
      quote = (await fetchCoinGecko([coinId])).get(coinId);
    } catch (e) {
      return res.status(502).json({ error: 'price_check_failed', detail: e instanceof Error ? e.message : String(e) });
    }
    if (!quote) return res.status(400).json({ error: 'coin_not_found' });

    const [dupe] = await pool.query<RowDataPacket[]>("SELECT id FROM assets WHERE source = 'coingecko' AND source_id = ?", [coinId]);
    if (dupe.length) {
      await pool.query('UPDATE assets SET active = 1 WHERE id = ?', [dupe[0].id]);
      return res.json({ id: dupe[0].id, reactivated: true });
    }
    const [mx] = await pool.query<RowDataPacket[]>('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM assets');
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO assets (symbol, name, source, source_id, image_url, sort_order, price, change_24h, price_at, last_feed)
       VALUES (?, ?, 'coingecko', ?, ?, ?, ?, ?, UTC_TIMESTAMP(), 'coingecko')`,
      [symbol, name, coinId, image, mx[0].n, quote.price, quote.change24h],
    );
    // Pilih sumber harga sekarang juga; kalau gagal, monitor mencoba lagi nanti.
    let feed: string | null = null;
    try {
      const c = await chooseFeed({ symbol, source_id: coinId }, 'auto', quote.price);
      await saveFeed(r.insertId, c);
      feed = c.feed;
    } catch (e) {
      console.warn(`[feeds] ${symbol}:`, e instanceof Error ? e.message : e);
    }
    res.json({ id: r.insertId, feed });
  }),
);

const FEED_MODES: FeedMode[] = ['auto', 'binance', 'hyperliquid', 'coingecko'];

adminRouter.patch(
  '/assets/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ error: 'bad_id' });
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (req.body?.active !== undefined) {
      sets.push('active = ?');
      vals.push(req.body.active ? 1 : 0);
    }
    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim().slice(0, 128);
      if (!name) return res.status(400).json({ error: 'invalid_input' });
      sets.push('name = ?');
      vals.push(name);
    }
    if (req.body?.sort_order !== undefined && Number.isInteger(req.body.sort_order)) {
      sets.push('sort_order = ?');
      vals.push(req.body.sort_order);
    }
    if (req.body?.feed_mode !== undefined) {
      const mode = String(req.body.feed_mode) as FeedMode;
      if (!FEED_MODES.includes(mode)) return res.status(400).json({ error: 'invalid_input' });
      const [rows] = await pool.query<RowDataPacket[]>("SELECT symbol, source_id FROM assets WHERE id = ? AND source = 'coingecko'", [id]);
      if (!rows[0]) return res.status(400).json({ error: 'invalid_input' });
      try {
        let ref: number | null = null;
        if (mode === 'auto') {
          // CoinGecko gagal → tetap bisa memilih lewat daftar koin besar / cek silang Binance-Hyperliquid.
          ref = await fetchCoinGecko([rows[0].source_id])
            .then((m) => m.get(rows[0].source_id)?.price ?? null)
            .catch(() => null);
        }
        const c = await chooseFeed(rows[0] as { symbol: string; source_id: string }, mode, ref);
        await saveFeed(id, c);
      } catch (e) {
        if (e instanceof FeedError) return res.status(400).json({ error: 'feed_unavailable', detail: e.message });
        return res.status(502).json({ error: 'feed_check_failed', detail: e instanceof Error ? e.message : String(e) });
      }
      sets.push('feed_mode = ?');
      vals.push(mode);
    }
    if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' });
    await pool.query(`UPDATE assets SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  '/assets/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ error: 'bad_id' });
    await pool.query('DELETE FROM assets WHERE id = ?', [id]); // target & riwayat ikut terhapus
    res.json({ ok: true });
  }),
);

// Target harga
const KINDS: AlertKind[] = ['above', 'below', 'pct_up', 'pct_down'];

function parseAlert(body: Record<string, unknown>) {
  const assetId = toId(body.asset_id);
  const kind = String(body.kind) as AlertKind;
  const target = Number(body.target);
  const repeat = body.repeat_mode === 'repeat' ? 'repeat' : 'once';
  const cooldown = Math.round(Number(body.cooldown_min ?? 60));
  const note = body.note ? String(body.note).trim().slice(0, 255) : null;
  if (!assetId || !KINDS.includes(kind) || !Number.isFinite(target) || target <= 0) return null;
  if (!Number.isFinite(cooldown) || cooldown < 0 || cooldown > 10080) return null;
  return { assetId, kind, target, repeat, cooldown, note };
}

// Kalau kondisi SUDAH terpenuhi saat target dibuat/diubah/diaktifkan, jangan langsung
// kirim WA: tunggu harga keluar dari kondisi lalu menyentuh target lagi (armed = 0).
async function startArmed(assetId: number, kind: AlertKind, target: number): Promise<0 | 1> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT price, change_24h FROM assets
      WHERE id = ? AND price IS NOT NULL AND price_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)`,
    [assetId],
  );
  const a = rows[0];
  return a && conditionMet(kind, target, a.price, a.change_24h) ? 0 : 1;
}

adminRouter.get(
  '/alerts',
  h(async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT al.*, a.symbol, a.name AS asset_name, a.price, a.change_24h
         FROM alerts al JOIN assets a ON a.id = al.asset_id
        ORDER BY al.active DESC, al.created_at DESC`,
    );
    res.json({
      alerts: rows.map((r) => ({ ...r, last_triggered_at: isoUtc(r.last_triggered_at), created_at: isoUtc(r.created_at) })),
    });
  }),
);

adminRouter.post(
  '/alerts',
  h(async (req, res) => {
    const a = parseAlert(req.body ?? {});
    if (!a) return res.status(400).json({ error: 'invalid_input' });
    const armed = await startArmed(a.assetId, a.kind, a.target);
    const [r] = await pool.query<ResultSetHeader>(
      'INSERT INTO alerts (asset_id, kind, target, repeat_mode, cooldown_min, note, armed) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [a.assetId, a.kind, a.target, a.repeat, a.cooldown, a.note, armed],
    );
    res.json({ id: r.insertId, already_met: armed === 0 });
  }),
);

adminRouter.put(
  '/alerts/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    const a = parseAlert(req.body ?? {});
    if (!id || !a) return res.status(400).json({ error: 'invalid_input' });
    const active = req.body?.active === false ? 0 : 1;
    // Target diubah → mulai dari awal.
    const armed = await startArmed(a.assetId, a.kind, a.target);
    await pool.query(
      `UPDATE alerts SET asset_id = ?, kind = ?, target = ?, repeat_mode = ?, cooldown_min = ?, note = ?,
              active = ?, armed = ?, last_triggered_at = NULL WHERE id = ?`,
      [a.assetId, a.kind, a.target, a.repeat, a.cooldown, a.note, active, armed, id],
    );
    res.json({ ok: true, already_met: armed === 0 });
  }),
);

adminRouter.patch(
  '/alerts/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id || typeof req.body?.active !== 'boolean') return res.status(400).json({ error: 'invalid_input' });
    if (!req.body.active) {
      await pool.query('UPDATE alerts SET active = 0 WHERE id = ?', [id]);
      return res.json({ ok: true });
    }
    // Diaktifkan lagi → mulai dari awal.
    const [rows] = await pool.query<RowDataPacket[]>('SELECT asset_id, kind, target FROM alerts WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const armed = await startArmed(rows[0].asset_id, rows[0].kind, rows[0].target);
    await pool.query('UPDATE alerts SET active = 1, armed = ?, last_triggered_at = NULL WHERE id = ?', [armed, id]);
    res.json({ ok: true, already_met: armed === 0 });
  }),
);

adminRouter.delete(
  '/alerts/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ error: 'bad_id' });
    await pool.query('DELETE FROM alerts WHERE id = ?', [id]);
    res.json({ ok: true });
  }),
);

// Penerima WA
adminRouter.get(
  '/recipients',
  h(async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, phone, active FROM recipients ORDER BY id');
    res.json({ recipients: rows });
  }),
);

adminRouter.post(
  '/recipients',
  h(async (req, res) => {
    const name = String(req.body?.name ?? '').trim().slice(0, 128);
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    if (!name || !phone) return res.status(400).json({ error: 'invalid_input' });
    try {
      const [r] = await pool.query<ResultSetHeader>('INSERT INTO recipients (name, phone) VALUES (?, ?)', [name, phone]);
      res.json({ id: r.insertId });
    } catch (e) {
      if ((e as { code?: string }).code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'phone_exists' });
      throw e;
    }
  }),
);

adminRouter.patch(
  '/recipients/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id || typeof req.body?.active !== 'boolean') return res.status(400).json({ error: 'invalid_input' });
    await pool.query('UPDATE recipients SET active = ? WHERE id = ?', [req.body.active ? 1 : 0, id]);
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  '/recipients/:id',
  h(async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ error: 'bad_id' });
    await pool.query('DELETE FROM recipients WHERE id = ?', [id]);
    res.json({ ok: true });
  }),
);

// Pengaturan WA
adminRouter.get(
  '/settings',
  h(async (_req, res) => {
    const dbToken = await getSetting('fonnte_token');
    const token = await getFonnteToken();
    res.json({
      fonnte_token_set: !!token,
      fonnte_token_hint: token ? `••••${token.slice(-4)}` : null,
      fonnte_token_from_env: !dbToken && !!process.env.FONNTE_TOKEN,
    });
  }),
);

adminRouter.put(
  '/settings',
  h(async (req, res) => {
    if (typeof req.body?.fonnte_token !== 'string') return res.status(400).json({ error: 'invalid_input' });
    await setSetting('fonnte_token', req.body.fonnte_token.trim().slice(0, 256));
    res.json({ ok: true });
  }),
);

adminRouter.post(
  '/test-wa',
  h(async (req, res) => {
    const single = req.body?.phone ? normalizePhone(String(req.body.phone)) : null;
    if (req.body?.phone && !single) return res.status(400).json({ error: 'invalid_phone' });
    const phones = single ? [single] : await activePhones();
    const message = '✅ Tes notifikasi dari Pantau Harga. Kalau pesan ini masuk, notifikasi WA sudah siap.';
    const result = await sendWhatsApp(phones, message);
    await logNotification({
      alertId: null,
      assetId: null,
      price: null,
      message,
      phones,
      status: result.ok ? 'sent' : 'failed',
      error: result.ok ? null : result.error,
    });
    res.status(result.ok ? 200 : 502).json(result);
  }),
);

adminRouter.get(
  '/notifications',
  h(async (req, res) => {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT n.*, a.symbol FROM notifications n LEFT JOIN assets a ON a.id = n.asset_id
        ORDER BY n.id DESC LIMIT ?`,
      [limit],
    );
    res.json({ notifications: rows.map((r) => ({ ...r, created_at: isoUtc(r.created_at) })) });
  }),
);

adminRouter.post(
  '/refresh',
  h(async (_req, res) => {
    await runOnce();
    res.json({ ok: true, last_error: monitorState.lastError });
  }),
);
