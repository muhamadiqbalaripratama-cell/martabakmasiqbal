import { useMemo, useRef, useState } from 'react';
import { usd, wibDate, wibTime } from '../format';

type Point = [number, number]; // [waktu ms, harga]

function scale(points: Point[], w: number, h: number, pad: { t: number; b: number; l: number; r: number }) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y0 === y1) {
    y0 -= Math.abs(y0) * 0.01 || 1;
    y1 += Math.abs(y1) * 0.01 || 1;
  }
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (w - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0)) * (h - pad.t - pad.b);
  return { sx, sy, y0, y1 };
}

const linePath = (pts: Point[], sx: (x: number) => number, sy: (y: number) => number) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('');

const trendColor = (pts: Point[]) =>
  pts.length > 1 && pts[pts.length - 1][1] < pts[0][1] ? 'var(--down)' : 'var(--up)';

export function Sparkline({ points, height = 44 }: { points: Point[]; height?: number }) {
  const w = 240;
  if (points.length < 2) return <div style={{ height }} />;
  const { sx, sy } = scale(points, w, height, { t: 4, b: 4, l: 0, r: 0 });
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }} aria-hidden>
      <path d={linePath(points, sx, sy)} fill="none" stroke={trendColor(points)} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function PriceChart({ points, range }: { points: Point[]; range: string }) {
  const W = 760;
  const H = 300;
  const pad = { t: 16, b: 28, l: 8, r: 78 };
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const s = useMemo(() => (points.length > 1 ? scale(points, W, H, pad) : null), [points]);
  if (!s) return <div className="empty">Belum cukup data untuk grafik. Data terkumpul setiap menit.</div>;
  const { sx, sy, y0, y1 } = s;
  const color = trendColor(points);
  const d = linePath(points, sx, sy);
  const area = `${d}L${sx(points[points.length - 1][0])},${H - pad.b}L${sx(points[0][0])},${H - pad.b}Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => points[Math.round(((points.length - 1) * i) / 4)][0]);
  const fmtX = (t: number) => (range === '24h' ? wibTime(t) : wibDate(t));

  const onMove = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(sx(points[i][0]) - x) < Math.abs(sx(points[best][0]) - x)) best = i;
    setHover(best);
  };
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="chart-wrap">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: 'pan-y' }}>
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((y) => (
          <g key={y}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(y)} y2={sy(y)} stroke="var(--border)" strokeDasharray="3 4" />
            <text x={W - pad.r + 6} y={sy(y) + 4} fontSize="11" fill="var(--muted)" className="num">{usd(y)}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={sx(t)} y={H - 8} fontSize="11" fill="var(--muted)" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
            {fmtX(t)}
          </text>
        ))}
        <path d={area} fill="url(#area)" />
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {hp && (
          <g>
            <line x1={sx(hp[0])} x2={sx(hp[0])} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" strokeDasharray="2 3" />
            <circle cx={sx(hp[0])} cy={sy(hp[1])} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hp && (
        <div className="chart-tip num" style={{ left: `min(max(${(sx(hp[0]) / W) * 100}% - 70px, 0px), calc(100% - 150px))` }}>
          <b>{usd(hp[1])}</b>{' '}
          <span className="muted">
            {wibDate(hp[0])} {wibTime(hp[0])}
          </span>
        </div>
      )}
    </div>
  );
}
