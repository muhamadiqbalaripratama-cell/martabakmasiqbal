import type { AlertKind } from './api';

export function usd(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  const max = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: max });
}

export function pct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Waktu WIB (UTC+7, tanpa DST) → "23 Okt 14:05" / "14:05".
function wibParts(t: number | string | Date) {
  const d = new Date(new Date(t).getTime() + 7 * 3600_000);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, time: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}` };
}

export function wibTime(t: number | string | Date): string {
  return wibParts(t).time;
}

export function wibDate(t: number | string | Date): string {
  return wibParts(t).date;
}

export function wib(iso: string | null | undefined, withDate = true): string {
  if (!iso) return '—';
  const p = wibParts(iso);
  return `${withDate ? p.date + ' ' : ''}${p.time} WIB`;
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return 'belum ada data';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export const KIND_LABEL: Record<AlertKind, string> = {
  above: 'Harga naik sampai ≥',
  below: 'Harga turun sampai ≤',
  pct_up: 'Naik dibanding 24 jam lalu ≥',
  pct_down: 'Turun dibanding 24 jam lalu ≥',
};

// Baca angka yang diketik admin, format Indonesia maupun internasional:
//   "100000", "100.000", "100,000", "45,5", "45.5", "4.150,25", "4,150.25", "0,00001234"
// Pemisah yang muncul terakhir dianggap desimal kalau dua jenis dipakai. Kalau hanya satu jenis:
// muncul lebih dari sekali, atau diikuti tepat 3 angka (dan bagian depannya bukan 0) → pemisah ribuan.
export function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s$]/g, '');
  if (!s || !/^[0-9.,]+$/.test(s)) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const parts = s.split(sep);
    const thousands = parts.length > 2 || (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '');
    s = thousands ? parts.join('') : parts.join('.');
  }
  if ((s.match(/\./g) ?? []).length > 1) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function describe(kind: AlertKind, target: number): string {
  return kind === 'above' || kind === 'below' ? `${KIND_LABEL[kind]} ${usd(target)}` : `${KIND_LABEL[kind]} ${target}%`;
}

export const FEED_LABEL: Record<string, string> = {
  binance: 'Binance',
  hyperliquid: 'Hyperliquid',
  coingecko: 'CoinGecko',
  'gold-api': 'gold-api',
  paxg: 'PAXG',
};
