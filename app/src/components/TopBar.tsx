import type { ReactNode } from 'react';
import { Icon } from './Icon';

type TopBarProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
};

export function TopBar({ title, subtitle, right, search }: TopBarProps) {
  return (
    <div
      className="topbar"
      style={{
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div className="topbar-title" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {title}
        </div>
        {subtitle && <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{subtitle}</div>}
      </div>
      {search && (
        <div
          className="topbar-search"
          style={{
            flex: 1,
            maxWidth: 360,
            marginLeft: 24,
            height: 40,
            borderRadius: 10,
            background: 'var(--surface-soft)',
            border: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            color: 'var(--ink-3)',
          }}
        >
          <Icon name="search" size={16} />
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label="Cari menu"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', font: 'inherit', fontSize: 13, color: 'var(--ink)' }}
          />
        </div>
      )}
      {right && <div className="topbar-right">{right}</div>}
    </div>
  );
}
