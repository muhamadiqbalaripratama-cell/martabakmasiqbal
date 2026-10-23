import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, errorText, type Alert, type AlertKind, type Asset } from '../api';
import { Switch } from '../components/ui';
import { describe, parseNumber, pct, usd, wib } from '../format';

type Form = {
  id: number | null;
  asset_id: string;
  kind: AlertKind;
  target: string;
  repeat_mode: 'once' | 'repeat';
  cooldown_min: string;
  note: string;
};
const EMPTY: Form = { id: null, asset_id: '', kind: 'above', target: '', repeat_mode: 'once', cooldown_min: '60', note: '' };

export function Targets({ onExpired }: { onExpired: () => void }) {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) return onExpired();
    setErr(errorText(e));
  };
  const load = () =>
    Promise.all([api<{ alerts: Alert[] }>('/admin/alerts'), api<{ assets: Asset[] }>('/admin/assets')])
      .then(([a, b]) => {
        setAlerts(a.alerts);
        setAssets(b.assets.filter((x) => x.active));
      })
      .catch(fail);
  useEffect(() => {
    load();
  }, []);

  const selected = assets.find((a) => String(a.id) === form.asset_id);
  const isPrice = form.kind === 'above' || form.kind === 'below';
  const targetNum = parseNumber(form.target);

  // Sama dengan pengecekan di server (monitor.ts → conditionMet).
  const alreadyMet =
    !!selected &&
    targetNum !== null &&
    selected.price !== null &&
    (form.kind === 'above'
      ? selected.price >= targetNum
      : form.kind === 'below'
        ? selected.price <= targetNum
        : form.kind === 'pct_up'
          ? selected.change_24h !== null && selected.change_24h >= targetNum
          : selected.change_24h !== null && selected.change_24h <= -targetNum);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const body = {
      asset_id: Number(form.asset_id),
      kind: form.kind,
      target: targetNum ?? NaN,
      repeat_mode: form.repeat_mode,
      cooldown_min: Number(form.cooldown_min || 0),
      note: form.note,
    };
    if (!body.asset_id) return setErr('Pilih aset dulu.');
    if (!(body.target > 0)) return setErr('Isi target dengan angka lebih dari 0 (contoh: 100000 atau 45,5).');
    setBusy(true);
    try {
      const r = form.id
        ? await api<{ already_met?: boolean }>(`/admin/alerts/${form.id}`, { method: 'PUT', body })
        : await api<{ already_met?: boolean }>('/admin/alerts', { method: 'POST', body });
      setInfo(
        r.already_met
          ? 'Target disimpan. Kondisinya sudah terpenuhi sekarang, jadi WA belum dikirim. WA dikirim nanti saat harga keluar dari kondisi lalu menyentuh target lagi.'
          : 'Target disimpan. Harga dicek setiap 20 detik.',
      );
      setForm(EMPTY);
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (a: Alert, active: boolean) =>
    api(`/admin/alerts/${a.id}`, { method: 'PATCH', body: { active } }).then(load).catch(fail);

  const remove = (a: Alert) =>
    confirm(`Hapus target ${a.symbol} — ${describe(a.kind, a.target)}?`) &&
    api(`/admin/alerts/${a.id}`, { method: 'DELETE' }).then(load).catch(fail);
  const edit = (a: Alert) => {
    setForm({
      id: a.id,
      asset_id: String(a.asset_id),
      kind: a.kind,
      target: String(a.target),
      repeat_mode: a.repeat_mode,
      cooldown_min: String(a.cooldown_min),
      note: a.note ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="stack">
      <form className="card card-pad stack" onSubmit={submit}>
        <h2 style={{ margin: 0 }}>{form.id ? 'Ubah Target' : 'Tambah Target'}</h2>
        {err && <div className="error-box">{err}</div>}
        {info && <div className="ok-box">{info}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Aset</label>
            <select className="input" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })}>
              <option value="">— pilih —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.symbol} · {a.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kondisi</label>
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as AlertKind })}>
              <option value="above">Harga naik sampai ≥ (USD)</option>
              <option value="below">Harga turun sampai ≤ (USD)</option>
              <option value="pct_up">Naik ≥ X% dibanding 24 jam lalu</option>
              <option value="pct_down">Turun ≥ X% dibanding 24 jam lalu</option>
            </select>
          </div>
          <div className="field">
            <label>{isPrice ? 'Target harga (USD)' : 'Persentase (%)'}</label>
            <input className="input num" inputMode="decimal" placeholder={isPrice ? 'mis. 100000 atau 45,5' : 'mis. 5'} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            {form.target.trim() !== '' && (
              <span className="hint" style={{ color: targetNum === null ? 'var(--down)' : undefined }}>
                {targetNum === null ? 'Angka tidak valid' : <>Tersimpan sebagai <b className="num">{isPrice ? usd(targetNum) : `${targetNum}%`}</b></>}
              </span>
            )}
          </div>
          <div className="field">
            <label>Pengiriman</label>
            <select className="input" value={form.repeat_mode} onChange={(e) => setForm({ ...form, repeat_mode: e.target.value as Form['repeat_mode'] })}>
              <option value="once">Sekali saja</option>
              <option value="repeat">Berulang</option>
            </select>
          </div>
          {form.repeat_mode === 'repeat' && (
            <div className="field">
              <label>Jeda minimal (menit)</label>
              <input className="input num" inputMode="numeric" value={form.cooldown_min} onChange={(e) => setForm({ ...form, cooldown_min: e.target.value.replace(/\D/g, '') })} />
            </div>
          )}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Catatan (ikut dikirim di WA, opsional)</label>
            <input className="input" maxLength={255} placeholder="mis. Saatnya take profit" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        {selected && (
          <div className="hint">
            Harga {selected.symbol} sekarang <b className="num">{usd(selected.price)}</b> · dibanding 24 jam lalu {pct(selected.change_24h)}
          </div>
        )}
        {alreadyMet && (
          <div className="warn-box small">
            Perhatian: kondisi ini <b>sudah terpenuhi</b> dengan harga sekarang. WA tidak langsung dikirim. WA baru dikirim setelah harga
            keluar dari kondisi lalu menyentuh target lagi. Periksa lagi angka dan jenis kondisinya (naik/turun).
          </div>
        )}
        <div className="hint">
          {isPrice
            ? 'Harga dicek setiap 20 detik. WA dikirim begitu harga menyentuh target.'
            : 'Dicek setiap 20 detik: persentase dihitung dari harga sekarang dibanding harga 24 jam lalu.'}{' '}
          {form.repeat_mode === 'once'
            ? 'WA dikirim sekali saat kondisi terpenuhi, lalu target otomatis nonaktif.'
            : 'WA dikirim saat kondisi terpenuhi. Akan dikirim lagi setelah harga sempat keluar dari kondisi lalu masuk lagi, dan minimal setelah jeda di atas.'}
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" disabled={busy}>{form.id ? 'Simpan Perubahan' : 'Tambah Target'}</button>
          {form.id && <button type="button" className="btn" onClick={() => setForm(EMPTY)}>Batal</button>}
        </div>
      </form>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 4 }}><h2>Daftar Target</h2></div>
        {alerts === null ? (
          <div className="empty">Memuat…</div>
        ) : alerts.length === 0 ? (
          <div className="empty">Belum ada target. Tambahkan di atas.</div>
        ) : (
          <div className="list">
            {alerts.map((a) => (
              <div key={a.id} className="row" style={{ opacity: a.active ? 1 : 0.6 }}>
                <Switch on={!!a.active} onChange={(v) => toggle(a, v)} label="Aktif" />
                <div className="row-main">
                  <div>
                    <b>{a.symbol}</b> — {describe(a.kind, a.target)}{' '}
                    <span className={`badge ${a.repeat_mode === 'repeat' ? 'gold' : ''}`}>{a.repeat_mode === 'repeat' ? `berulang · ${a.cooldown_min} mnt` : 'sekali'}</span>
                    {!!a.active && !a.armed && (
                      <span className="badge" style={{ marginLeft: 4 }} title="Kondisi sedang terpenuhi. WA dikirim lagi setelah harga keluar dari kondisi lalu menyentuh target lagi.">
                        sudah lewat target · menunggu
                      </span>
                    )}
                  </div>
                  <div className="muted small">
                    Sekarang <span className="num">{usd(a.price)}</span> ({pct(a.change_24h)}) · terkirim {a.trigger_count}×
                    {a.last_triggered_at && <> · terakhir {wib(a.last_triggered_at)}</>}
                    {a.note && <> · “{a.note}”</>}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-sm" onClick={() => edit(a)}>Ubah</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(a)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
