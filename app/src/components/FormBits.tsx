// Potongan kecil form admin (Kelola Menu & Add-on).

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--green)' }} />
      {label}
    </label>
  );
}

export function Badge({ tone, children }: { tone: 'yellow' | 'red' | 'grey'; children: React.ReactNode }) {
  const c = {
    yellow: ['var(--yellow-soft)', '#7a5a08'],
    red: ['var(--danger-soft)', 'var(--danger)'],
    grey: ['var(--bg-2)', 'var(--ink-3)'],
  }[tone];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: c[0], color: c[1] }}>{children}</span>
  );
}
