import { notFound } from 'next/navigation';
import { getProductById, listCollections, listWoods, listFinishes } from '@/lib/catalog';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, collections, woods, finishes] = await Promise.all([
    getProductById(id), listCollections(), listWoods(), listFinishes(),
  ]);
  if (!product) notFound();
  return (
    <main className="p-10">
      <h1 className="serif mb-8 text-3xl text-[var(--ink)]">Edit {product.name}</h1>
      <ProductForm product={product} collections={collections} woods={woods} finishes={finishes} />
    </main>
  );
}
