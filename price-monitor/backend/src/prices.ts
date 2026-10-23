// Pengambilan harga dari sumber data luar.
//  - Crypto: Binance (realtime, pasangan USDT) → Hyperliquid (realtime, perp USDC)
//            → CoinGecko /simple/price (cadangan & koin yang tidak ada di keduanya)
//  - Emas:   gold-api.com (gratis, tanpa key). Cadangan: harga PAX Gold (PAXG) di CoinGecko,
//            token yang 1:1 dijamin 1 troy ounce emas.

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const GOLD_API_URL = process.env.GOLD_API_URL || 'https://api.gold-api.com/price/XAU';
const BINANCE_BASE = process.env.BINANCE_BASE_URL || 'https://api.binance.com';
const HYPERLIQUID_URL = process.env.HYPERLIQUID_URL || 'https://api.hyperliquid.xyz/info';
const TIMEOUT_MS = 15_000;

export type Quote = { price: number; change24h: number | null };

export class HttpError extends Error {
  constructor(
    public status: number,
    host: string,
  ) {
    super(`HTTP ${status} dari ${host}`);
  }
}

async function getJson(url: string, init?: { method: 'POST'; body: unknown }): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json', 'user-agent': 'price-monitor/0.2' };
  if (url.startsWith(COINGECKO_BASE) && process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }
  if (init) headers['content-type'] = 'application/json';
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    body: init ? JSON.stringify(init.body) : undefined,
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new HttpError(res.status, new URL(url).host);
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

// Harga emas spot USD per troy ounce. change24h dihitung dari riwayat oleh pemanggil.
export async function fetchGold(): Promise<{ price: number; feed: string }> {
  try {
    const data = (await getJson(GOLD_API_URL)) as { price?: unknown };
    if (isNum(data?.price) && data.price > 0) return { price: data.price, feed: 'gold-api' };
    throw new Error('format respons gold-api tidak dikenal');
  } catch (e) {
    console.warn('[prices] gold-api gagal, pakai PAXG:', e instanceof Error ? e.message : e);
    const q = (await fetchCoinGecko(['pax-gold'])).get('pax-gold');
    if (!q) throw new Error('harga emas tidak tersedia');
    return { price: q.price, feed: 'paxg' };
  }
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
