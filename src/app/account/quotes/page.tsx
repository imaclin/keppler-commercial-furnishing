import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { listQuotesForCustomer } from '@/lib/quotes';
import { formatPriceCents } from '@/lib/format';

export default async function QuotesPage() {
  const profile = await getProfile();
  const quotes = profile ? await listQuotesForCustomer(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-4xl text-[var(--ink)]">Quotes</h1>
      <p className="mt-2 text-sm text-[var(--stone)]">Quotes you have requested for custom pieces.</p>
      {quotes.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--stone)]">No quotes yet. Configure a piece and request a quote from the product page.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {quotes.map((q) => (
            <Link key={q.id} href={`/account/quotes/${q.id}`} className="flex items-center justify-between border border-[var(--line)] bg-[var(--paper)] p-4 hover:border-[var(--walnut)]">
              <div className="flex items-center gap-4">
                <span className="rounded bg-[var(--bone)] px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] capitalize">{q.status.replaceAll('_', ' ')}</span>
                <span className="text-sm text-[var(--stone)]">{new Date(q.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--ink)]">{formatPriceCents(q.total_cents)}</span>
                <span className="text-xs text-[var(--walnut)]">View</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
