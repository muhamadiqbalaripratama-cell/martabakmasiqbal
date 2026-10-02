import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

type Kind = 'primary' | 'yellow' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  kind?: Kind;
  size?: Size;
  icon?: string;
  children?: ReactNode;
};

const PADS: Record<Size, string> = { sm: '0 12px', md: '0 16px', lg: '0 20px' };
const HEIGHTS: Record<Size, number> = { sm: 32, md: 42, lg: 52 };
const FONTS: Record<Size, number> = { sm: 13, md: 14, lg: 15 };

const KIND_STYLES: Record<Kind, CSSProperties> = {
  primary: { background: 'var(--green)', color: '#fff', border: '1px solid var(--green)' },
  yellow: { background: 'var(--yellow)', color: 'var(--green)', border: '1px solid var(--yellow)' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--hairline-2)' },
  soft: { background: 'var(--green-tint)', color: 'var(--green)', border: '1px solid transparent' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid transparent' },
};

export function Btn({ kind = 'primary', size = 'md', icon, children, style, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      style={{
        height: HEIGHTS[size],
        padding: PADS[size],
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        // Isi tombol selalu di tengah (juga saat tombol dibuat lebar penuh).
        justifyContent: 'center',
        textAlign: 'center',
        // Label tombol satu baris; kalau sempit tombolnya yang turun baris.
        whiteSpace: 'nowrap',
        gap: 8,
        fontWeight: 600,
        fontSize: FONTS[size],
        cursor: 'pointer',
        letterSpacing: '-0.005em',
        ...KIND_STYLES[kind],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}
