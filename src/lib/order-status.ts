import type { OrderStatus } from '@/lib/types';

// The forward production path shown on the customer tracker. 'cancelled' is a
// terminal off-path state and is not a step.
export const ORDER_STEPS = ['confirmed', 'in_production', 'shipping', 'delivered'] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

export function stepIndex(step: OrderStep): number {
  return ORDER_STEPS.indexOf(step);
}

// Is `step` reached when the order is at `current`? (current step counts as reached)
export function isStepComplete(step: OrderStep, current: OrderStatus): boolean {
  if (current === 'cancelled') return false;
  const ci = ORDER_STEPS.indexOf(current as OrderStep);
  if (ci < 0) return false;
  return stepIndex(step) <= ci;
}
