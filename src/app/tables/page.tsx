import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryView } from '@/components/storefront/CategoryView';
import { listPublished, listWoods } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function TablesPage() {
  const [initial, woods] = await Promise.all([listPublished('table', {}), listWoods()]);
  return (
    <>
      <Header />
      <main className="pb-10">
        <CategoryView category="table" title="Tables" intro="Solid-wood dining tables, made to order in the species, finish, and proportions you choose." woods={woods} initial={initial} />
      </main>
      <Footer />
    </>
  );
}
