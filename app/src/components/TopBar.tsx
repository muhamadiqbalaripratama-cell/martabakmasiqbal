import type { ReactNode } from 'react';
import { Icon } from './Icon';

type TopBarProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  search?: string;
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
          <span style={{ fontSize: 13 }}>{search}</span>
          <div style={{ flex: 1 }} />
          <span
            className="mono"
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
            }}
          >
            ⌘K
          </span>
        </div>
      )}
      {right && <div className="topbar-right">{right}</div>}
    </div>
  );
}
