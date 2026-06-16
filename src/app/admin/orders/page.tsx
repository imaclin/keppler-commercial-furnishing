import Link from 'next/link';
import { listOrdersForAdmin } from '@/lib/orders';
import { formatPriceCents } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-800',
  in_production: 'bg-amber-50 text-amber-800',
  shipping: 'bg-blue-50 text-blue-800',
  delivered: 'bg-[var(--bone)] text-[var(--stone)]',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function AdminOrdersPage() {
  const orders = await listOrdersForAdmin();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Orders</h1>
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
            <th className="py-3">Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Placed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-[var(--line)]">
              <td className="py-3 font-mono text-xs text-[var(--stone)]">{o.id.slice(0, 8)}</td>
              <td className="font-medium text-[var(--ink)]">{o.customer_name}</td>
              <td>{formatPriceCents(o.total_cents)}</td>
              <td>
                <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[o.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
                  {o.status.replaceAll('_', ' ')}
                </span>
              </td>
              <td className="text-[var(--stone)]">
                {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="text-xs text-[var(--walnut)] hover:underline">
                  Manage
                </Link>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-[var(--stone)]">No orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
