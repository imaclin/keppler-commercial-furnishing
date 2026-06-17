export function Sparkline({ data, width = 96, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data); const min = Math.min(...data);
  const span = max - min || 1; const stepX = width / (data.length - 1);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`).join(' ');
  return <svg width={width} height={height} className="overflow-visible"><path d={line} fill="none" stroke="var(--walnut)" strokeWidth="1.5" /></svg>;
}
