'use client';

import { useState } from 'react';
import { sendQuoteAction } from '@/app/actions/quotes';
import type { QuoteItem, QuoteStatus } from '@/lib/types';
import { formatPriceCents } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  quoteId: string;
  status: QuoteStatus;
  customerName: string;
  items: QuoteItem[];
  initialValidUntil?: string | null;
  initialNotes?: string | null;
}

export function QuotePricingForm({ quoteId, status, customerName, items, initialValidUntil, initialNotes }: Props) {
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
  const [previewOpen, setPreviewOpen] = useState(false);

  /** Validate every price field; returns a cents map or null (setting an error). */
  function buildPriceMap(): Record<string, number> | null {
    const priceMap: Record<string, number> = {};
    for (const item of items) {
      const raw = parseFloat(prices[item.id] ?? '');
      if (isNaN(raw) || raw < 0) {
        setError(`Enter a valid price for "${item.title_snapshot}".`);
        return null;
      }
      priceMap[item.id] = Math.round(raw * 100);
    }
    return priceMap;
  }

  async function doSend() {
    setError(null);
    const priceMap = buildPriceMap();
    if (!priceMap) return;
    setBusy(true);
    const result = await sendQuoteAction(quoteId, priceMap, validUntil || null, notes.trim() || null);
    setBusy(false);
    if ('error' in result) setError(result.error);
    else { setPreviewOpen(false); setSent(true); }
  }

  function openPreview() {
    setError(null);
    if (buildPriceMap()) setPreviewOpen(true);
  }

  if (sent) {
    return (
      <div className="rounded border border-[var(--line)] bg-[var(--paper)] p-6">
        <div className="text-sm font-medium text-[var(--walnut)]">Quote sent to customer.</div>
        <p className="mt-1 text-sm text-[var(--stone)]">The customer has been notified and can now accept or decline.</p>
      </div>
    );
  }

  const previewMap = previewOpen ? buildPriceMapSilent(items, prices) : null;
  const previewTotal = previewMap ? items.reduce((sum, it) => sum + (previewMap[it.id] ?? 0) * it.quantity, 0) : 0;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); doSend(); }} className="space-y-6">
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

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={openPreview} disabled={!editable || busy}>
            Preview quote
          </Button>
          <Button type="submit" disabled={!editable || busy} className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]">
            {busy ? 'Sending...' : 'Price and Send Quote'}
          </Button>
        </div>
      </form>

      {previewOpen && previewMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl">
            <div className="shrink-0 border-b border-[var(--line)] px-6 py-4">
              <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Quote preview</div>
              <h2 className="serif text-2xl text-[var(--ink)]">For {customerName}</h2>
              <p className="text-xs text-[var(--stone)]">This is how the quote will appear to the customer.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="divide-y divide-[var(--line)]">
                {items.map((item) => {
                  const cents = previewMap[item.id] ?? 0;
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--ink)]">{item.title_snapshot}</div>
                        {(item.wood_name || item.finish_name || item.size_label) && (
                          <div className="text-sm text-[var(--stone)]">{[item.wood_name, item.finish_name, item.size_label].filter(Boolean).join(' · ')}</div>
                        )}
                        <div className="text-xs text-[var(--stone)]">Qty {item.quantity} · {formatPriceCents(cents)} each</div>
                      </div>
                      <div className="shrink-0 text-sm font-medium text-[var(--ink)] tabular-nums">{formatPriceCents(cents * item.quantity)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--espresso)] pt-3">
                <span className="text-sm uppercase tracking-[0.12em] text-[var(--stone)]">Total</span>
                <span className="serif text-xl text-[var(--ink)] tabular-nums">{formatPriceCents(previewTotal)}</span>
              </div>

              {validUntil && (
                <p className="mt-4 text-sm text-[var(--stone)]">Valid until {new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
              {notes.trim() && (
                <div className="mt-4">
                  <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-1">Note</div>
                  <p className="whitespace-pre-line text-sm text-[var(--ink)]">{notes.trim()}</p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--line)] px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} disabled={busy}>Keep editing</Button>
              <Button type="button" onClick={doSend} disabled={busy} className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]">
                {busy ? 'Sending...' : 'Send quote'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Like buildPriceMap but without side effects, for rendering the preview. */
function buildPriceMapSilent(items: QuoteItem[], prices: Record<string, string>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const raw = parseFloat(prices[item.id] ?? '');
    map[item.id] = isNaN(raw) || raw < 0 ? 0 : Math.round(raw * 100);
  }
  return map;
}
