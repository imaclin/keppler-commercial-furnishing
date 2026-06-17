import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionById, listCollections, listProducts } from '@/lib/catalog';
import { CollectionProducts, type CollectionProductRow } from '@/components/admin/CollectionProducts';

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [collection, collections, products] = await Promise.all([
    getCollectionById(id),
    listCollections(),
    listProducts(),
  ]);
  if (!collection) notFound();

  const nameById = new Map(collections.map((c) => [c.id, c.name]));
  const rows: CollectionProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    member: p.collection_id === id,
    otherCollection: p.collection_id && p.collection_id !== id ? (nameById.get(p.collection_id) ?? null) : null,
  }));

  return (
    <main className="p-10">
      <div className="mb-1 flex items-center gap-3 text-xs">
        <Link href="/admin/collections" className="text-[var(--walnut)] hover:underline">Collections</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-[var(--stone)]">{collection.name}</span>
      </div>

      <div className="mt-4 flex items-start gap-5">
        {collection.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={collection.hero_image_url} alt="" className="h-24 w-36 max-w-none shrink-0 rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
        ) : (
          <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded border border-[var(--line)] bg-[var(--bone)] text-[10px] text-[var(--stone)]">No image</div>
        )}
        <div>
          <h1 className="serif text-3xl text-[var(--ink)]">{collection.name}</h1>
          {collection.description && <p className="mt-1 max-w-2xl text-sm text-[var(--stone)]">{collection.description}</p>}
        </div>
      </div>

      <div className="mt-10">
        <CollectionProducts collectionId={id} products={rows} />
      </div>
    </main>
  );
}
