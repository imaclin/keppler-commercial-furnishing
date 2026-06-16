import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getCollectionBySlug, listPublishedByCollection } from '@/lib/catalog';

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const products = await listPublishedByCollection(collection.id);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-16">
        <h1 className="serif text-center text-5xl text-[var(--ink)]">{collection.name}</h1>
        {collection.description && <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--stone)]">{collection.description}</p>}
        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
