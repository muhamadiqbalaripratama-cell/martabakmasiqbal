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
    <aside
      style={{
        width: 88,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0 16px',
      }}
    >
      <Logo size={44} />
      <div style={{ height: 28 }} />
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 12px' }}>
        {items.map((it) => {
          const on = it.id === active;
          return (
            <div
              key={it.id}
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
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <button
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
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {user.role === 'admin' ? 'Admin' : 'Operator'}
        </div>
      </div>
    </aside>
  );
}
