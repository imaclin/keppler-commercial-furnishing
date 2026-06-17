import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderForAdmin } from '@/lib/orders';
import { formatPriceCents, timeAgo } from '@/lib/format';
import { OrderTracker } from '@/components/OrderTracker';
import { OrderStatusForm } from '@/components/admin/OrderStatusForm';

const STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-[#e8efe4] text-[#5b7355]',
  in_production: 'bg-[#f3e8da] text-[#9a6b3a]',
  shipping: 'bg-[#e4ebf0] text-[#4a6076]',
  delivered: 'bg-[var(--bone)] text-[var(--stone)]',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  const todayLocal = new Date().toLocaleDateString('sv'); // 'YYYY-MM-DD' local
  const isOverdue =
    order.status !== 'delivered' && order.status !== 'cancelled' &&
    !!order.est_delivery_date && order.est_delivery_date < todayLocal;

  return (
    <main className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--stone)]">
        <Link href="/admin/orders" className="text-[var(--walnut)] hover:underline">Orders</Link>
        <span>/</span>
        <span className="font-mono">#{id.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--stone)]">Order</div>
          <h1 className="serif mt-1 text-3xl text-[var(--ink)]">{order.customer_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--stone)]">
            <span>{order.customer_email}</span>
            <span>Placed {timeAgo(order.created_at)}</span>
            <span className="text-[var(--stone)]">
              {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <span className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.12em] ${STATUS_PILL[order.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
          {order.status.replaceAll('_', ' ')}
        </span>
      </div>

      {/* Single-column, full width */}
      <div className="mt-8 space-y-10">

        {/* Fulfillment */}
        <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Fulfillment</div>
          <OrderTracker status={order.status} />
          {order.est_delivery_date && (
            <div className="mt-5 flex items-center gap-3 text-sm">
              <span className="text-[var(--stone)]">Estimated delivery</span>
              <span className="font-medium text-[var(--ink)]">
                {new Date(order.est_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {isOverdue && (
                <span className="inline-block rounded bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-red-600 font-medium">
                  Overdue
                </span>
              )}
            </div>
          )}
        </section>

        {/* Update status */}
        <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Update Status</div>
          <OrderStatusForm
            orderId={id}
            currentStatus={order.status}
            estDelivery={order.est_delivery_date}
          />
        </section>

        {/* Items + total */}
        <section>
          <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Items</div>
          {order.items.length > 0 ? (
            <>
              <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-[var(--paper)]">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-[var(--bone)]">
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.title_snapshot} className="h-full w-full max-w-none object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--ink)] text-sm leading-snug">{item.title_snapshot}</div>
                      <div className="mt-0.5 text-xs text-[var(--stone)]">
                        {[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' . ')}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--stone)]">Qty {item.quantity}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium text-[var(--ink)]">{formatPriceCents(item.unit_price_cents * item.quantity)}</div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-[var(--stone)]">{formatPriceCents(item.unit_price_cents)} each</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-[var(--espresso)] pt-3 text-sm">
                <span className="text-[var(--stone)]">Order total</span>
                <span className="text-lg font-medium text-[var(--ink)]">{formatPriceCents(order.total_cents)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--stone)]">No items recorded.</p>
          )}
        </section>

        {/* Status history timeline */}
        {order.history.length > 0 && (
          <section>
            <div className="text-[9px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Status History</div>
            <div className="space-y-3">
              {order.history.map((event) => (
                <div key={event.id} className="flex items-start gap-4 border-l-2 border-[var(--line)] pl-4 py-1">
                  <div className="min-w-[140px] text-xs text-[var(--stone)] shrink-0">
                    {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div>
                    <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${STATUS_PILL[event.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
                      {event.status.replaceAll('_', ' ')}
                    </span>
                    {event.note && <p className="mt-1 text-sm text-[var(--stone)]">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
