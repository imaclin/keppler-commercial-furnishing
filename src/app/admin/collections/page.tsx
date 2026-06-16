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
      <Card className="mt-8 max-w-xl p-5">
        <form action={addCollectionAction} className="space-y-3">
          <Input name="name" placeholder="Collection name" required />
          <Input name="description" placeholder="Short description (optional)" />
          <Button type="submit">Add collection</Button>
        </form>
      </Card>
      <ul className="mt-8 max-w-xl space-y-2">
        {collections.map((c) => (
          <li key={c.id} className="border-b border-[var(--line)] py-3">
            <div className="font-medium text-[var(--ink)]">{c.name}</div>
            {c.description && <div className="text-sm text-[var(--stone)]">{c.description}</div>}
          </li>
        ))}
        {collections.length === 0 && <li className="text-sm text-[var(--stone)]">No collections yet.</li>}
      </ul>
    </main>
  );
}
