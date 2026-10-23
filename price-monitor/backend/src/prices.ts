// Pengambilan harga dari sumber data luar.
//  - Crypto: CoinGecko /simple/price (gratis; API key "demo" opsional untuk kuota lebih besar)
//  - Emas:   gold-api.com (gratis, tanpa key). Cadangan: harga PAX Gold (PAXG) di CoinGecko,
//            token yang 1:1 dijamin 1 troy ounce emas.

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const GOLD_API_URL = process.env.GOLD_API_URL || 'https://api.gold-api.com/price/XAU';
const TIMEOUT_MS = 15_000;

export type Quote = { price: number; change24h: number | null };

async function getJson(url: string): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json', 'user-agent': 'price-monitor/0.1' };
  if (url.startsWith(COINGECKO_BASE) && process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} dari ${new URL(url).host}`);
  return res.json();
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

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
export async function fetchGold(): Promise<number> {
  try {
    const data = (await getJson(GOLD_API_URL)) as { price?: unknown };
    if (isNum(data?.price) && data.price > 0) return data.price;
    throw new Error('format respons gold-api tidak dikenal');
  } catch (e) {
    console.warn('[prices] gold-api gagal, pakai PAXG:', e instanceof Error ? e.message : e);
    const q = (await fetchCoinGecko(['pax-gold'])).get('pax-gold');
    if (!q) throw new Error('harga emas tidak tersedia');
    return q.price;
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
