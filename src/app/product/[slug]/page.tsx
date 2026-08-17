import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductConfigurator } from '@/components/storefront/ProductConfigurator';
import { ProductDetailSections } from '@/components/storefront/ProductDetailSections';
import { CtaBand } from '@/components/storefront/rich';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStorefrontProduct, listPublished } from '@/lib/catalog';
import { getProfile } from '@/lib/auth';
import { isFavorited } from '@/lib/account';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) return { title: 'Not found | Keppler Commercial Furnishing' };
  return {
    title: `${product.name} | Keppler Commercial Furnishing`,
    description: product.short_description ?? 'Handcrafted American solid-wood furniture.',
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const related = (await listPublished(product.category, {})).filter((p) => p.id !== product.id).slice(0, 4);
  const profile = await getProfile();
  const initialFavorited = profile ? await isFavorited(profile.id, product.id) : false;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description ?? product.story ?? undefined,
    category: product.category,
    image: product.images.map((i) => i.url),
    brand: { '@type': 'Brand', name: 'Keppler Commercial Furnishing' },
    material: product.woods.map((w) => w.name).join(', ') || undefined,
    offers: {
      '@type': 'Offer',
      price: (product.base_price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main>
        <div className="mx-auto max-w-[1320px] px-6 md:px-14 py-10">
          <div className="mb-6 text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">
            <Link href="/">Home</Link> / <Link href={`/${product.category}s`} className="capitalize">{product.category}s</Link> / {product.name}
          </div>
          <ProductConfigurator product={product} initialFavorited={initialFavorited} isLoggedIn={profile !== null} />
        </div>

        <ProductDetailSections product={product} />

        <CtaBand
          title="Built to outlast us."
          body="Every piece is cut, joined, and finished by hand. See how it's made, or design yours with us."
          primary={{ href: '/our-craft', label: 'Explore Our Craft' }}
          secondary={{ href: '/consultation', label: 'Book a Consultation' }}
        />

        {related.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-6 md:px-14 py-16 md:py-24">
            <h2 className="serif mb-10 text-center text-3xl text-[var(--ink)]">Complete the Room</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
