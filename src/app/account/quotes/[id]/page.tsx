import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { getQuoteForCustomer } from '@/lib/quotes';
import { formatPriceCents } from '@/lib/format';
import { QuoteAcceptButton } from '@/components/account/QuoteAcceptButton';

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  const quote = profile ? await getQuoteForCustomer(id, profile.id) : null;
  if (!quote) notFound();

  return (
    <main className="p-10">
      <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Quote</div>
      <h1 className="serif mt-1 text-4xl text-[var(--ink)]">
        <span className="rounded bg-[var(--bone)] px-2 py-1 text-base capitalize">{quote.status.replace('_', ' ')}</span>
      </h1>
      <p className="mt-1 text-sm text-[var(--stone)]">Requested {new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {quote.items.length > 0 && (
        <div className="mt-8">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Items</div>
          <div className="mt-3 space-y-3">
            {quote.items.map((item) => (
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

      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--stone)]">Subtotal</span>
          <span className="text-[var(--ink)]">{formatPriceCents(quote.subtotal_cents)}</span>
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span className="text-[var(--ink)]">Total</span>
          <span className="text-[var(--ink)]">{formatPriceCents(quote.total_cents)}</span>
        </div>
      </div>

      {quote.valid_until && (
        <p className="mt-4 text-sm text-[var(--stone)]">
          Valid until {new Date(quote.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      {quote.notes && (
        <div className="mt-6 border-l-2 border-[var(--walnut)] pl-4">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Notes from our team</div>
          <p className="mt-2 text-sm text-[var(--ink)]">{quote.notes}</p>
        </div>
      )}

      {quote.status === 'sent' && (
        <div className="mt-8">
          <QuoteAcceptButton quoteId={id} />
        </div>
      )}
    </main>
  );
}
