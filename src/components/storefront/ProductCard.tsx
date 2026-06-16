import Link from 'next/link';
import { formatPriceCents } from '@/lib/format';
import type { StorefrontCard } from '@/lib/types';

export function ProductCard({ product }: { product: StorefrontCard }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden bg-[var(--bone)]">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        )}
      </div>
      <h3 className="serif mt-4 text-xl text-[var(--ink)]">{product.name}</h3>
      {product.wood_swatches.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {product.wood_swatches.map((c, i) => <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />)}
        </div>
      )}
      <p className="mt-2 text-sm text-[var(--ink)]">From {formatPriceCents(product.base_price_cents)}</p>
    </Link>
  );
}
