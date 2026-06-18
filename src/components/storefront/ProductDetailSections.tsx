import Link from 'next/link';
import { Ruler, Trees, Clock, MapPin, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/types';

function dims(p: StorefrontProduct): string | null {
  const parts: string[] = [];
  if (p.length_in != null) parts.push(`${p.length_in}" L`);
  if (p.width_in != null) parts.push(`${p.width_in}" W`);
  if (p.height_in != null) parts.push(`${p.height_in}" H`);
  return parts.length ? parts.join('  ×  ') : null;
}

export function ProductDetailSections({ product }: { product: StorefrontProduct }) {
  const dimensions = dims(product);
  const specs: { icon: React.ElementType; label: string; value: string }[] = [];
  if (dimensions) specs.push({ icon: Ruler, label: 'Dimensions', value: dimensions });
  if (product.weight_lb != null) specs.push({ icon: Ruler, label: 'Weight', value: `${product.weight_lb} lbs` });
  if (product.woods.length) specs.push({ icon: Trees, label: 'Material', value: `Solid ${product.woods.map((w) => w.name).join(', ')}` });
  if (product.lead_time_weeks) specs.push({ icon: Clock, label: 'Lead time', value: `Made to order in ~${product.lead_time_weeks} weeks` });
  if (product.region) specs.push({ icon: MapPin, label: 'Handcrafted in', value: product.region });

  return (
    <>
      {/* Story */}
      {product.story && (
        <section className="bg-[var(--bone)] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-[760px] text-center">
            <div className="eyebrow">The Story</div>
            <p className="serif mt-5 text-[22px] font-normal leading-[1.5] text-[var(--ink)] md:text-[28px]">{product.story}</p>
          </div>
        </section>
      )}

      {/* Specifications + Materials */}
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-10 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {specs.length > 0 && (
            <div>
              <div className="eyebrow">Specifications</div>
              <h2 className="serif mt-3 text-[26px] text-[var(--ink)] md:text-[32px]">The details</h2>
              <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {specs.map((s) => (
                  <div key={s.label} className="flex items-start gap-4 py-4">
                    <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--walnut)]" strokeWidth={1.6} />
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">{s.label}</dt>
                      <dd className="mt-0.5 text-[15px] text-[var(--ink)]">{s.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <div className="eyebrow">Make It Yours</div>
            <h2 className="serif mt-3 text-[26px] text-[var(--ink)] md:text-[32px]">Wood & finish</h2>
            {product.woods.length > 0 && (
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Wood species</div>
                <div className="mt-3 flex flex-wrap gap-4">
                  {product.woods.map((w) => (
                    <div key={w.id} className="flex items-center gap-2">
                      <span className="inline-block h-7 w-7 rounded-full border border-black/10" style={{ background: w.swatch_color }} />
                      <span className="text-sm text-[var(--ink)]">{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {product.finishes.length > 0 && (
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Hand-rubbed finishes</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.finishes.map((f) => (
                    <span key={f.id} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink)]">{f.name}</span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-6 text-[14px] leading-[1.8] text-[var(--stone)]">
              Every option is solid American hardwood, finished by hand. Order complimentary samples to see the grain and color in your own light before you commit.
            </p>
            <Link href="/order-a-sample" className="mt-4 inline-block border border-[var(--espresso)] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[var(--espresso)]">Order a Sample</Link>
          </div>
        </div>
      </section>

      {/* Ownership / trust band */}
      <section className="border-y border-[var(--line)] bg-[var(--paper)] px-6 py-14 md:py-16">
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-10 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'White-glove delivery', body: 'Complimentary. We place it in your room and remove all packaging.', href: '/delivery' },
            { icon: ShieldCheck, title: 'Lifetime craftsmanship warranty', body: 'We sign our work and stand behind every joint and finish.', href: '/warranty' },
            { icon: Sparkles, title: 'Made to be maintained', body: 'A solid-wood piece you can refresh and repair, not replace.', href: '/care-guide' },
          ].map((b) => (
            <Link key={b.title} href={b.href} className="group text-center sm:text-left">
              <b.icon className="mx-auto h-6 w-6 text-[var(--walnut)] sm:mx-0" strokeWidth={1.6} />
              <h3 className="mt-3 text-sm font-medium text-[var(--ink)] group-hover:text-[var(--walnut)]">{b.title}</h3>
              <p className="mt-1 text-[13px] leading-[1.7] text-[var(--stone)]">{b.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
