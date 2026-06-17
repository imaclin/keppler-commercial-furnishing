import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { listCollectionsWithCounts } from '@/lib/catalog';
import { NewCollectionModal } from '@/components/admin/NewCollectionModal';

export default async function CollectionsPage() {
  const collections = await listCollectionsWithCounts();
  return (
    <main className="p-5 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="serif text-3xl text-[var(--ink)]">Collections</h1>
        <NewCollectionModal />
      </div>

      <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {collections.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/collections/${c.id}`} className="flex items-center gap-4 py-4 hover:bg-[var(--bone)]/50">
              {c.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.hero_image_url} alt="" className="h-14 w-20 max-w-none shrink-0 rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded border border-[var(--line)] bg-[var(--bone)] text-[10px] text-[var(--stone)]">No image</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--ink)]">{c.name}</div>
                {c.description && <div className="truncate text-sm text-[var(--stone)]">{c.description}</div>}
              </div>
              <div className="shrink-0 text-sm text-[var(--stone)]">{c.product_count} {c.product_count === 1 ? 'product' : 'products'}</div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--stone)]" />
            </Link>
          </li>
        ))}
        {collections.length === 0 && <li className="py-6 text-sm text-[var(--stone)]">No collections yet. Create your first one.</li>}
      </ul>
    </main>
  );
}
