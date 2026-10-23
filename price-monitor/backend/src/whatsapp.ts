// Kirim WhatsApp lewat Fonnte (https://fonnte.com). Token diambil dari
// pengaturan admin (tabel settings), atau env FONNTE_TOKEN sebagai cadangan.
import { getSetting } from './db';

const FONNTE_URL = process.env.FONNTE_URL || 'https://api.fonnte.com/send';

export async function getFonnteToken(): Promise<string> {
  return (await getSetting('fonnte_token')) || process.env.FONNTE_TOKEN || '';
}

// "0812-3456-7890" / "+62 812..." → "6281234567890"
export function normalizePhone(raw: string): string | null {
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 9 && d.length <= 16 ? d : null;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendWhatsApp(phones: string[], message: string): Promise<SendResult> {
  const token = await getFonnteToken();
  if (!token) return { ok: false, error: 'Token Fonnte belum diisi (menu Pengaturan)' };
  if (!phones.length) return { ok: false, error: 'Belum ada nomor penerima aktif' };

  const body = new URLSearchParams({ target: phones.join(','), message, countryCode: '62' });
  try {
    const res = await fetch(FONNTE_URL, {
      method: 'POST',
      headers: { Authorization: token, 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let data: { status?: boolean; reason?: string; detail?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      /* bukan JSON */
    }
    if (!res.ok || data.status !== true) {
      return { ok: false, error: (data.reason || data.detail || `HTTP ${res.status}: ${text.slice(0, 200)}`).slice(0, 500) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
