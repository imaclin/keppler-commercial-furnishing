import { describe, it, expect } from 'vitest';
import { computeConfiguredPriceCents } from '@/lib/pricing';

describe('computeConfiguredPriceCents', () => {
  it('sums base plus selected option deltas', () => {
    expect(computeConfiguredPriceCents({ base: 320000, woodDelta: 0, finishDelta: 0, sizeDelta: 40000 })).toBe(360000);
  });
  it('handles all deltas and a walnut upcharge', () => {
    expect(computeConfiguredPriceCents({ base: 320000, woodDelta: 50000, finishDelta: 10000, sizeDelta: 80000 })).toBe(460000);
  });
  it('never returns below zero', () => {
    expect(computeConfiguredPriceCents({ base: 0, woodDelta: -100, finishDelta: 0, sizeDelta: 0 })).toBe(0);
  });
});
