import { useEffect, useState, type FormEvent } from 'react';
import { api, errorText } from '../api';
import { AssetsAdmin } from './AssetsAdmin';
import { History } from './History';
import { Recipients } from './Recipients';
import { Settings } from './Settings';
import { Targets } from './Targets';

export type User = { id: number; username: string };

const TABS = [
  ['targets', 'Target Harga'],
  ['assets', 'Aset'],
  ['recipients', 'Penerima WA'],
  ['history', 'Riwayat Notifikasi'],
  ['settings', 'Pengaturan'],
] as const;
type Tab = (typeof TABS)[number][0];

export function Admin({ tab, onUser }: { tab: string; onUser: (u: User | null) => void }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api<{ user: User | null }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);
  useEffect(() => onUser(user ?? null), [user]);

  if (user === undefined) return <div className="page empty">Memuat…</div>;
  if (!user) return <Login onLogin={setUser} />;

  const active: Tab = (TABS.find(([k]) => k === tab)?.[0] ?? 'targets') as Tab;
  const expired = () => setUser(null);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Admin</h1>
      </div>
      <nav className="tabs">
        {TABS.map(([k, l]) => (
          <a key={k} href={`#/admin/${k}`} className={`tab ${active === k ? 'active' : ''}`}>{l}</a>
        ))}
      </nav>
      {active === 'targets' && <Targets onExpired={expired} />}
      {active === 'assets' && <AssetsAdmin onExpired={expired} />}
      {active === 'recipients' && <Recipients onExpired={expired} />}
      {active === 'history' && <History onExpired={expired} />}
      {active === 'settings' && <Settings onExpired={expired} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ user: User }>('/auth/login', { method: 'POST', body: { username, password } });
      onLogin(r.user);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page login-wrap">
      <form className="card login-card stack" onSubmit={submit}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Masuk Admin</h1>
          <div className="muted small">Kelola target harga dan notifikasi WhatsApp.</div>
        </div>
        {err && <div className="error-box">{err}</div>}
        <div className="field">
          <label htmlFor="u">Username</label>
          <input id="u" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input id="p" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
