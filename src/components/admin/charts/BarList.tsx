export function BarList({ items }: { items: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between text-sm"><span className="text-[var(--ink)]">{it.label}</span><span className="text-[var(--stone)]">{it.display}</span></div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--bone)]"><div className="h-1.5 rounded-full bg-[var(--walnut)]" style={{ width: `${(it.value / max) * 100}%` }} /></div>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-[var(--stone)]">No data yet.</li>}
    </ul>
  );
}
