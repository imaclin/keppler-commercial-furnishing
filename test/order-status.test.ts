import { describe, it, expect } from 'vitest';
import { ORDER_STEPS, stepIndex, isStepComplete } from '@/lib/order-status';

describe('order status steps', () => {
  it('has the production steps in order', () => {
    expect(ORDER_STEPS).toEqual(['confirmed', 'in_production', 'shipping', 'delivered']);
  });
  it('stepIndex returns position', () => {
    expect(stepIndex('in_production')).toBe(1);
    expect(stepIndex('delivered')).toBe(3);
  });
  it('isStepComplete is true for steps at or before the current status', () => {
    expect(isStepComplete('confirmed', 'shipping')).toBe(true);   // confirmed is done when at shipping
    expect(isStepComplete('delivered', 'shipping')).toBe(false);  // delivered not yet reached at shipping
    expect(isStepComplete('shipping', 'shipping')).toBe(true);    // current step counts as reached
  });
});
