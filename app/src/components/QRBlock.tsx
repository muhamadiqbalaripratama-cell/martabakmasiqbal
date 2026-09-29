type Props = { size?: number };

export function QRBlock({ size = 280 }: Props) {
  const cells = 25;
  const cell = size / cells;
  const seeded = (i: number, j: number) => {
    const isFinder =
      (i < 7 && j < 7) || (i < 7 && j > cells - 8) || (i > cells - 8 && j < 7);
    if (isFinder) return null;
    const v = ((i * 31 + j * 17 + i * j) ^ (i + j * 7)) & 7;
    return v < 3;
  };
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x},${y})`}>
      <rect width={cell * 7} height={cell * 7} fill="#11241a" />
      <rect x={cell} y={cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} fill="#11241a" />
    </g>
  );
  const dots = [];
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if (seeded(i, j)) {
        dots.push(
          <rect
            key={`${i}-${j}`}
            x={i * cell + 1}
            y={j * cell + 1}
            width={cell - 2}
            height={cell - 2}
            fill="#11241a"
            rx={1}
          />,
        );
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#fff" />
      {dots}
      <Finder x={0} y={0} />
      <Finder x={(cells - 7) * cell} y={0} />
      <Finder x={0} y={(cells - 7) * cell} />
      {/* Center QRIS logo */}
      <g transform={`translate(${size / 2 - 28},${size / 2 - 16})`}>
        <rect x="-4" y="-4" width="64" height="40" rx="8" fill="#fff" stroke="#11241a" strokeWidth="2" />
        <text
          x="28"
          y="22"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="16"
          fontWeight="800"
          fill="#c2452f"
        >
          QRIS
        </text>
      </g>
    </svg>
  );
}
