import { listCollections } from '@/lib/catalog';
import { addCollectionAction } from '@/app/actions/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Collections</h1>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {collections.map((c) => (
            <li key={c.id} className="py-3">
              <div className="font-medium text-[var(--ink)]">{c.name}</div>
              {c.description && <div className="text-sm text-[var(--stone)]">{c.description}</div>}
            </li>
          ))}
          {collections.length === 0 && <li className="py-3 text-sm text-[var(--stone)]">No collections yet.</li>}
        </ul>
        <Card className="h-fit p-5">
          <div className="eyebrow mb-3">Add collection</div>
          <form action={addCollectionAction} className="space-y-3">
            <Input name="name" placeholder="Collection name" required />
            <Input name="description" placeholder="Short description (optional)" />
            <Button type="submit" className="w-full">Add collection</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
