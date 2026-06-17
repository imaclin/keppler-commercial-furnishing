import Link from 'next/link';
import { listProducts } from '@/lib/catalog';
import { formatPriceCents } from '@/lib/format';
import { RowLink } from '@/components/admin/RowLink';

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
            <th className="w-[64px] py-3"></th>
            <th className="py-3 text-left">Name</th>
            <th className="text-left">Category</th>
            <th className="text-right">Base Price</th>
            <th className="w-px whitespace-nowrap text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <RowLink key={p.id} href={`/admin/products/${p.id}`} className="border-b border-[var(--line)] hover:bg-[var(--bone)]/50">
              <td className="py-2 pr-4">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-12 w-12 max-w-none rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-[var(--line)] bg-[var(--bone)] text-[10px] text-[var(--stone)]">No image</div>
                )}
              </td>
              <td className="py-2 font-medium text-[var(--ink)]">{p.name}</td>
              <td className="capitalize text-[var(--stone)]">{p.category}</td>
              <td className="text-right tabular-nums">{formatPriceCents(p.base_price_cents)}</td>
              <td className="py-2 text-right">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] capitalize ${p.status === 'published' ? 'bg-[var(--bone)] text-[var(--walnut)]' : 'bg-[var(--line)] text-[var(--stone)]'}`}>{p.status}</span>
              </td>
            </RowLink>
          ))}
          {products.length === 0 && <tr><td colSpan={5} className="py-6 text-[var(--stone)]">No products yet. Create your first piece.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
