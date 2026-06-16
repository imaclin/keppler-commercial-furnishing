'use client';

import { useState } from 'react';
import { sendQuoteAction } from '@/app/actions/quotes';
import type { QuoteItem, QuoteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  quoteId: string;
  status: QuoteStatus;
  items: QuoteItem[];
  initialValidUntil?: string | null;
  initialNotes?: string | null;
}

export function QuotePricingForm({ quoteId, status, items, initialValidUntil, initialNotes }: Props) {
  const editable = status === 'requested' || status === 'sent';

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const item of items) {
      init[item.id] = item.unit_price_cents > 0 ? (item.unit_price_cents / 100).toFixed(2) : '';
    }
    return init;
  });
  const [validUntil, setValidUntil] = useState(initialValidUntil ?? '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceMap: Record<string, number> = {};
    for (const item of items) {
      const raw = parseFloat(prices[item.id] ?? '');
      if (isNaN(raw) || raw < 0) {
        setError(`Enter a valid price for "${item.title_snapshot}".`);
        return;
      }
      priceMap[item.id] = Math.round(raw * 100);
    }
    setBusy(true);
    const result = await sendQuoteAction(quoteId, priceMap, validUntil || null, notes.trim() || null);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded border border-[var(--line)] bg-[var(--paper)] p-6">
        <div className="text-sm font-medium text-[var(--walnut)]">Quote sent to customer.</div>
        <p className="mt-1 text-sm text-[var(--stone)]">The customer has been notified and can now accept or decline.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!editable && (
        <p className="text-sm text-[var(--stone)]">
          This quote has status {status.replaceAll('_', ' ')} and cannot be edited.
        </p>
      )}

      <div>
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-3">Item Pricing</div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-[var(--line)] bg-[var(--paper)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--ink)] text-sm">{item.title_snapshot}</div>
                  <div className="mt-0.5 text-xs text-[var(--stone)]">
                    {[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' . ')}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--stone)]">Qty: {item.quantity}</div>
                </div>
                <div className="w-36">
                  <Label htmlFor={`price-${item.id}`} className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Price (USD)</Label>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-sm text-[var(--stone)]">$</span>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={prices[item.id] ?? ''}
                      onChange={(e) => setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      disabled={!editable || busy}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label htmlFor="valid-until" className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Valid Until</Label>
          <Input
            id="valid-until"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            disabled={!editable || busy}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Notes for Customer</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!editable || busy}
          rows={4}
          placeholder="Optional message included with the quote..."
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!editable || busy} className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]">
        {busy ? 'Sending...' : 'Price and Send Quote'}
      </Button>
    </form>
  );
}
