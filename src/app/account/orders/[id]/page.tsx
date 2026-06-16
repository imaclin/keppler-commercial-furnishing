import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { getOrderForCustomer } from '@/lib/orders';
import { formatPriceCents } from '@/lib/format';
import { OrderTracker } from '@/components/OrderTracker';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  const order = profile ? await getOrderForCustomer(id, profile.id) : null;
  if (!order) notFound();

  return (
    <main className="p-10">
      <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Order</div>
      <h1 className="serif mt-1 text-4xl text-[var(--ink)]">
        <span className="rounded bg-[var(--bone)] px-2 py-1 text-base capitalize">{order.status.replaceAll('_', ' ')}</span>
      </h1>
      <p className="mt-1 text-sm text-[var(--stone)]">Placed {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="mt-8 rounded border border-[var(--line)] bg-[var(--paper)] p-6">
        <OrderTracker status={order.status} />
        {order.est_delivery_date && (
          <p className="mt-6 text-center text-sm text-[var(--stone)]">
            Estimated delivery: <span className="font-medium text-[var(--ink)]">{new Date(order.est_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        )}
      </div>

      {order.items.length > 0 && (
        <div className="mt-8">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Items</div>
          <div className="mt-3 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="border border-[var(--line)] bg-[var(--paper)] p-4">
                <div className="font-medium text-[var(--ink)]">{item.title_snapshot}</div>
                <div className="mt-1 text-sm text-[var(--stone)]">
                  {[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' . ')}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-[var(--stone)]">Qty {item.quantity}</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{formatPriceCents(item.unit_price_cents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.history.length > 0 && (
        <div className="mt-8">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Status history</div>
          <div className="mt-3 space-y-2">
            {order.history.map((event) => (
              <div key={event.id} className="flex items-start gap-4 border-l-2 border-[var(--line)] pl-4 py-1">
                <div className="min-w-[140px] text-xs text-[var(--stone)]">
                  {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>
                  <span className="rounded bg-[var(--bone)] px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] capitalize">{event.status.replaceAll('_', ' ')}</span>
                  {event.note && <p className="mt-1 text-sm text-[var(--stone)]">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
