import Link from 'next/link';
import { listCustomers } from '@/lib/customers';
import { formatPriceCents, timeAgo } from '@/lib/format';
import { RowLink } from '@/components/admin/RowLink';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="serif text-3xl text-[var(--ink)]">Customers</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search name or email..."
            className="w-full sm:w-64 border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none placeholder:text-[var(--stone)]"
          />
          <button
            type="submit"
            className="bg-[var(--espresso)] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#fffdfa]"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin/customers"
              className="text-xs text-[var(--stone)] underline"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border border-[var(--line)] bg-[var(--paper)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-[var(--line)]">
            <tr className="text-left">
              <th className="p-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Name</th>
              <th className="p-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Email</th>
              <th className="p-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Orders</th>
              <th className="p-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Lifetime Value</th>
              <th className="p-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-[var(--stone)]">
                  {q ? `No customers matching "${q}"` : 'No customers yet.'}
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <RowLink
                key={c.id}
                href={`/admin/customers/${c.id}`}
                className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--cream)]"
              >
                <td className="p-4 font-medium text-[var(--ink)]">{c.name}</td>
                <td className="p-4 text-[var(--stone)]">{c.email}</td>
                <td className="p-4 text-[var(--stone)]">{c.orders}</td>
                <td className="p-4 text-[var(--ink)]">{formatPriceCents(c.ltv_cents)}</td>
                <td className="p-4 text-[var(--stone)]">
                  {c.last_at ? timeAgo(c.last_at) : 'No orders'}
                </td>
              </RowLink>
            ))}
          </tbody>
        </table>
      </div>

      {customers.length === 200 && (
        <p className="mt-3 text-xs text-[var(--stone)]">Showing first 200 customers. Use search to narrow results.</p>
      )}
    </main>
  );
}
