// 'YYYY-MM' keys for the last n months ending at `end` (UTC), oldest first.
export function lastNMonths(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  const y = end.getUTCFullYear();
  const m = end.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

// Percent change from `prior` to `current`; null if prior is 0.
export function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}
