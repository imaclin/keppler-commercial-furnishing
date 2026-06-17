export function AreaChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const w = 720;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((d, i) => [i * stepX, height - (d.value / max) * (height - 24) - 4] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Revenue trend">
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--walnut)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--walnut)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#rev)" />
      <path d={line} fill="none" stroke="var(--walnut)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
