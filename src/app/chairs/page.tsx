import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryView } from '@/components/storefront/CategoryView';
import { listPublished, listWoods } from '@/lib/catalog';

export default async function ChairsPage() {
  const [initial, woods] = await Promise.all([listPublished('chair', {}), listWoods()]);
  return (
    <>
      <Header />
      <main className="pb-10">
        <CategoryView category="chair" title="Chairs" intro="Handcrafted seating, joined by hand and built to be sat in for a lifetime." woods={woods} initial={initial} />
      </main>
      <Footer />
    </>
  );
}
