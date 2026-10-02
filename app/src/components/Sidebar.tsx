import { Icon } from './Icon';
import { Logo } from './Logo';
import { useApp } from '../state/store';
import type { Screen } from '../types';

// `screen` = item bisa diklik. Item tanpa screen belum punya halaman.
// `adminOnly` = disembunyikan untuk operator.
type Item = { id: string; label: string; icon: string; screen?: Screen; adminOnly?: boolean };

const ITEMS: Item[] = [
  { id: 'menu', label: 'Menu', icon: 'menu', screen: 'menu' },
  { id: 'orders', label: 'Pesanan', icon: 'receipt' },
  { id: 'tables', label: 'Meja', icon: 'table' },
  { id: 'stats', label: 'Laporan', icon: 'stats', screen: 'report', adminOnly: true },
  { id: 'people', label: 'Pelanggan', icon: 'people' },
  { id: 'users', label: 'Pengguna', icon: 'user', screen: 'users', adminOnly: true },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

export function Sidebar({ active = 'menu' }: { active?: string }) {
  const { goto, user, logout } = useApp();
  const items = ITEMS.filter((it) => !it.adminOnly || user.role === 'admin');
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Logo size={44} />
      </div>
      <nav className="sidebar-nav">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <div
              key={it.id}
              className={it.screen ? undefined : 'sidebar-item-disabled'}
              role={it.screen ? 'button' : undefined}
              onClick={it.screen ? () => goto(it.screen!) : undefined}
              style={{
                cursor: it.screen ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 4px',
                borderRadius: 12,
                background: on ? 'var(--green-tint)' : 'transparent',
                color: on ? 'var(--green)' : 'var(--ink-3)',
                fontWeight: on ? 600 : 500,
                fontSize: 11,
                position: 'relative',
              }}
            >
              {on && (
                <div
                  className="sidebar-active-bar"
                  style={{
                    position: 'absolute',
                    left: -12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 24,
                    background: 'var(--green)',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              <Icon name={it.icon} size={20} />
              <span>{it.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-user">
        <button
          className="sidebar-logout"
          onClick={() => {
            if (window.confirm(`Keluar dari akun ${user.name}?`)) logout();
          }}
          title="Keluar"
          aria-label="Keluar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: 0,
            background: 'var(--surface-soft)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-3)',
            cursor: 'pointer',
          }}
        >
          <Icon name="logout" size={20} />
        </button>
        <div
          className="sidebar-avatar"
          title={`${user.name} (${user.role === 'admin' ? 'Admin' : 'Operator'})`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--yellow)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            color: 'var(--green)',
            fontSize: 14,
            boxShadow: '0 0 0 2px var(--surface), 0 0 0 3px var(--hairline)',
          }}
        >
          {initials(user.name)}
        </div>
        <div className="sidebar-role" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {user.role === 'admin' ? 'Admin' : 'Operator'}
        </div>
      </div>
    </aside>
  );
}
