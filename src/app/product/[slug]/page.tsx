import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductConfigurator } from '@/components/storefront/ProductConfigurator';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStorefrontProduct, listPublished } from '@/lib/catalog';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const related = (await listPublished(product.category, {})).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-10">
        <div className="mb-6 text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">
          <Link href="/">Home</Link> / <Link href={`/${product.category}s`} className="capitalize">{product.category}s</Link> / {product.name}
        </div>
        <ProductConfigurator product={product} />
        {related.length > 0 && (
          <section className="mt-24">
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
