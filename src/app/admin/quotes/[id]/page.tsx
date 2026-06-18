import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getQuoteForAdmin } from '@/lib/quotes';
import { formatPriceCents } from '@/lib/format';
import { QuotePricingForm } from '@/components/admin/QuotePricingForm';

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800',
  sent: 'bg-blue-50 text-blue-800',
  accepted: 'bg-green-50 text-green-800',
  declined: 'bg-red-50 text-red-700',
  expired: 'bg-[var(--bone)] text-[var(--stone)]',
};

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteForAdmin(id);
  if (!quote) notFound();

  return (
    <main className="p-5 md:p-10">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/quotes" className="text-xs text-[var(--walnut)] hover:underline">Quotes</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-xs text-[var(--stone)]">{id.slice(0, 8)}...</span>
      </div>

      <div className="flex items-start justify-between mt-4">
        <div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Customer</div>
          <h1 className="serif mt-1 text-3xl text-[var(--ink)]">{quote.customer_name}</h1>
          <p className="text-sm text-[var(--stone)]">{quote.customer_email}</p>
        </div>
        <span className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[quote.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
          {quote.status.replaceAll('_', ' ')}
        </span>
      </div>

      <p className="mt-2 text-sm text-[var(--stone)]">
        Requested {new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        {quote.valid_until && <> · valid until {new Date(quote.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</>}
      </p>

      <section className="mt-8 max-w-3xl">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-6">Create Invoice</div>
        <QuotePricingForm
          quoteId={id}
          status={quote.status}
          customerName={quote.customer_name}
          items={quote.items}
          initialValidUntil={quote.valid_until}
          initialNotes={quote.notes}
          initialPaymentLink={quote.payment_link_url}
        />
      </section>

      <section className="mt-12 max-w-3xl">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-3">Items</div>
        <div className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
          {quote.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="h-14 w-14 max-w-none shrink-0 rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded border border-[var(--line)] bg-[var(--bone)]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--ink)]">{item.title_snapshot}</div>
                {(item.wood_name || item.finish_name || item.size_label) && (
                  <div className="text-sm text-[var(--stone)]">{[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' · ')}</div>
                )}
                <div className="text-xs text-[var(--stone)]">Qty {item.quantity}{item.unit_price_cents > 0 && <> · {formatPriceCents(item.unit_price_cents)} each</>}</div>
              </div>
              {item.unit_price_cents > 0 && (
                <div className="shrink-0 text-sm font-medium text-[var(--ink)] tabular-nums">{formatPriceCents(item.unit_price_cents * item.quantity)}</div>
              )}
            </div>
          ))}
          {quote.items.length === 0 && <p className="px-4 py-3 text-sm text-[var(--stone)]">No items on this quote.</p>}
        </div>

        {quote.total_cents > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--espresso)] pt-3 text-sm">
            <span className="uppercase tracking-[0.12em] text-[var(--stone)]">Total</span>
            <span className="text-lg font-medium text-[var(--ink)] tabular-nums">{formatPriceCents(quote.total_cents)}</span>
          </div>
        )}
      </section>
    </main>
  );
}
