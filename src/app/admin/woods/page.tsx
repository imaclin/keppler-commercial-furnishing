import { listWoods, listFinishes } from '@/lib/catalog';
import { addWoodAction, addFinishAction } from '@/app/actions/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function WoodsPage() {
  const [woods, finishes] = await Promise.all([listWoods(), listFinishes()]);
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Wood &amp; Finishes</h1>
      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <section>
          <div className="eyebrow mb-3">Wood Species</div>
          <ul className="mb-4 space-y-2">
            {woods.map((w) => (
              <li key={w.id} className="flex items-center gap-3 text-sm">
                <span className="inline-block h-4 w-4 rounded-full border border-black/10" style={{ background: w.swatch_color }} />
                {w.name}
              </li>
            ))}
          </ul>
          <form action={addWoodAction} className="flex gap-2">
            <Input name="name" placeholder="Name" required />
            <Input name="swatch_color" placeholder="#color" defaultValue="#6b4f3a" className="w-28" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </section>
        <section>
          <div className="eyebrow mb-3">Finishes</div>
          <ul className="mb-4 space-y-2">
            {finishes.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className="inline-block h-4 w-4 rounded-full border border-black/10" style={{ background: f.swatch_color }} />
                {f.name}
              </li>
            ))}
          </ul>
          <form action={addFinishAction} className="flex gap-2">
            <Input name="name" placeholder="Name" required />
            <Input name="swatch_color" placeholder="#color" defaultValue="#6b4f3a" className="w-28" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
