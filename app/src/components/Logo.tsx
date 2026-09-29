export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: 'var(--green)',
        color: 'var(--yellow)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.5,
        letterSpacing: '-0.04em',
        boxShadow: 'inset 0 0 0 2px rgba(245,197,24,.25)',
      }}
    >
      M
    </div>
  );
}
