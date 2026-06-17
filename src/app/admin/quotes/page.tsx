import { listQuotesForAdmin } from '@/lib/quotes';
import { formatPriceCents } from '@/lib/format';
import { RowLink } from '@/components/admin/RowLink';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800',
  sent: 'bg-blue-50 text-blue-800',
  accepted: 'bg-green-50 text-green-800',
  declined: 'bg-red-50 text-red-700',
  expired: 'bg-[var(--bone)] text-[var(--stone)]',
};

export default async function AdminQuotesPage() {
  const quotes = await listQuotesForAdmin();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Quotes</h1>
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
            <th className="py-3">Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Requested</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <RowLink key={q.id} href={`/admin/quotes/${q.id}`} className="border-b border-[var(--line)] hover:bg-[var(--bone)]/50">
              <td className="py-3 font-medium text-[var(--ink)]">{q.customer_name}</td>
              <td className="text-[var(--stone)]">{q.item_count}</td>
              <td>{q.total_cents > 0 ? formatPriceCents(q.total_cents) : <span className="text-[var(--stone)]">Unpriced</span>}</td>
              <td>
                <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[q.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
                  {q.status.replaceAll('_', ' ')}
                </span>
              </td>
              <td className="text-[var(--stone)]">
                {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="text-right text-xs text-[var(--walnut)]">View →</td>
            </RowLink>
          ))}
          {quotes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-[var(--stone)]">No quotes yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
