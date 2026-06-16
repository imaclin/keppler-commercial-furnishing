import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderForAdmin } from '@/lib/orders';
import { formatPriceCents } from '@/lib/format';
import { OrderTracker } from '@/components/OrderTracker';
import { OrderStatusForm } from '@/components/admin/OrderStatusForm';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-800',
  in_production: 'bg-amber-50 text-amber-800',
  shipping: 'bg-blue-50 text-blue-800',
  delivered: 'bg-[var(--bone)] text-[var(--stone)]',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <main className="p-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/orders" className="text-xs text-[var(--walnut)] hover:underline">Orders</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-xs text-[var(--stone)]">{id.slice(0, 8)}...</span>
      </div>

      <div className="flex items-start justify-between mt-4">
        <div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Customer</div>
          <h1 className="serif mt-1 text-3xl text-[var(--ink)]">{order.customer_name}</h1>
        </div>
        <span className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[order.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
          {order.status.replaceAll('_', ' ')}
        </span>
      </div>

      <p className="mt-1 text-sm text-[var(--stone)]">
        Placed {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="mt-8 rounded border border-[var(--line)] bg-[var(--paper)] p-6">
        <OrderTracker status={order.status} />
        {order.est_delivery_date && (
          <p className="mt-6 text-center text-sm text-[var(--stone)]">
            Estimated delivery: <span className="font-medium text-[var(--ink)]">
              {new Date(order.est_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        )}
      </div>

      {order.items.length > 0 && (
        <div className="mt-8">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-3">Items</div>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="border border-[var(--line)] bg-[var(--paper)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-[var(--ink)] text-sm">{item.title_snapshot}</div>
                    <div className="mt-0.5 text-xs text-[var(--stone)]">
                      {[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' . ')}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--stone)]">Qty {item.quantity}</div>
                  </div>
                  <div className="text-sm font-medium text-[var(--ink)]">{formatPriceCents(item.unit_price_cents)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--line)] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Total</span>
              <span className="font-medium text-[var(--ink)]">{formatPriceCents(order.total_cents)}</span>
            </div>
          </div>
        </div>
      )}

      {order.history.length > 0 && (
        <div className="mt-8">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-3">Status History</div>
          <div className="space-y-2">
            {order.history.map((event) => (
              <div key={event.id} className="flex items-start gap-4 border-l-2 border-[var(--line)] pl-4 py-1">
                <div className="min-w-[140px] text-xs text-[var(--stone)]">
                  {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>
                  <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[event.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
                    {event.status.replaceAll('_', ' ')}
                  </span>
                  {event.note && <p className="mt-1 text-sm text-[var(--stone)]">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 border-t border-[var(--line)] pt-8">
        <OrderStatusForm
          orderId={id}
          currentStatus={order.status}
          estDelivery={order.est_delivery_date}
        />
      </div>
    </main>
  );
}
