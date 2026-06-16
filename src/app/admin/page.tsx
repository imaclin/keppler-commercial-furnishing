import Link from 'next/link';
import { catalogCounts } from '@/lib/catalog';

export default async function AdminDashboard() {
  const counts = await catalogCounts();
  const stats = [
    { label: 'Products', value: counts.products },
    { label: 'Published', value: counts.published },
    { label: 'Collections', value: counts.collections },
  ];
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Dashboard</h1>
      <div className="mt-8 grid max-w-3xl grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="border border-[var(--line)] bg-[var(--paper)] p-6">
            <div className="eyebrow">{s.label}</div>
            <div className="serif mt-2 text-4xl text-[var(--ink)]">{s.value}</div>
          </div>
        ))}
      </div>
      <Link href="/admin/products/new" className="mt-8 inline-block bg-[var(--espresso)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#fffdfa]">+ New Product</Link>
    </main>
  );
}
