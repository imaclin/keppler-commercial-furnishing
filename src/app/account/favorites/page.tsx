import { getProfile } from '@/lib/auth';
import { listFavorites } from '@/lib/account';
import { ProductCard } from '@/components/storefront/ProductCard';

export default async function FavoritesPage() {
  const profile = await getProfile();
  const favorites = profile ? await listFavorites(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Favorites</h1>
      {favorites.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--stone)]">Nothing saved yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
          {favorites.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}
