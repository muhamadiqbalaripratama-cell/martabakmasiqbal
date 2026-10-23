import { useEffect, useState } from 'react';
import { api, type Asset } from '../api';
import { PriceChart, Sparkline } from '../components/Chart';
import { Change, CoinIcon } from '../components/ui';
import { ago, usd, wib } from '../format';

type Point = [number, number];
type PricesRes = { assets: Asset[]; monitor: { interval_sec: number; last_run_at: string | null; last_error: string | null } };

export function Dashboard() {
  const [data, setData] = useState<PricesRes | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sparks, setSparks] = useState<Record<number, Point[]>>({});
  const [open, setOpen] = useState<Asset | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<PricesRes>('/prices')
        .then((d) => alive && (setData(d), setErr(null)))
        .catch(() => alive && setErr('Gagal memuat harga. Mencoba lagi…'));
    load();
    const t = setInterval(load, 30_000);
    const t2 = setInterval(() => tick((n) => n + 1), 10_000);
    return () => {
      alive = false;
      clearInterval(t);
      clearInterval(t2);
    };
  }, []);

  const ids = data?.assets.map((a) => a.id).join(',') ?? '';
  useEffect(() => {
    if (!ids) return;
    let alive = true;
    const load = () =>
      ids.split(',').forEach((id) =>
        api<{ points: Point[] }>(`/history/${id}?range=24h`)
          .then((r) => alive && setSparks((s) => ({ ...s, [id]: r.points })))
          .catch(() => {}),
      );
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [ids]);

  const latest = data?.assets.reduce<string | null>((m, a) => (a.price_at && (!m || a.price_at > m) ? a.price_at : m), null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Harga Hari Ini</h1>
          <div className="muted small">Semua harga dalam USD · diperbarui {ago(latest)}</div>
        </div>
      </div>
      {err && <div className="error-box" style={{ marginBottom: 14 }}>{err}</div>}
      {data?.monitor.last_error && (
        <div className="warn-box small" style={{ marginBottom: 14 }}>
          Sebagian sumber harga sedang bermasalah: {data.monitor.last_error}
        </div>
      )}
      {!data && !err && <div className="empty">Memuat harga…</div>}
      {data && data.assets.length === 0 && <div className="card empty">Belum ada aset yang dipantau. Tambahkan dari halaman Admin.</div>}
      <div className="price-grid">
        {data?.assets.map((a) => (
          <button key={a.id} className="card price-card" onClick={() => setOpen(a)}>
            <div className="pc-head">
              <CoinIcon asset={a} />
              <div style={{ minWidth: 0 }}>
                <div className="pc-sym">{a.symbol}</div>
                <div className="pc-name">{a.name}</div>
              </div>
            </div>
            <div className="pc-price num">{usd(a.price)}</div>
            <Sparkline points={sparks[a.id] ?? []} />
            <div className="pc-foot">
              <Change value={a.change_24h} />
              <span className="muted small">{a.price_at ? wib(a.price_at, false) : 'menunggu data'}</span>
            </div>
          </button>
        ))}
      </div>
      {open && <AssetModal asset={data?.assets.find((a) => a.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </div>
  );
}

const RANGES = [
  ['24h', '24 Jam'],
  ['7d', '7 Hari'],
  ['30d', '30 Hari'],
  ['90d', '90 Hari'],
] as const;

function AssetModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [range, setRange] = useState<string>('24h');
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    setPoints(null);
    api<{ points: Point[] }>(`/history/${asset.id}?range=${range}`)
      .then((r) => setPoints(r.points))
      .catch(() => setPoints([]));
  }, [asset.id, range]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const first = points?.[0]?.[1];
  const last = points?.[points.length - 1]?.[1];
  const rangeChg = first && last ? ((last - first) / first) * 100 : null;
  const hi = points?.length ? Math.max(...points.map((p) => p[1])) : null;
  const lo = points?.length ? Math.min(...points.map((p) => p[1])) : null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={asset.name}>
        <div className="modal-head">
          <CoinIcon asset={asset} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {asset.symbol} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{asset.name}</span>
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{usd(asset.price)}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="card-pad">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="seg">
              {RANGES.map(([k, l]) => (
                <button key={k} className={range === k ? 'active' : ''} onClick={() => setRange(k)}>{l}</button>
              ))}
            </div>
            <Change value={rangeChg} />
          </div>
          {points === null ? <div className="empty">Memuat grafik…</div> : <PriceChart points={points} range={range} />}
          <div className="form-grid small" style={{ marginTop: 12 }}>
            <div><div className="muted">Tertinggi</div><b className="num">{usd(hi)}</b></div>
            <div><div className="muted">Terendah</div><b className="num">{usd(lo)}</b></div>
            <div><div className="muted">Perubahan 24 jam</div><Change value={asset.change_24h} /></div>
            <div><div className="muted">Update terakhir</div><b>{wib(asset.price_at)}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
