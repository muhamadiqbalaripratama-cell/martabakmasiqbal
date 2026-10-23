import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, errorText } from '../api';

type S = { fonnte_token_set: boolean; fonnte_token_hint: string | null; fonnte_token_from_env: boolean };
type Msg = { ok: boolean; text: string } | null;

export function Settings({ onExpired }: { onExpired: () => void }) {
  const [s, setS] = useState<S | null>(null);
  const [token, setToken] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [waMsg, setWaMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const [refreshMsg, setRefreshMsg] = useState<Msg>(null);

  const err = (e: unknown, set: (m: Msg) => void) => {
    if (e instanceof ApiError && e.status === 401) return onExpired();
    set({ ok: false, text: errorText(e) });
  };
  const load = () => api<S>('/admin/settings').then(setS).catch((e) => err(e, setWaMsg));
  useEffect(() => {
    load();
  }, []);

  const saveToken = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/admin/settings', { method: 'PUT', body: { fonnte_token: token } });
      setToken('');
      setWaMsg({ ok: true, text: 'Token disimpan.' });
      await load();
    } catch (e) {
      err(e, setWaMsg);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setWaMsg(null);
    try {
      await api('/admin/test-wa', { method: 'POST', body: testPhone ? { phone: testPhone } : {} });
      setWaMsg({ ok: true, text: 'Pesan tes dikirim. Cek WhatsApp.' });
    } catch (e) {
      err(e, setWaMsg);
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/password', { method: 'POST', body: { old_password: oldPw, new_password: newPw } });
      setOldPw('');
      setNewPw('');
      setPwMsg({ ok: true, text: 'Password diganti.' });
    } catch (e) {
      err(e, setPwMsg);
    }
  };

  const refresh = async () => {
    setRefreshMsg(null);
    try {
      const r = await api<{ last_error: string | null }>('/admin/refresh', { method: 'POST' });
      setRefreshMsg(r.last_error ? { ok: false, text: r.last_error } : { ok: true, text: 'Harga diperbarui dan target sudah dicek.' });
    } catch (e) {
      err(e, setRefreshMsg);
    }
  };

  const box = (m: Msg) => m && <div className={m.ok ? 'ok-box' : 'error-box'}>{m.text}</div>;

  return (
    <div className="stack">
      <form className="card card-pad stack" onSubmit={saveToken}>
        <h2 style={{ margin: 0 }}>WhatsApp (Fonnte)</h2>
        <div className="small">
          Status:{' '}
          {s?.fonnte_token_set ? (
            <span className="badge on">token terpasang {s.fonnte_token_hint}{s.fonnte_token_from_env ? ' (dari .env)' : ''}</span>
          ) : (
            <span className="badge bad">belum ada token</span>
          )}
        </div>
        <ol className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Daftar di <a href="https://fonnte.com" target="_blank" rel="noreferrer">fonnte.com</a>, tambahkan device, lalu scan QR dengan WhatsApp nomor pengirim.</li>
          <li>Salin <b>Token</b> device dari menu Device, tempel di bawah.</li>
          <li>Gunakan nomor khusus untuk mengirim, bukan nomor pribadi.</li>
        </ol>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Token Fonnte baru</label>
            <input className="input" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="tempel token di sini" />
          </div>
          <button className="btn btn-primary" disabled={busy || !token.trim()}>Simpan Token</button>
        </div>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Kirim pesan tes ke</label>
            <input className="input num" inputMode="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="kosongkan = semua penerima aktif" />
          </div>
          <button type="button" className="btn" disabled={busy} onClick={test}>Kirim Tes</button>
        </div>
        {box(waMsg)}
      </form>

      <div className="card card-pad stack">
        <h2 style={{ margin: 0 }}>Perbarui Harga Sekarang</h2>
        <div className="hint">Harga diambil otomatis (Binance & Hyperliquid tiap 20 detik, CoinGecko & emas tiap menit). Tombol ini mengambil harga saat ini juga dan langsung mengecek semua target.</div>
        <div><button className="btn" onClick={refresh}>Perbarui Sekarang</button></div>
        {box(refreshMsg)}
      </div>

      <form className="card card-pad stack" onSubmit={changePw}>
        <h2 style={{ margin: 0 }}>Ganti Password Admin</h2>
        <div className="form-grid">
          <div className="field">
            <label>Password lama</label>
            <input className="input" type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          </div>
          <div className="field">
            <label>Password baru (min. 8)</label>
            <input className="input" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={!oldPw || newPw.length < 8}>Ganti Password</button>
        </div>
        {box(pwMsg)}
      </form>
    </div>
  );
}
