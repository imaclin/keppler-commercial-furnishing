import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { listFavorites } from '@/lib/account';
import { ProductCard } from '@/components/storefront/ProductCard';

export default async function AccountDashboard() {
  const profile = await getProfile();
  const favorites = profile ? (await listFavorites(profile.id)).slice(0, 4) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-4xl text-[var(--ink)]">Good to see you, {profile?.name}.</h1>
      <p className="mt-2 text-sm text-[var(--stone)]">Your favorites, sample requests, and orders live here. Order tracking arrives soon.</p>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="serif text-2xl text-[var(--ink)]">Saved favorites</h2>
        <Link href="/account/favorites" className="text-sm text-[var(--walnut)] underline">View all</Link>
      </div>
      {favorites.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--stone)]">Nothing saved yet. Tap the heart on a piece you love.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {favorites.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}
