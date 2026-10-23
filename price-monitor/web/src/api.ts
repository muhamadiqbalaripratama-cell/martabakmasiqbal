export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public detail?: string,
  ) {
    super(code);
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? 'GET',
    headers: opts.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* kosong */
  }
  if (!res.ok) throw new ApiError(res.status, String(data.error ?? `http_${res.status}`), (data.detail ?? data.error) as string);
  return data as T;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Username atau password salah.',
  too_many_attempts: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
  credentials_required: 'Isi username dan password.',
  invalid_input: 'Data belum lengkap atau tidak valid.',
  coin_not_found: 'Koin tidak ditemukan di CoinGecko.',
  price_check_failed: 'Gagal mengecek harga koin. Coba lagi sebentar.',
  search_failed: 'Pencarian gagal (CoinGecko sedang sibuk). Coba lagi sebentar.',
  phone_exists: 'Nomor ini sudah terdaftar.',
  invalid_phone: 'Nomor WA tidak valid.',
  wrong_password: 'Password lama salah.',
  password_too_short: 'Password baru minimal 8 karakter.',
  unauthorized: 'Sesi berakhir, silakan login lagi.',
};

export function errorText(e: unknown): string {
  if (e instanceof ApiError) return MESSAGES[e.code] ?? e.detail ?? e.code;
  return e instanceof Error ? e.message : String(e);
}

export type Asset = {
  id: number;
  symbol: string;
  name: string;
  source: 'coingecko' | 'gold';
  source_id?: string;
  image_url: string | null;
  price: number | null;
  change_24h: number | null;
  price_at: string | null;
  active?: number;
  active_alerts?: number;
};

export type AlertKind = 'above' | 'below' | 'pct_up' | 'pct_down';

export type Alert = {
  id: number;
  asset_id: number;
  symbol: string;
  asset_name: string;
  price: number | null;
  change_24h: number | null;
  kind: AlertKind;
  target: number;
  repeat_mode: 'once' | 'repeat';
  cooldown_min: number;
  note: string | null;
  active: number;
  armed: number;
  last_triggered_at: string | null;
  trigger_count: number;
};

export type Recipient = { id: number; name: string; phone: string; active: number };

export type Notification = {
  id: number;
  alert_id: number | null;
  symbol: string | null;
  price: number | null;
  message: string;
  targets: string;
  status: 'sent' | 'failed' | 'skipped';
  error: string | null;
  created_at: string;
};
