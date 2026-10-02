import type { Accent } from '../types';

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

type Props = { imageUrl?: string; monogram: string; accent?: Accent; size: number };

// Gambar kecil item menu: foto kalau ada, kalau tidak huruf monogram berwarna.
export function Thumb({ imageUrl, monogram, accent = 'green', size }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        style={{ width: size, height: size, flexShrink: 0, borderRadius: 10, objectFit: 'cover', background: BG[accent] }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 10,
        background: BG[accent],
        color: INK[accent],
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size / 2,
      }}
    >
      {monogram}
    </div>
  );
}
