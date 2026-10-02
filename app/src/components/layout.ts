import type { CSSProperties } from 'react';

// Lebar kolom untuk <div className="split">. Di HP (lihat tokens.css)
// kolom otomatis ditumpuk jadi satu.
export const splitCols = (cols: string): CSSProperties => ({ '--cols': cols }) as CSSProperties;
