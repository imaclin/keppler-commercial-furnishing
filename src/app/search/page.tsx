import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { searchPublished } from '@/lib/catalog';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? await searchPublished(q) : [];
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-6 md:px-14 py-16">
        <h1 className="serif text-3xl text-[var(--ink)]">Search</h1>
        <form action="/search" className="mt-4 max-w-md">
          <input name="q" defaultValue={q ?? ''} placeholder="Search the collection..." className="w-full border-b border-[var(--ink)] bg-transparent py-2 outline-none" />
        </form>
        {q && <p className="mt-6 text-sm text-[var(--stone)]">{results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;</p>}
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
