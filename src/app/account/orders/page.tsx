import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { listOrdersForCustomer } from '@/lib/orders';
import { formatPriceCents } from '@/lib/format';

export default async function OrdersPage() {
  const profile = await getProfile();
  const orders = profile ? await listOrdersForCustomer(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-4xl text-[var(--ink)]">Orders</h1>
      <p className="mt-2 text-sm text-[var(--stone)]">Your confirmed orders and their production status.</p>
      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--stone)]">No orders yet. Accept a quote to place your first order.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between border border-[var(--line)] bg-[var(--paper)] p-4 hover:border-[var(--walnut)]">
              <div className="flex items-center gap-4">
                <span className="rounded bg-[var(--bone)] px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] capitalize">{o.status.replaceAll('_', ' ')}</span>
                <span className="text-sm text-[var(--stone)]">{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--ink)]">{formatPriceCents(o.total_cents)}</span>
                <span className="text-xs text-[var(--walnut)]">View</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
