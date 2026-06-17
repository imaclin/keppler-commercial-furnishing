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
    <main className="p-10">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/quotes" className="text-xs text-[var(--walnut)] hover:underline">Quotes</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-xs text-[var(--stone)]">{id.slice(0, 8)}...</span>
      </div>

      <div className="flex items-start justify-between mt-4">
        <div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Customer</div>
          <h1 className="serif mt-1 text-3xl text-[var(--ink)]">{quote.customer_name}</h1>
        </div>
        <span className={`rounded px-3 py-1 text-[11px] uppercase tracking-[0.12em] capitalize ${STATUS_COLORS[quote.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
          {quote.status.replaceAll('_', ' ')}
        </span>
      </div>

      <p className="mt-1 text-sm text-[var(--stone)]">
        Requested {new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-3">Items</div>
          <div className="space-y-2">
            {quote.items.map((item) => (
              <div key={item.id} className="border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm">
                <span className="font-medium text-[var(--ink)]">{item.title_snapshot}</span>
                {(item.wood_name || item.finish_name || item.size_label) && (
                  <span className="ml-2 text-[var(--stone)]">
                    {[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' . ')}
                  </span>
                )}
                <span className="ml-2 text-[var(--stone)]">Qty {item.quantity}</span>
                {item.unit_price_cents > 0 && (
                  <span className="ml-2 text-[var(--ink)]">{formatPriceCents(item.unit_price_cents)}</span>
                )}
              </div>
            ))}
            {quote.items.length === 0 && <p className="text-sm text-[var(--stone)]">No items on this quote.</p>}
          </div>
        </div>

        <div className="border-t border-[var(--line)] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-6">Price and Send</div>
          <QuotePricingForm
            quoteId={id}
            status={quote.status}
            items={quote.items}
            initialValidUntil={quote.valid_until}
            initialNotes={quote.notes}
          />
        </div>
      </div>
    </main>
  );
}
