import { useEffect, useState } from 'react';
import { api } from './api';
import { Admin, type User } from './pages/Admin';
import { Dashboard } from './pages/Dashboard';

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#\/?/, '');
}

export function App() {
  const route = useHash();
  const [user, setUser] = useState<User | null>(null);
  const [adminKey, setAdminKey] = useState(0);
  const isAdmin = route.startsWith('admin');
  const tab = route.split('/')[1] ?? '';

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setAdminKey((k) => k + 1); // tampilkan ulang form login
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <a href="#/" className="brand">
            <span className="brand-mark">
              <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
                <path d="M5 23l7-8 6 5 9-11" stroke="#1a1300" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Pantau Harga
          </a>
          <div className="spacer" />
          {isAdmin ? (
            <>
              <a href="#/" className="btn btn-sm btn-ghost">Dashboard</a>
              {user && <button className="btn btn-sm" onClick={logout}>Keluar</button>}
            </>
          ) : (
            <a href="#/admin/targets" className="btn btn-sm">Admin</a>
          )}
        </div>
      </header>
      {isAdmin ? <Admin key={adminKey} tab={tab} onUser={setUser} /> : <Dashboard />}
    </>
  );
}
