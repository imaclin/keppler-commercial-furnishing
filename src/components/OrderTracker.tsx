import { ORDER_STEPS, isStepComplete } from '@/lib/order-status';
import type { OrderStatus } from '@/lib/types';

const LABELS: Record<string, string> = { confirmed: 'Confirmed', in_production: 'In Production', shipping: 'Shipping', delivered: 'Delivered' };

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return <p className="text-sm text-red-600">This order was cancelled.</p>;
  return (
    <div className="flex">
      {ORDER_STEPS.map((step, i) => {
        const done = isStepComplete(step, status);
        const current = step === status;
        return (
          <div key={step} className="relative flex-1 text-center">
            {i > 0 && <span className={`absolute left-[-50%] top-[6px] -z-0 h-0.5 w-full ${done ? 'bg-[var(--walnut)]' : 'bg-[var(--line)]'}`} />}
            <span className={`relative z-10 mx-auto mb-2 block h-3.5 w-3.5 rounded-full ${done ? 'bg-[var(--walnut)]' : 'bg-[var(--line)]'} ${current ? 'ring-4 ring-[var(--bone)]' : ''}`} />
            <span className={`text-[11px] ${current ? 'font-medium text-[var(--walnut)]' : 'text-[var(--ink)]'}`}>{LABELS[step]}</span>
          </div>
        );
      })}
    </div>
  );
}
