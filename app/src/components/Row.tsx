export function Row({ k, v, valueColor }: { k: string; v: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-3)' }}>{k}</span>
      <span className="tnum" style={{ color: valueColor || 'var(--ink-2)', fontWeight: 600 }}>{v}</span>
    </div>
  );
}
