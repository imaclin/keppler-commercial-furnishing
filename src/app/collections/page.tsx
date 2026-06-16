import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { listCollections } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-16">
        <h1 className="serif mb-10 text-center text-5xl text-[var(--ink)]">Collections</h1>
        <ul className="grid gap-8 md:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.slug}`} className="block border border-[var(--line)] p-8 hover:bg-[var(--bone)]">
                <h2 className="serif text-2xl text-[var(--ink)]">{c.name}</h2>
                {c.description && <p className="mt-2 text-sm text-[var(--stone)]">{c.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
