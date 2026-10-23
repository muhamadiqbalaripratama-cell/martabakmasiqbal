import { useEffect, useState } from 'react';
import { api, ApiError, errorText, type Notification } from '../api';
import { wib } from '../format';

const STATUS: Record<Notification['status'], [string, string]> = {
  sent: ['terkirim', 'on'],
  failed: ['gagal', 'bad'],
  skipped: ['tidak dikirim', 'off'],
};

export function History({ onExpired }: { onExpired: () => void }) {
  const [list, setList] = useState<Notification[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = () =>
    api<{ notifications: Notification[] }>('/admin/notifications?limit=200')
      .then((r) => setList(r.notifications))
      .catch((e) => (e instanceof ApiError && e.status === 401 ? onExpired() : setErr(errorText(e))));
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
        <h2 style={{ margin: 0, flex: 1 }}>200 Notifikasi Terakhir</h2>
        <button className="btn btn-sm" onClick={load}>Muat ulang</button>
      </div>
      {err && <div className="card-pad"><div className="error-box">{err}</div></div>}
      {list === null ? (
        <div className="empty">Memuat…</div>
      ) : list.length === 0 ? (
        <div className="empty">Belum ada notifikasi.</div>
      ) : (
        <div className="list">
          {list.map((n) => {
            const [label, cls] = STATUS[n.status];
            const title = n.message.split('\n').find((l) => l.startsWith('*') && !l.includes('Target Harga')) ?? n.message.split('\n')[0];
            return (
              <div key={n.id} className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => setOpen(open === n.id ? null : n.id)}>
                <div className="row-main">
                  <div>
                    <span className={`badge ${cls}`}>{label}</span> <b>{n.symbol ?? 'Tes'}</b>{' '}
                    <span className="muted small">{wib(n.created_at)}</span>
                  </div>
                  <div className="small" style={{ marginTop: 2 }}>{title.replace(/\*/g, '')}</div>
                  {n.error && <div className="small" style={{ color: 'var(--down)' }}>{n.error}</div>}
                  {open === n.id && (
                    <>
                      <div className="msg-pre">{n.message.replace(/\*/g, '')}</div>
                      <div className="muted small" style={{ marginTop: 6 }}>Ke: {n.targets || '—'}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
