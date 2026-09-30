import type { CSSProperties, ReactNode } from 'react';

export const inputStyle: CSSProperties = {
  width: '100%',
  height: 46,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid var(--hairline-2)',
  background: 'var(--surface-soft)',
  font: 'inherit',
  fontSize: 15,
  color: 'var(--ink)',
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</span>
      {children}
    </label>
  );
}
