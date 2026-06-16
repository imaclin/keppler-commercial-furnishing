import Link from 'next/link';
import { getProfile } from '@/lib/auth';
import { listFavorites } from '@/lib/account';
import { activeOrderForCustomer } from '@/lib/orders';
import { ProductCard } from '@/components/storefront/ProductCard';
import { OrderTracker } from '@/components/OrderTracker';
import { formatPriceCents } from '@/lib/format';

export default async function AccountDashboard() {
  const profile = await getProfile();
  const [favorites, activeOrder] = await Promise.all([
    profile ? listFavorites(profile.id).then((f) => f.slice(0, 4)) : Promise.resolve([]),
    profile ? activeOrderForCustomer(profile.id) : Promise.resolve(null),
  ]);
  return (
    <main className="p-10">
      <h1 className="serif text-4xl text-[var(--ink)]">Good to see you, {profile?.name}.</h1>
      <p className="mt-2 text-sm text-[var(--stone)]">Your favorites, sample requests, and orders live here.</p>

      {activeOrder && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Active order</div>
            <Link href={`/account/orders/${activeOrder.id}`} className="text-xs text-[var(--walnut)] underline">View order</Link>
          </div>
          <div className="mt-3 rounded border border-[var(--line)] bg-[var(--paper)] p-6">
            <OrderTracker status={activeOrder.status} />
            {activeOrder.est_delivery_date && (
              <p className="mt-5 text-center text-sm text-[var(--stone)]">
                Estimated delivery: <span className="font-medium text-[var(--ink)]">{new Date(activeOrder.est_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            )}
            <div className="mt-4 text-center text-sm text-[var(--stone)]">{formatPriceCents(activeOrder.total_cents)}</div>
          </div>
        </div>
      )}

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
