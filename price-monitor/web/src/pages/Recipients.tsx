import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, errorText, type Recipient } from '../api';
import { Switch } from '../components/ui';

export function Recipients({ onExpired }: { onExpired: () => void }) {
  const [list, setList] = useState<Recipient[] | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) return onExpired();
    setErr(errorText(e));
  };
  const load = () => api<{ recipients: Recipient[] }>('/admin/recipients').then((r) => setList(r.recipients)).catch(fail);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/admin/recipients', { method: 'POST', body: { name, phone } });
      setName('');
      setPhone('');
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (r: Recipient, active: boolean) => api(`/admin/recipients/${r.id}`, { method: 'PATCH', body: { active } }).then(load).catch(fail);
  const remove = (r: Recipient) =>
    confirm(`Hapus penerima ${r.name}?`) && api(`/admin/recipients/${r.id}`, { method: 'DELETE' }).then(load).catch(fail);

  return (
    <div className="stack">
      <form className="card card-pad stack" onSubmit={submit}>
        <h2 style={{ margin: 0 }}>Tambah Penerima</h2>
        {err && <div className="error-box">{err}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Nama</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Iqbal" />
          </div>
          <div className="field">
            <label>Nomor WhatsApp</label>
            <input className="input num" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxx" />
          </div>
          <button className="btn btn-primary" disabled={busy || !name || !phone}>Tambah</button>
        </div>
        <div className="hint">Semua penerima aktif mendapat WA setiap kali ada target yang tercapai. Nomor 08… otomatis diubah ke 628….</div>
      </form>

      <div className="card">
        {list === null ? (
          <div className="empty">Memuat…</div>
        ) : list.length === 0 ? (
          <div className="empty">Belum ada penerima. Notifikasi tidak akan terkirim sampai ada minimal satu nomor.</div>
        ) : (
          <div className="list">
            {list.map((r) => (
              <div key={r.id} className="row" style={{ opacity: r.active ? 1 : 0.6 }}>
                <Switch on={!!r.active} onChange={(v) => toggle(r, v)} label="Aktif" />
                <div className="row-main">
                  <b>{r.name}</b>
                  <div className="muted small num">+{r.phone}</div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => remove(r)}>Hapus</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
