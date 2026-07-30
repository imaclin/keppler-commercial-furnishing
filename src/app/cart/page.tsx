'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart, setQty, removeFromCart, clearCart } from '@/lib/cart';
import { formatPriceCents } from '@/lib/format';
import { submitQuoteRequestAction } from '@/app/actions/quotes';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const router = useRouter();
  const { items, count, subtotalCents } = useCart();
  const [busy, setBusy] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || items.length === 0) return;
    setBusy(true); setError(null); setNeedsAuth(false);
    const res = await submitQuoteRequestAction(
      items.map((i) => ({
        productId: i.productId, title: i.title, woodName: i.woodName, finishName: i.finishName,
        sizeLabel: i.sizeLabel, unitPriceCents: i.unitPriceCents, quantity: i.quantity, configuration: null,
      })),
    );
    setBusy(false);
    if ('quoteId' in res) { clearCart(); router.push(`/account/quotes/${res.quoteId}`); }
    else if ('needsAuth' in res) setNeedsAuth(true);
    else setError(res.error);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1000px] px-6 py-14 md:px-10 md:py-20">
        <h1 className="serif text-[34px] text-[var(--ink)] md:text-[44px]">Your Cart</h1>

        {count === 0 ? (
          <div className="mt-10 border border-[var(--line)] bg-[var(--paper)] p-12 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-[var(--stone)]" strokeWidth={1.4} />
            <p className="mt-4 text-[var(--stone)]">Your cart is empty.</p>
            <Link href="/chairs" className="mt-6 inline-block bg-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">Explore the Collection</Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Items */}
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-5">
                  <Link href={`/product/${i.slug}`} className="shrink-0">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt="" className="h-24 w-24 max-w-none rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
                    ) : (
                      <div className="h-24 w-24 rounded border border-[var(--line)] bg-[var(--bone)]" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/product/${i.slug}`} className="serif text-lg text-[var(--ink)] hover:underline">{i.title}</Link>
                      <button onClick={() => removeFromCart(i.key)} aria-label="Remove" className="text-[var(--stone)] hover:text-[var(--ink)]"><X className="h-4 w-4" /></button>
                    </div>
                    {(i.woodName || i.finishName || i.sizeLabel) && (
                      <div className="mt-1 text-sm text-[var(--stone)]">{[i.woodName, i.finishName, i.sizeLabel].filter(Boolean).join(' · ')}</div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-[var(--line)]">
                        <button onClick={() => setQty(i.key, i.quantity - 1)} aria-label="Decrease" className="px-3 py-2 text-[var(--ink)] hover:bg-[var(--bone)]"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-9 text-center text-sm">{i.quantity}</span>
                        <button onClick={() => setQty(i.key, i.quantity + 1)} aria-label="Increase" className="px-3 py-2 text-[var(--ink)] hover:bg-[var(--bone)]"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="text-sm tabular-nums text-[var(--ink)]">{i.unitPriceCents > 0 ? formatPriceCents(i.unitPriceCents * i.quantity) : 'TBD'}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="h-fit border border-[var(--line)] bg-[var(--paper)] p-6">
              <h2 className="serif text-xl text-[var(--ink)]">Request a Quote</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-[var(--stone)]">Estimated subtotal</span>
                <span className="tabular-nums text-[var(--ink)]">{formatPriceCents(subtotalCents)}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--stone)]">
                Submit your cart and our team will confirm final pricing and send you an invoice. You won&rsquo;t be charged now.
              </p>

              {needsAuth && (
                <div className="mt-4 rounded border border-[var(--line)] bg-[var(--bone)] p-3 text-sm text-[var(--ink)]">
                  Please <Link href="/login" className="font-medium text-[var(--walnut)] underline">sign in</Link> to submit your request. Your cart will be saved.
                </div>
              )}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Button onClick={submit} disabled={busy} className="mt-5 w-full">{busy ? 'Submitting...' : 'Submit Quote Request'}</Button>
              <button onClick={() => clearCart()} className="mt-3 w-full text-center text-xs uppercase tracking-[0.12em] text-[var(--stone)] hover:text-[var(--ink)]">Clear cart</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
