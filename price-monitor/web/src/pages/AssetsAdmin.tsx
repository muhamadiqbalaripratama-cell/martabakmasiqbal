import { useEffect, useRef, useState } from 'react';
import { api, ApiError, errorText, type Asset } from '../api';
import { CoinIcon, Switch } from '../components/ui';
import { pct, usd } from '../format';

type Coin = { id: string; symbol: string; name: string; thumb: string | null; rank: number | null };

export function AssetsAdmin({ onExpired }: { onExpired: () => void }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Coin[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const timer = useRef<number>();

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) return onExpired();
    setErr(errorText(e));
  };
  const load = () => api<{ assets: Asset[] }>('/admin/assets').then((r) => setAssets(r.assets)).catch(fail);
  useEffect(() => {
    load();
  }, []);

  // Cari koin di CoinGecko (jeda 400 ms setelah berhenti mengetik).
  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) return setResults(null);
    timer.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        setResults((await api<{ coins: Coin[] }>(`/admin/coins/search?q=${encodeURIComponent(q.trim())}`)).coins);
      } catch (e) {
        fail(e);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [q]);

  const add = async (c: Coin) => {
    setErr(null);
    setOk(null);
    setAdding(c.id);
    try {
      await api('/admin/assets', { method: 'POST', body: { coingecko_id: c.id, symbol: c.symbol, name: c.name, image_url: c.thumb } });
      setOk(`${c.symbol} ditambahkan.`);
      setQ('');
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setAdding(null);
    }
  };

  const toggle = (a: Asset, active: boolean) => api(`/admin/assets/${a.id}`, { method: 'PATCH', body: { active } }).then(load).catch(fail);
  const move = async (i: number, dir: -1 | 1) => {
    if (!assets) return;
    const list = [...assets];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setAssets(list);
    await Promise.all(list.map((a, idx) => api(`/admin/assets/${a.id}`, { method: 'PATCH', body: { sort_order: idx } }))).catch(fail);
  };
  const remove = (a: Asset) =>
    confirm(`Hapus ${a.symbol}? Semua target dan riwayat harganya ikut terhapus.`) &&
    api(`/admin/assets/${a.id}`, { method: 'DELETE' }).then(load).catch(fail);

  const have = new Set(assets?.filter((a) => a.source === 'coingecko').map((a) => a.source_id));

  return (
    <div className="stack">
      <div className="card card-pad stack">
        <h2 style={{ margin: 0 }}>Tambah Koin Crypto</h2>
        <div className="field">
          <label htmlFor="q">Cari nama atau simbol koin</label>
          <input id="q" className="input" placeholder="mis. solana, XRP, dogecoin" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="hint">Data dari CoinGecko — hampir semua koin tersedia.</span>
        </div>
        {err && <div className="error-box">{err}</div>}
        {ok && <div className="ok-box">{ok}</div>}
        {searching && <div className="muted small">Mencari…</div>}
        {results && !searching && (
          <div className="card list">
            {results.length === 0 && <div className="empty">Tidak ditemukan.</div>}
            {results.map((c) => (
              <div key={c.id} className="row">
                <CoinIcon asset={{ symbol: c.symbol, source: 'coingecko', image_url: c.thumb }} size={28} />
                <div className="row-main">
                  <b>{c.symbol}</b> <span className="muted">{c.name}</span>
                  {c.rank && <span className="badge" style={{ marginLeft: 6 }}>#{c.rank}</span>}
                  <div className="muted small">{c.id}</div>
                </div>
                {have.has(c.id) ? (
                  <span className="badge on">sudah ada</span>
                ) : (
                  <button className="btn btn-sm btn-primary" disabled={adding !== null} onClick={() => add(c)}>
                    {adding === c.id ? 'Menambah…' : 'Tambah'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 4 }}>
          <h2>Aset Dipantau</h2>
          <div className="hint">Aset nonaktif tidak tampil di dashboard dan harganya tidak diambil.</div>
        </div>
        {assets === null ? (
          <div className="empty">Memuat…</div>
        ) : (
          <div className="list">
            {assets.map((a, i) => (
              <div key={a.id} className="row" style={{ opacity: a.active ? 1 : 0.6 }}>
                <Switch on={!!a.active} onChange={(v) => toggle(a, v)} label="Aktif" />
                <CoinIcon asset={a} size={30} />
                <div className="row-main">
                  <b>{a.symbol}</b> <span className="muted">{a.name}</span>{' '}
                  {a.source === 'gold' && <span className="badge gold">emas spot</span>}
                  <div className="muted small num">
                    {usd(a.price)} · 24 jam {pct(a.change_24h)} · {a.active_alerts ?? 0} target aktif
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                  <button className="btn btn-sm" onClick={() => move(i, 1)} disabled={i === assets.length - 1} aria-label="Turun">↓</button>
                  {a.source !== 'gold' && <button className="btn btn-sm btn-danger" onClick={() => remove(a)}>Hapus</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
