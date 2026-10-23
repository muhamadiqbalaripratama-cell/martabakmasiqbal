import { useState } from 'react';
import type { Asset } from '../api';
import { pct } from '../format';

export function CoinIcon({ asset, size = 34 }: { asset: Pick<Asset, 'symbol' | 'source' | 'image_url'>; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (asset.source === 'gold') return <div className="coin-icon gold" style={style}>Au</div>;
  if (asset.image_url && !broken) {
    return <img className="coin-icon" style={style} src={asset.image_url} alt="" onError={() => setBroken(true)} />;
  }
  return <div className="coin-icon" style={style}>{asset.symbol.slice(0, 4)}</div>;
}

export function Change({ value }: { value: number | null }) {
  const cls = value === null || Math.abs(value) < 0.005 ? 'flat' : value > 0 ? 'up' : 'down';
  return <span className={`chg ${cls} num`}>{value === null ? '—' : `${value > 0 ? '▲' : value < 0 ? '▼' : ''} ${pct(value)}`}</span>;
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className={`switch ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)} />;
}
