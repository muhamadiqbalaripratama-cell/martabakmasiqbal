import type { ReactNode } from 'react';
import { Icon } from './Icon';

type ChipProps = {
  active?: boolean;
  children: ReactNode;
  count?: number;
  icon?: string;
  onClick?: () => void;
};

export function Chip({ active, children, count, icon, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 38,
        padding: '0 16px',
        borderRadius: 999,
        background: active ? 'var(--green)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--ink-2)',
        border: active ? '1px solid var(--green)' : '1px solid var(--hairline)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        boxShadow: active ? '0 4px 14px -4px rgba(28,90,53,.45)' : 'none',
        cursor: 'pointer',
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
      {count != null && (
        <span
          style={{
            fontSize: 11,
            padding: '1px 8px',
            borderRadius: 999,
            background: active ? 'rgba(255,255,255,.18)' : 'var(--bg-2)',
            color: active ? '#fff' : 'var(--ink-3)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
