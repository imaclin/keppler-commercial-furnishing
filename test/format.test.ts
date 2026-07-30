import { describe, it, expect } from 'vitest';
import { slugify, formatPriceCents } from '@/lib/format';

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  The Homestead Armchair ')).toBe('the-homestead-armchair');
  });
  it('strips punctuation and collapses spaces', () => {
    expect(slugify('Lancaster Chair (Walnut)!')).toBe('lancaster-chair-walnut');
  });
  it('strips leading and trailing hyphens', () => {
    expect(slugify('!!! Lancaster !!!')).toBe('lancaster');
  });
});

describe('formatPriceCents', () => {
  it('formats whole dollars without cents', () => {
    expect(formatPriceCents(320000)).toBe('$3,200');
  });
  it('formats partial dollars with cents', () => {
    expect(formatPriceCents(89950)).toBe('$899.50');
  });
});
