// Memilih sumber harga untuk tiap koin.
//
// Urutan otomatis: Binance (pasangan <SIMBOL>USDT) → Hyperliquid (perp <SIMBOL>) → CoinGecko.
// Khusus HYPE, Hyperliquid dicoba lebih dulu karena itu bursa asalnya.
//
// Satu simbol bisa dipakai beberapa koin berbeda, jadi Binance/Hyperliquid hanya
// dipakai kalau harganya selisih < 5% dari harga CoinGecko koin tersebut.
import type { RowDataPacket } from 'mysql2';
import { pool } from './db';
import { binanceTrading, fetchBinance, fetchCoinGecko, fetchHyperliquid } from './prices';

export type Feed = 'binance' | 'hyperliquid' | 'coingecko';
export type FeedMode = 'auto' | Feed;

const MAX_DIFF = 0.05;
const close = (a: number, b: number) => Math.abs(a - b) / b < MAX_DIFF;

type Choice = { feed: Feed; binance_symbol: string | null; hl_coin: string | null };

export class FeedError extends Error {}

// Hasil Hyperliquid dipakai bersama selama satu putaran deteksi.
let hlCache: { at: number; data: Map<string, { price: number }> } | null = null;
async function hlQuotes() {
  if (!hlCache || Date.now() - hlCache.at > 60_000) hlCache = { at: Date.now(), data: await fetchHyperliquid() };
  return hlCache.data;
}

async function tryBinance(symbol: string, ref: number | null): Promise<Choice | null> {
  const pair = `${symbol}USDT`;
  if (!(await binanceTrading(pair))) return null;
  if (ref !== null) {
    const q = (await fetchBinance([pair])).get(pair);
    if (!q || !close(q.price, ref)) return null;
  }
  return { feed: 'binance', binance_symbol: pair, hl_coin: null };
}

async function tryHyperliquid(symbol: string, ref: number | null): Promise<Choice | null> {
  const q = (await hlQuotes()).get(symbol);
  if (!q || (ref !== null && !close(q.price, ref))) return null;
  return { feed: 'hyperliquid', binance_symbol: null, hl_coin: symbol };
}

// ref = harga CoinGecko sebagai pembanding. Mode manual tidak memakai pembanding.
export async function chooseFeed(asset: { symbol: string; source_id: string }, mode: FeedMode, ref: number | null): Promise<Choice> {
  const sym = asset.symbol.toUpperCase();
  const cg: Choice = { feed: 'coingecko', binance_symbol: null, hl_coin: null };
  if (mode === 'coingecko') return cg;
  if (mode === 'binance') {
    const c = await tryBinance(sym, null);
    if (!c) throw new FeedError(`Pasangan ${sym}USDT tidak ada di Binance`);
    return c;
  }
  if (mode === 'hyperliquid') {
    const c = await tryHyperliquid(sym, null);
    if (!c) throw new FeedError(`${sym} tidak ada di Hyperliquid`);
    return c;
  }
  // auto — tanpa pembanding, jangan menebak; coba lagi nanti.
  if (ref === null) throw new FeedError('Harga CoinGecko belum tersedia untuk pembanding');
  const order = asset.source_id === 'hyperliquid' ? [tryHyperliquid, tryBinance] : [tryBinance, tryHyperliquid];
  for (const tryIt of order) {
    try {
      const c = await tryIt(sym, ref);
      if (c) return c;
    } catch (e) {
      // Satu sumber sedang gangguan → jangan langsung jatuh ke CoinGecko permanen.
      throw new FeedError(`Gagal mengecek sumber: ${e instanceof Error ? e.message : e}`);
    }
  }
  return cg;
}

export async function saveFeed(assetId: number, c: Choice): Promise<void> {
  await pool.query(
    'UPDATE assets SET feed = ?, binance_symbol = ?, hl_coin = ?, feed_checked_at = UTC_TIMESTAMP() WHERE id = ?',
    [c.feed, c.binance_symbol, c.hl_coin, assetId],
  );
}

// Dipanggil di setiap putaran monitor: tentukan sumber untuk aset yang belum punya,
// dan cek ulang aset "auto" yang memakai CoinGecko sekali sehari (mungkin baru listing).
export async function resolvePendingFeeds(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT id, symbol, source_id, feed_mode, feed, price, price_at FROM assets
     WHERE active = 1 AND source = 'coingecko'
       AND (feed IS NULL
            OR (feed_mode = 'auto' AND feed = 'coingecko'
                AND (feed_checked_at IS NULL OR feed_checked_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR))))
       AND (feed_checked_at IS NULL OR feed_checked_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
     LIMIT 10`);
  if (!rows.length) return;

  // Pembanding: harga CoinGecko terbaru (satu permintaan untuk semua).
  let refs = new Map<string, { price: number }>();
  try {
    refs = await fetchCoinGecko(rows.map((r) => r.source_id as string));
  } catch (e) {
    console.warn('[feeds] CoinGecko tidak tersedia untuk pembanding:', e instanceof Error ? e.message : e);
  }

  for (const r of rows) {
    try {
      const c = await chooseFeed(r as { symbol: string; source_id: string }, r.feed_mode, refs.get(r.source_id)?.price ?? null);
      await saveFeed(r.id, c);
      if (c.feed !== r.feed) console.log(`[feeds] ${r.symbol} → ${c.feed}${c.binance_symbol ? ` (${c.binance_symbol})` : ''}`);
    } catch (e) {
      // Tandai sudah dicek supaya dicoba lagi 10 menit kemudian, bukan tiap putaran.
      await pool.query('UPDATE assets SET feed_checked_at = UTC_TIMESTAMP() WHERE id = ?', [r.id]);
      console.warn(`[feeds] ${r.symbol}: ${e instanceof Error ? e.message : e}`);
    }
  }
}
