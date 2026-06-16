import { listCollections, listWoods, listFinishes } from '@/lib/catalog';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const [collections, woods, finishes] = await Promise.all([listCollections(), listWoods(), listFinishes()]);
  return (
    <main className="p-10">
      <h1 className="serif mb-8 text-3xl text-[var(--ink)]">New Product</h1>
      <ProductForm product={null} collections={collections} woods={woods} finishes={finishes} />
    </main>
  );
}
