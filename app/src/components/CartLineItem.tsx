import { Icon } from './Icon';
import { fmtRp } from '../data/menu';
import type { Accent } from '../types';

type Props = {
  name: string;
  mods?: string;
  qty: number;
  unitPrice: number;
  accent?: Accent;
  monogram?: string;
  onInc?: () => void;
  onDec?: () => void;
};

const BG: Record<Accent, string> = {
  green: '#dfe9d8',
  yellow: '#fff1b8',
  cream: '#f4e6c5',
  cocoa: '#e9d8c5',
};
const INK: Record<Accent, string> = {
  green: 'var(--green)',
  yellow: '#7a5a08',
  cream: '#6b4f10',
  cocoa: '#5a3a18',
};

const qtyBtn = {
  width: 28,
  height: 28,
  border: 0,
  background: 'transparent',
  color: 'var(--ink-2)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
} as const;

export function CartLineItem({ name, mods, qty, unitPrice, accent = 'green', monogram = 'M', onInc, onDec }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 10,
          background: BG[accent],
          color: INK[accent],
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 22,
        }}
      >
        {monogram}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{name}</div>
        {mods && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{mods}</div>
        )}
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
              background: 'var(--surface-soft)',
              border: '1px solid var(--hairline)',
              borderRadius: 8,
              height: 28,
            }}
          >
            <button style={qtyBtn} onClick={onDec} aria-label="kurangi">
              <Icon name="minus" size={13} />
            </button>
            <div
              style={{
                width: 26,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {qty}
            </div>
            <button style={qtyBtn} onClick={onInc} aria-label="tambah">
              <Icon name="plus" size={13} />
            </button>
          </div>
          <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            {fmtRp(unitPrice * qty)}
          </div>
        </div>
      </div>
    </div>
  );
}
