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
  above: 'Harga naik ke ≥',
  below: 'Harga turun ke ≤',
  pct_up: 'Naik 24 jam ≥',
  pct_down: 'Turun 24 jam ≥',
};

export function describe(kind: AlertKind, target: number): string {
  return kind === 'above' || kind === 'below' ? `${KIND_LABEL[kind]} ${usd(target)}` : `${KIND_LABEL[kind]} ${target}%`;
}
