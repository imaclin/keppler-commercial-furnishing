'use client';

import { useState } from 'react';
import { Clock, Truck, ShieldCheck } from 'lucide-react';
import { computeConfiguredPriceCents } from '@/lib/pricing';
import { formatPriceCents } from '@/lib/format';
import { AddToCartButton } from '@/components/storefront/AddToCartButton';
import { FavoriteButton } from '@/components/storefront/FavoriteButton';
import { SampleRequestForm } from '@/components/storefront/SampleRequestForm';
import type { StorefrontProduct } from '@/lib/types';

export function ProductConfigurator({ product, initialFavorited, isLoggedIn = false }: { product: StorefrontProduct; initialFavorited: boolean; isLoggedIn?: boolean }) {
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

        <div className="mt-8 space-y-3">
          <AddToCartButton
            key={`${woodId}-${finishId}-${sizeId}`}
            item={{
              key: `${product.id}|${woodId}|${finishId}|${sizeId}`,
              productId: product.id,
              slug: product.slug,
              title: product.name,
              image: product.images[0]?.url ?? null,
              woodName: wood?.name ?? null,
              finishName: finish?.name ?? null,
              sizeLabel: size?.label ?? null,
              unitPriceCents: price,
            }}
          />
          <FavoriteButton productId={product.id} initialFavorited={initialFavorited} />
        </div>
        <SampleRequestForm productId={product.id} woodId={woodId || null} finishId={finishId || null} />

        {product.short_description && (
          <p className="mt-8 border-t border-[var(--line)] pt-6 text-sm leading-relaxed text-[var(--ink)]">{product.short_description}</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-3">
          {[
            { icon: Clock, label: 'Made to order' },
            { icon: Truck, label: 'White-glove delivery' },
            { icon: ShieldCheck, label: 'Lifetime warranty' },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-[12px] text-[var(--stone)]">
              <b.icon className="h-4 w-4 shrink-0 text-[var(--walnut)]" strokeWidth={1.6} /> {b.label}
            </div>
          ))}
        </div>
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
