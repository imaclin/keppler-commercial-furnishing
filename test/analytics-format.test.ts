import { describe, it, expect } from 'vitest';
import { lastNMonths, pctDelta } from '@/lib/analytics-format';

describe('lastNMonths', () => {
  it('returns N month keys ending at the given date, oldest first', () => {
    const months = lastNMonths(3, new Date('2026-03-15T00:00:00Z'));
    expect(months).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});

describe('pctDelta', () => {
  it('computes percent change', () => {
    expect(pctDelta(120, 100)).toBe(20);
    expect(pctDelta(80, 100)).toBe(-20);
  });
  it('is null when the prior value is zero', () => {
    expect(pctDelta(50, 0)).toBeNull();
  });
});
