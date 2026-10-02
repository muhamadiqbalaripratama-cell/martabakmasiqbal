import { Icon } from './Icon';
import { fmtRp } from '../data/menu';
import type { Accent } from '../types';

type MenuCardProps = {
  name: string;
  price: number;
  tag?: string;
  accent?: Accent;
  monogram?: string;
  soldOut?: boolean;
  hot?: boolean;
  imageUrl?: string;
  onAdd?: () => void;
};

const SWATCHES: Record<Accent, [string, string, string]> = {
  green: ['#dfe9d8', '#b8cfa1', 'var(--green)'],
  yellow: ['#fff1b8', '#f5c518', '#7a5a08'],
  cream: ['#f4e6c5', '#e6c97a', '#6b4f10'],
  cocoa: ['#e9d8c5', '#b88f5d', '#5a3a18'],
};

export function MenuCard({
  name,
  price,
  tag,
  accent = 'green',
  monogram = 'M',
  soldOut,
  hot,
  imageUrl,
  onAdd,
}: MenuCardProps) {
  const sw = SWATCHES[accent];
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 12,
        border: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        opacity: soldOut ? 0.6 : 1,
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 10',
          borderRadius: 12,
          position: 'relative',
          background: `linear-gradient(135deg, ${sw[0]}, ${sw[1]})`,
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 64,
            color: sw[2],
            opacity: 0.35,
            letterSpacing: '-0.05em',
          }}
        >
          {monogram}
        </div>
        )}
        {hot && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'var(--yellow)',
              color: 'var(--green)',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.04em',
            }}
          >
            ★ FAVORIT
          </div>
        )}
        {tag && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255,255,255,.85)',
              color: 'var(--ink-2)',
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {tag}
          </div>
        )}
        {soldOut && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(17,36,26,.55)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            HABIS
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 56 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>
          {fmtRp(price)}
        </div>
        <button
          disabled={soldOut}
          onClick={onAdd}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'var(--green)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: soldOut ? 'not-allowed' : 'pointer',
            opacity: soldOut ? 0.5 : 1,
          }}
          aria-label={`Tambah ${name}`}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}
