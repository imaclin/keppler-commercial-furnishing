const COLORS: Record<string, string> = {
  confirmed: '#5b7355', in_production: '#9a6b3a', shipping: '#4a6076', delivered: '#6b4f3a', cancelled: '#9a8e7c',
  requested: '#8c8175', sent: '#4a6076', accepted: '#5b7355', declined: '#9a8e7c', expired: '#9a8e7c',
};
export function StatusBar({ segments }: { segments: { status: string; count: number }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.count, 0));
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {segments.map((s) => <div key={s.status} title={`${s.status}: ${s.count}`} style={{ width: `${(s.count / total) * 100}%`, background: COLORS[s.status] ?? '#ccc' }} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--stone)]">
        {segments.map((s) => <span key={s.status} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[s.status] ?? '#ccc' }} />{s.status.replaceAll('_', ' ')} {s.count}</span>)}
      </div>
    </div>
  );
}
