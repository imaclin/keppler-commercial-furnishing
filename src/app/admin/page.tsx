import Link from 'next/link';
import { catalogCounts } from '@/lib/catalog';
import { orderCounts } from '@/lib/orders';

export default async function AdminDashboard() {
  const [counts, oc] = await Promise.all([catalogCounts(), orderCounts()]);

  const catalogStats = [
    { label: 'Products', value: counts.products },
    { label: 'Published', value: counts.published },
    { label: 'Collections', value: counts.collections },
  ];

  const orderStats = [
    { label: 'Open Orders', value: oc.open, href: '/admin/orders' },
    { label: 'Quotes Pending', value: oc.quotesPending, href: '/admin/quotes' },
    { label: 'In Production', value: oc.inProduction, href: '/admin/orders' },
  ];

  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Dashboard</h1>

      {oc.quotesPending > 0 && (
        <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 max-w-xl">
          <div className="text-[8px] uppercase tracking-[0.4em] text-amber-700 mb-1">Needs Attention</div>
          <p className="text-sm text-amber-900">
            {oc.quotesPending} quote{oc.quotesPending !== 1 ? 's' : ''} waiting to be priced.{' '}
            <Link href="/admin/quotes" className="underline hover:no-underline">Review quotes</Link>
          </p>
        </div>
      )}

      <div className="mt-8">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Sales</div>
        <div className="grid max-w-3xl grid-cols-3 gap-5">
          {orderStats.map((s) => (
            <Link key={s.label} href={s.href} className="block border border-[var(--line)] bg-[var(--paper)] p-6 hover:border-[var(--walnut)]">
              <div className="eyebrow">{s.label}</div>
              <div className="serif mt-2 text-4xl text-[var(--ink)]">{s.value}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] mb-4">Catalog</div>
        <div className="grid max-w-3xl grid-cols-3 gap-5">
          {catalogStats.map((s) => (
            <div key={s.label} className="border border-[var(--line)] bg-[var(--paper)] p-6">
              <div className="eyebrow">{s.label}</div>
              <div className="serif mt-2 text-4xl text-[var(--ink)]">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Link href="/admin/products/new" className="mt-8 inline-block bg-[var(--espresso)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#fffdfa]">+ New Product</Link>
    </main>
  );
}
