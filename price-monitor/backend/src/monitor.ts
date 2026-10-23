// Loop utama: ambil harga → simpan → cek target → kirim WA.
import type { RowDataPacket } from 'mysql2';
import { pool } from './db';
import { fetchCoinGecko, fetchCoinImages, fetchGold, type Quote } from './prices';
import { sendWhatsApp } from './whatsapp';

const INTERVAL_SEC = Math.max(30, Number(process.env.PRICE_INTERVAL_SEC) || 60);
const HISTORY_DAYS = Math.max(7, Number(process.env.HISTORY_DAYS) || 90);

export const monitorState = {
  intervalSec: INTERVAL_SEC,
  lastRunAt: null as Date | null,
  lastError: null as string | null,
};

export type AlertKind = 'above' | 'below' | 'pct_up' | 'pct_down';

export function formatUsd(v: number): string {
  const abs = Math.abs(v);
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

export function describeCondition(kind: AlertKind, target: number): string {
  switch (kind) {
    case 'above':
      return `naik ke ≥ ${formatUsd(target)}`;
    case 'below':
      return `turun ke ≤ ${formatUsd(target)}`;
    case 'pct_up':
      return `naik ≥ ${target}% dalam 24 jam`;
    case 'pct_down':
      return `turun ≥ ${target}% dalam 24 jam`;
  }
}

export function conditionMet(kind: AlertKind, target: number, price: number, change24h: number | null): boolean {
  switch (kind) {
    case 'above':
      return price >= target;
    case 'below':
      return price <= target;
    case 'pct_up':
      return change24h !== null && change24h >= target;
    case 'pct_down':
      return change24h !== null && change24h <= -target;
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// "23 Okt 2026 14:05 WIB" (WIB = UTC+7, tanpa DST)
function wibNow(): string {
  const d = new Date(Date.now() + 7 * 3600_000);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} WIB`;
}

export async function activePhones(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT phone FROM recipients WHERE active = 1');
  return rows.map((r) => r.phone as string);
}

// Harga ~24 jam lalu dari riwayat (untuk emas, yang sumbernya tidak memberi % 24 jam).
async function change24hFromHistory(assetId: number, price: number): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT price FROM price_history
      WHERE asset_id = ? AND ts <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
      ORDER BY ts DESC LIMIT 1`,
    [assetId],
  );
  const old = rows[0]?.price as number | undefined;
  return old ? ((price - old) / old) * 100 : null;
}

async function updatePrices(): Promise<void> {
  const [assets] = await pool.query<RowDataPacket[]>('SELECT id, source, source_id FROM assets WHERE active = 1');
  const coinIds = assets.filter((a) => a.source === 'coingecko').map((a) => a.source_id as string);
  const errors: string[] = [];

  let coins = new Map<string, Quote>();
  if (coinIds.length) {
    try {
      coins = await fetchCoinGecko([...new Set(coinIds)]);
    } catch (e) {
      errors.push(`CoinGecko: ${e instanceof Error ? e.message : e}`);
    }
  }
  let gold: number | null = null;
  if (assets.some((a) => a.source === 'gold')) {
    try {
      gold = await fetchGold();
    } catch (e) {
      errors.push(`Emas: ${e instanceof Error ? e.message : e}`);
    }
  }

  const now = new Date();
  now.setMilliseconds(0);
  for (const a of assets) {
    let q: Quote | undefined;
    if (a.source === 'coingecko') q = coins.get(a.source_id);
    else if (gold !== null) q = { price: gold, change24h: await change24hFromHistory(a.id, gold) };
    if (!q) continue;
    await pool.query('UPDATE assets SET price = ?, change_24h = ?, price_at = ? WHERE id = ?', [
      q.price,
      q.change24h,
      now,
      a.id,
    ]);
    await pool.query('INSERT IGNORE INTO price_history (asset_id, ts, price) VALUES (?, ?, ?)', [a.id, now, q.price]);
  }
  if (errors.length) throw new Error(errors.join(' | '));
}

// Lengkapi logo koin yang belum ada (maks. sekali per 6 jam kalau gagal).
let lastImageTry = 0;
async function fillCoinImages(): Promise<void> {
  if (Date.now() - lastImageTry < 6 * 3600_000) return;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT source_id FROM assets WHERE source = 'coingecko' AND image_url IS NULL",
  );
  if (!rows.length) return;
  lastImageTry = Date.now();
  try {
    const images = await fetchCoinImages(rows.map((r) => r.source_id as string));
    for (const [id, url] of images) {
      await pool.query("UPDATE assets SET image_url = ? WHERE source = 'coingecko' AND source_id = ?", [url.slice(0, 512), id]);
    }
    if (images.size === rows.length) lastImageTry = 0;
  } catch (e) {
    console.warn('[monitor] gagal mengambil logo koin:', e instanceof Error ? e.message : e);
  }
}

async function checkAlerts(): Promise<void> {
  const [alerts] = await pool.query<RowDataPacket[]>(`
    SELECT al.*, a.symbol, a.name, a.price, a.change_24h
      FROM alerts al JOIN assets a ON a.id = al.asset_id
     WHERE al.active = 1 AND a.active = 1 AND a.price IS NOT NULL
       AND a.price_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)`); // abaikan harga basi

  for (const al of alerts) {
    const met = conditionMet(al.kind, al.target, al.price, al.change_24h);
    if (!met) {
      if (!al.armed) await pool.query('UPDATE alerts SET armed = 1 WHERE id = ?', [al.id]);
      continue;
    }
    if (!al.armed) continue;
    const last = al.last_triggered_at ? new Date(al.last_triggered_at).getTime() : 0;
    if (last && Date.now() - last < al.cooldown_min * 60_000) continue;

    const lines = [
      `🔔 *Target Harga Tercapai*`,
      ``,
      `*${al.symbol}* (${al.name})`,
      `Harga sekarang: *${formatUsd(al.price)}*`,
      `Kondisi: ${describeCondition(al.kind, al.target)}`,
    ];
    if (al.change_24h !== null) lines.push(`Perubahan 24 jam: ${pct(al.change_24h)}`);
    if (al.note) lines.push(`Catatan: ${al.note}`);
    lines.push('', wibNow());
    if (al.repeat_mode === 'once') lines.push('_(Target sekali kirim — sekarang dinonaktifkan)_');
    const message = lines.join('\n');

    // Tandai dulu supaya tidak terkirim dua kali walau pengiriman lambat.
    await pool.query(
      `UPDATE alerts SET armed = 0, last_triggered_at = UTC_TIMESTAMP(), trigger_count = trigger_count + 1,
              active = IF(repeat_mode = 'once', 0, active)
        WHERE id = ?`,
      [al.id],
    );
    const phones = await activePhones();
    const result = await sendWhatsApp(phones, message);
    await logNotification({
      alertId: al.id,
      assetId: al.asset_id,
      price: al.price,
      message,
      phones,
      status: result.ok ? 'sent' : phones.length ? 'failed' : 'skipped',
      error: result.ok ? null : result.error,
    });
    console.log(`[alert] #${al.id} ${al.symbol} ${al.kind} ${al.target} → ${result.ok ? 'terkirim' : result.error}`);
  }
}

export async function logNotification(n: {
  alertId: number | null;
  assetId: number | null;
  price: number | null;
  message: string;
  phones: string[];
  status: 'sent' | 'failed' | 'skipped';
  error: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (alert_id, asset_id, price, message, targets, status, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [n.alertId, n.assetId, n.price, n.message, n.phones.join(',').slice(0, 1024), n.status, n.error?.slice(0, 512) ?? null],
  );
}

let lastPrune = 0;
async function prune(): Promise<void> {
  if (Date.now() - lastPrune < 6 * 3600_000) return;
  lastPrune = Date.now();
  await pool.query('DELETE FROM price_history WHERE ts < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)', [HISTORY_DAYS]);
  await pool.query('DELETE FROM notifications WHERE created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 365 DAY)');
  await pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()');
}

let running = false;
export async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    let priceError: string | null = null;
    try {
      await updatePrices();
    } catch (e) {
      priceError = e instanceof Error ? e.message : String(e);
      console.warn('[monitor]', priceError);
    }
    // Tetap cek target untuk harga yang berhasil diperbarui.
    await checkAlerts();
    await fillCoinImages();
    await prune();
    monitorState.lastError = priceError;
  } catch (e) {
    monitorState.lastError = e instanceof Error ? e.message : String(e);
    console.error('[monitor]', e);
  } finally {
    monitorState.lastRunAt = new Date();
    running = false;
  }
}

export function startMonitor(): void {
  console.log(`[monitor] cek harga setiap ${INTERVAL_SEC} detik`);
  const tick = async () => {
    await runOnce();
    setTimeout(tick, INTERVAL_SEC * 1000);
  };
  tick();
}
