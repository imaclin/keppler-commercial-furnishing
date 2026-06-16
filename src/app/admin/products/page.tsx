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
          <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
            <th className="py-3">Name</th><th>Category</th><th>Base Price</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-[var(--line)]">
              <td className="py-3"><Link href={`/admin/products/${p.id}`} className="font-medium text-[var(--ink)] hover:underline">{p.name}</Link></td>
              <td className="capitalize">{p.category}</td>
              <td>{formatPriceCents(p.base_price_cents)}</td>
              <td><span className="capitalize text-[var(--stone)]">{p.status}</span></td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan={4} className="py-6 text-[var(--stone)]">No products yet. Create your first piece.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
