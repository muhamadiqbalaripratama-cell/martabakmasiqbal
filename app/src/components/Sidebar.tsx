import { Icon } from './Icon';
import { Logo } from './Logo';

type Item = { id: string; label: string; icon: string };

const ITEMS: Item[] = [
  { id: 'menu', label: 'Menu', icon: 'menu' },
  { id: 'orders', label: 'Pesanan', icon: 'receipt' },
  { id: 'tables', label: 'Meja', icon: 'table' },
  { id: 'stats', label: 'Laporan', icon: 'stats' },
  { id: 'people', label: 'Pelanggan', icon: 'people' },
];

export function Sidebar({ active = 'menu' }: { active?: string }) {
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
        {ITEMS.map((it) => {
          const on = it.id === active;
          return (
            <div
              key={it.id}
              style={{
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
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--surface-soft)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-3)',
          }}
        >
          <Icon name="settings" size={20} />
        </div>
        <div
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
          IQ
        </div>
      </div>
    </aside>
  );
}
