import Link from 'next/link';
import { listProducts } from '@/lib/catalog';
import { formatPriceCents } from '@/lib/format';

export default async function ProductsPage() {
  const products = await listProducts();
  return (
    <main className="p-10">
      <div className="flex items-center justify-between">
        <h1 className="serif text-3xl text-[var(--ink)]">Products</h1>
        <Link href="/admin/products/new" className="bg-[var(--espresso)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#fffdfa]">+ New Product</Link>
      </div>
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--espresso)] text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
            <th className="py-3 text-left">Name</th>
            <th className="text-left">Category</th>
            <th className="text-right">Base Price</th>
            <th className="w-px whitespace-nowrap text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-[var(--line)]">
              <td className="py-3"><Link href={`/admin/products/${p.id}`} className="font-medium text-[var(--ink)] hover:underline">{p.name}</Link></td>
              <td className="capitalize text-[var(--stone)]">{p.category}</td>
              <td className="text-right tabular-nums">{formatPriceCents(p.base_price_cents)}</td>
              <td className="py-3 text-right">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] capitalize ${p.status === 'published' ? 'bg-[var(--bone)] text-[var(--walnut)]' : 'bg-[var(--line)] text-[var(--stone)]'}`}>{p.status}</span>
              </td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan={4} className="py-6 text-[var(--stone)]">No products yet. Create your first piece.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
