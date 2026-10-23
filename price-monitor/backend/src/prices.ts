// Pengambilan harga dari sumber data luar.
//  - Crypto: Binance (realtime, pasangan USDT) → Hyperliquid (realtime, perp USDC)
//            → CoinGecko /simple/price (cadangan & koin yang tidak ada di keduanya)
//  - Emas:   gold-api.com (gratis, tanpa key). Cadangan: harga PAX Gold (PAXG) di CoinGecko,
//            token yang 1:1 dijamin 1 troy ounce emas.

// Key "Pro" (berbayar) memakai alamat & header yang berbeda dari key "Demo" (gratis).
const CG_PRO = process.env.COINGECKO_PLAN === 'pro';
const COINGECKO_BASE =
  process.env.COINGECKO_BASE_URL || (CG_PRO ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3');
const GOLD_API_URL = process.env.GOLD_API_URL || 'https://api.gold-api.com/price/XAU';
const BINANCE_BASE = process.env.BINANCE_BASE_URL || 'https://api.binance.com';
const HYPERLIQUID_URL = process.env.HYPERLIQUID_URL || 'https://api.hyperliquid.xyz/info';
const TIMEOUT_MS = 15_000;

export type Quote = { price: number; change24h: number | null };

export class HttpError extends Error {
  constructor(
    public status: number,
    host: string,
    detail = '',
  ) {
    super(`HTTP ${status} dari ${host}${detail ? ` (${detail})` : ''}`);
  }
}

// Ambil pesan error singkat dari isi respons (CoinGecko, Binance, dll.).
function errorDetail(text: string): string {
  try {
    const j = JSON.parse(text);
    const m = j?.status?.error_message ?? j?.error ?? j?.msg ?? j?.message;
    if (m) return String(typeof m === 'object' ? JSON.stringify(m) : m).slice(0, 200);
  } catch {
    /* bukan JSON */
  }
  return text.replace(/\s+/g, ' ').slice(0, 120);
}

async function getJson(url: string, init?: { method: 'POST'; body: unknown }): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json', 'user-agent': 'price-monitor/0.2' };
  if (url.startsWith(COINGECKO_BASE) && process.env.COINGECKO_API_KEY) {
    headers[CG_PRO ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }
  if (init) headers['content-type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? 'GET',
      body: init ? JSON.stringify(init.body) : undefined,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    // "fetch failed" saja tidak membantu — sertakan penyebabnya (DNS, TLS, timeout, ...).
    const cause = (e as { cause?: { code?: string; message?: string } }).cause;
    const why = cause?.code || cause?.message || (e instanceof Error ? e.message : String(e));
    throw new Error(`tidak bisa tersambung ke ${new URL(url).host}: ${why}`);
  }
  if (!res.ok) throw new HttpError(res.status, new URL(url).host, errorDetail(await res.text().catch(() => '')));
  return res.json();
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const toNum = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return isNum(n) ? n : null;
};

// ─── Binance ─────────────────────────────────────────────────────────

// Harga & % 24 jam untuk beberapa pasangan sekaligus (mis. BTCUSDT).
// Binance menolak SELURUH permintaan (HTTP 400) kalau ada satu simbol yang tidak valid.
export async function fetchBinance(symbols: string[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  if (!symbols.length) return out;
  const qs = new URLSearchParams({ symbols: JSON.stringify(symbols), type: 'MINI' });
  const rows = (await getJson(`${BINANCE_BASE}/api/v3/ticker/24hr?${qs}`)) as Record<string, unknown>[];
  for (const r of Array.isArray(rows) ? rows : []) {
    const price = toNum(r.lastPrice);
    const open = toNum(r.openPrice);
    if (price && price > 0) {
      out.set(String(r.symbol), { price, change24h: open ? ((price - open) / open) * 100 : null });
    }
  }
  return out;
}

// true kalau pasangan ada dan sedang diperdagangkan di Binance spot.
export async function binanceTrading(symbol: string): Promise<boolean> {
  try {
    const info = (await getJson(`${BINANCE_BASE}/api/v3/exchangeInfo?symbol=${encodeURIComponent(symbol)}`)) as {
      symbols?: { symbol: string; status: string }[];
    };
    return !!info.symbols?.some((s) => s.symbol === symbol && s.status === 'TRADING');
  } catch (e) {
    if (e instanceof HttpError && e.status === 400) return false; // simbol tidak ada
    throw e;
  }
}

// ─── Hyperliquid ─────────────────────────────────────────────────────

// Semua perp Hyperliquid dalam satu permintaan: harga tengah + harga 24 jam lalu.
export async function fetchHyperliquid(): Promise<Map<string, Quote>> {
  const data = (await getJson(HYPERLIQUID_URL, { method: 'POST', body: { type: 'metaAndAssetCtxs' } })) as [
    { universe?: { name: string; isDelisted?: boolean }[] },
    Record<string, unknown>[],
  ];
  const out = new Map<string, Quote>();
  const universe = data?.[0]?.universe ?? [];
  const ctxs = data?.[1] ?? [];
  universe.forEach((u, i) => {
    const c = ctxs[i];
    if (!c || u.isDelisted) return;
    const price = toNum(c.midPx) ?? toNum(c.markPx);
    const prev = toNum(c.prevDayPx);
    if (price && price > 0) out.set(u.name, { price, change24h: prev ? ((price - prev) / prev) * 100 : null });
  });
  return out;
}

// Harga USD untuk beberapa id CoinGecko sekaligus (satu request).
export async function fetchCoinGecko(ids: string[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  if (!ids.length) return out;
  const qs = new URLSearchParams({ ids: ids.join(','), vs_currencies: 'usd', include_24hr_change: 'true' });
  const data = (await getJson(`${COINGECKO_BASE}/simple/price?${qs}`)) as Record<string, Record<string, unknown>>;
  for (const id of ids) {
    const row = data?.[id];
    if (row && isNum(row.usd)) out.set(id, { price: row.usd, change24h: isNum(row.usd_24h_change) ? row.usd_24h_change : null });
  }
  return out;
}

let lastGoldApiError = '';

// Harga emas spot USD per troy ounce. change24h dihitung dari riwayat oleh pemanggil.
// Urutan: gold-api.com → PAXG di Binance → PAXG di CoinGecko.
// PAX Gold (PAXG) adalah token yang dijamin 1 troy ounce emas, harganya mengikuti emas spot.
export async function fetchGold(): Promise<{ price: number; feed: string }> {
  const errors: string[] = [];
  try {
    const data = (await getJson(GOLD_API_URL)) as { price?: unknown };
    if (isNum(data?.price) && data.price > 0) {
      if (lastGoldApiError) console.log('[prices] gold-api pulih');
      lastGoldApiError = '';
      return { price: data.price, feed: 'gold-api' };
    }
    errors.push('gold-api: format respons tidak dikenal');
  } catch (e) {
    errors.push(`gold-api: ${e instanceof Error ? e.message : e}`);
  }
  // Catat sekali saat penyebabnya berubah, bukan tiap menit.
  if (errors[0] !== lastGoldApiError) console.warn(`[prices] ${errors[0]} — memakai harga PAXG`);
  lastGoldApiError = errors[0];
  try {
    const q = (await fetchBinance(['PAXGUSDT'])).get('PAXGUSDT');
    if (q) return { price: q.price, feed: 'paxg' };
  } catch (e) {
    errors.push(`Binance PAXG: ${e instanceof Error ? e.message : e}`);
  }
  try {
    const q = (await fetchCoinGecko(['pax-gold'])).get('pax-gold');
    if (q) return { price: q.price, feed: 'paxg' };
  } catch (e) {
    errors.push(`CoinGecko PAXG: ${e instanceof Error ? e.message : e}`);
  }
  throw new Error(errors.join('; '));
}

export type CoinSearchResult = { id: string; symbol: string; name: string; thumb: string | null; rank: number | null };

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const data = (await getJson(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`)) as {
    coins?: { id: string; symbol: string; name: string; thumb?: string; large?: string; market_cap_rank?: number | null }[];
  };
  return (data?.coins ?? []).slice(0, 15).map((c) => ({
    id: c.id,
    symbol: String(c.symbol).toUpperCase(),
    name: c.name,
    thumb: c.large || c.thumb || null,
    rank: c.market_cap_rank ?? null,
  }));
}

// URL logo koin (dipakai sekali per aset yang belum punya logo).
export async function fetchCoinImages(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ids.length) return out;
  const qs = new URLSearchParams({ vs_currency: 'usd', ids: ids.join(','), per_page: '250' });
  const data = (await getJson(`${COINGECKO_BASE}/coins/markets?${qs}`)) as { id: string; image?: string }[];
  for (const c of Array.isArray(data) ? data : []) if (c.image) out.set(c.id, c.image);
  return out;
}
