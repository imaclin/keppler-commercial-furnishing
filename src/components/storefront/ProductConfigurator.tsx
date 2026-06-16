'use client';

import { useState } from 'react';
import { computeConfiguredPriceCents } from '@/lib/pricing';
import { formatPriceCents } from '@/lib/format';
import { QuoteRequestForm } from '@/components/storefront/QuoteRequestForm';
import type { StorefrontProduct } from '@/lib/types';

export function ProductConfigurator({ product }: { product: StorefrontProduct }) {
  const [activeImg, setActiveImg] = useState(product.images[0]?.url ?? null);
  const [woodId, setWoodId] = useState(product.woods[0]?.id ?? '');
  const [finishId, setFinishId] = useState(product.finishes[0]?.id ?? '');
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? '');

  const wood = product.woods.find((w) => w.id === woodId);
  const finish = product.finishes.find((f) => f.id === finishId);
  const size = product.sizes.find((s) => s.id === sizeId);
  const price = computeConfiguredPriceCents({
    base: product.base_price_cents,
    woodDelta: wood?.price_delta_cents ?? 0,
    finishDelta: finish?.price_delta_cents ?? 0,
    sizeDelta: size?.price_delta_cents ?? 0,
  });
  const configuration = {
    product: product.name, wood: wood?.name ?? null, finish: finish?.name ?? null,
    size: size?.label ?? null, price: formatPriceCents(price),
  };

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden bg-[var(--bone)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {activeImg && <img src={activeImg} alt={product.name} className="h-full w-full object-cover" />}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {product.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <button key={img.id} onClick={() => setActiveImg(img.url)} className={`h-16 w-16 overflow-hidden border ${activeImg === img.url ? 'border-[var(--walnut)]' : 'border-[var(--line)]'}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.collection_name && <div className="eyebrow">{product.collection_name}</div>}
        <h1 className="serif mt-2 text-4xl text-[var(--ink)]">{product.name}</h1>
        <p className="mt-3 text-xl text-[var(--ink)]">From {formatPriceCents(price)}</p>
        {(product.region || product.lead_time_weeks) && (
          <p className="mt-2 text-xs text-[var(--stone)]">
            {product.region ? `Handcrafted in ${product.region}` : ''}{product.region && product.lead_time_weeks ? ' . ' : ''}
            {product.lead_time_weeks ? `made to order in ${product.lead_time_weeks} weeks` : ''}
          </p>
        )}

        {product.woods.length > 0 && (
          <Field label={`Wood Species${wood ? ' . ' + wood.name : ''}`}>
            <div className="flex gap-3">
              {product.woods.map((w) => (
                <button key={w.id} onClick={() => setWoodId(w.id)} title={w.name}
                  className={`h-10 w-10 rounded-full border ${woodId === w.id ? 'ring-2 ring-[var(--walnut)] ring-offset-2' : 'border-black/10'}`} style={{ background: w.swatch_color }} />
              ))}
            </div>
          </Field>
        )}
        {product.finishes.length > 0 && (
          <Field label={`Finish${finish ? ' . ' + finish.name : ''}`}>
            <div className="flex flex-wrap gap-2">
              {product.finishes.map((f) => (
                <button key={f.id} onClick={() => setFinishId(f.id)} className={`border px-4 py-2 text-sm ${finishId === f.id ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>{f.name}</button>
              ))}
            </div>
          </Field>
        )}
        {product.sizes.length > 0 && (
          <Field label="Size">
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s.id} onClick={() => setSizeId(s.id)} className={`border px-4 py-2 text-center text-sm ${sizeId === s.id ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
                  {s.label}{s.seats ? <span className="block text-xs text-[var(--stone)]">Seats {s.seats}</span> : null}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="mt-8"><QuoteRequestForm productId={product.id} configuration={configuration} /></div>
        <p className="mt-4 text-sm text-[var(--walnut)]">Order a wood and finish sample . $5, credited to your order</p>
        {product.story && <p className="mt-8 border-t border-[var(--line)] pt-6 text-sm leading-relaxed text-[var(--ink)]">{product.story}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">{label}</div>
      {children}
    </div>
  );
}
