# HW Phase 3: Customer Accounts + Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give customers a home: save favorites, request wood/finish samples from a product page, and see it all in a portal. Builds on the Phase 0 customer auth (registration/login already exist).

**Architecture:** Extends Phases 0-2 (Next.js 16, local Postgres via `pg`, custom session auth with `requireCustomer`/`getProfile`, the storefront and PDP configurator). Adds `favorites` + `sample_requests` tables, a `src/lib/account.ts` data layer, customer-gated server actions, a portal under `/account/*` with a sidebar, and wires a Favorite button and a Sample-request form into the existing `ProductConfigurator`.

**Tech Stack:** Next.js 16 App Router, TypeScript, `pg`, Tailwind + shadcn, vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-hw-design.md`. Customer portal mockup reference: `docs/mockups/hw_customer.png` (the customer dashboard shown earlier; orders/quotes sections on it are Phase 4, not built here).

**Builds on:** `src/lib/auth.ts` (`getProfile`, `requireCustomer`), `src/lib/catalog.ts`, `src/components/storefront/ProductConfigurator.tsx` (has selected `woodId`/`finishId` state), `src/components/Header.tsx`/`Footer.tsx`, shadcn primitives. The `users`/`profiles` tables and the seeded staff account exist.

---

## File Structure

```
hw/
  db/migrations/0007_account.sql        # NEW: favorites, sample_requests
  db/reset.sql / package.json           # MODIFY: db:reset chain adds 0007
  src/lib/
    types.ts                            # MODIFY: SampleRequestRow type
    account.ts                          # NEW: favorites + sample requests + profile data layer
  src/app/actions/
    account.ts                          # NEW: toggleFavorite, requestSample, updateProfileName
  src/app/account/
    layout.tsx                          # NEW: customer-gated portal shell (sidebar)
    page.tsx                            # MODIFY: portal dashboard
    favorites/page.tsx                  # NEW
    samples/page.tsx                    # NEW
    profile/page.tsx                    # NEW
  src/components/
    account/PortalSidebar.tsx           # NEW (client, active nav)
    account/ProfileForm.tsx             # NEW (client)
    storefront/FavoriteButton.tsx       # NEW (client)
    storefront/SampleRequestForm.tsx    # NEW (client)
    storefront/ProductConfigurator.tsx  # MODIFY: mount FavoriteButton + SampleRequestForm
  test/account... (none; covered by e2e + existing integration pattern)
```

---

## Task 1: Schema + types

**Files:** Create `db/migrations/0007_account.sql`; modify `package.json`, `src/lib/types.ts`.

- [ ] **Step 1: Write `db/migrations/0007_account.sql`**

```sql
create table favorites (
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table sample_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  wood_id uuid references wood_species(id) on delete set null,
  finish_id uuid references finishes(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','shipped','delivered')),
  created_at timestamptz not null default now()
);
create index sample_requests_user_idx on sample_requests(user_id, created_at desc);
```

- [ ] **Step 2: Add 0007 to the db:reset chain in `package.json`** (after 0006).

- [ ] **Step 3: Add a type to `src/lib/types.ts`** (append)

```ts
export type SampleRequestRow = {
  id: string;
  product_id: string | null;
  product_name: string | null;
  wood_name: string | null;
  finish_name: string | null;
  status: 'requested' | 'shipped' | 'delivered';
  created_at: string;
};
```

- [ ] **Step 4: Apply and verify**

```bash
npm run db:reset
psql -d hw -tAc "select to_regclass('public.favorites'), to_regclass('public.sample_requests');"
```
Expected: both names returned (not null).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(account): favorites and sample_requests schema"
```

---

## Task 2: Account data layer

**Files:** Create `src/lib/account.ts`.

- [ ] **Step 1: Implement `src/lib/account.ts`**

```ts
import { query, queryOne } from '@/lib/db';
import type { StorefrontCard, SampleRequestRow } from '@/lib/types';

export async function isFavorited(userId: string, productId: string): Promise<boolean> {
  const row = await queryOne<{ one: number }>(
    'select 1 as one from favorites where user_id = $1 and product_id = $2', [userId, productId],
  );
  return row !== null;
}

// Toggle a favorite. Returns the resulting favorited state.
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  const del = await query('delete from favorites where user_id = $1 and product_id = $2', [userId, productId]);
  // pg does not return rowCount from query() helper; re-check by attempting insert on empty.
  const existed = await queryOne<{ one: number }>(
    'select 1 as one from favorites where user_id = $1 and product_id = $2', [userId, productId],
  );
  if (existed) return true; // should not happen, defensive
  // If nothing was there before the delete, the delete removed nothing; decide by re-querying intent.
  // Simpler correct approach: use an insert-or-delete in one step below.
  void del;
  return false;
}

export async function listFavorites(userId: string): Promise<StorefrontCard[]> {
  return query<StorefrontCard>(
    `select p.*,
       (select url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url,
       array(select w.swatch_color from product_woods pw join wood_species w on w.id = pw.wood_id where pw.product_id = p.id order by w.sort_order) as wood_swatches
     from favorites f join products p on p.id = f.product_id
     where f.user_id = $1 order by f.created_at desc`,
    [userId],
  );
}

export async function createSampleRequest(args: {
  userId: string; productId: string | null; woodId: string | null; finishId: string | null;
}): Promise<void> {
  await query(
    'insert into sample_requests (user_id, product_id, wood_id, finish_id) values ($1, $2, $3, $4)',
    [args.userId, args.productId, args.woodId, args.finishId],
  );
}

export async function listSampleRequests(userId: string): Promise<SampleRequestRow[]> {
  return query<SampleRequestRow>(
    `select s.id, s.product_id, p.name as product_name, w.name as wood_name, f.name as finish_name, s.status, s.created_at
       from sample_requests s
       left join products p on p.id = s.product_id
       left join wood_species w on w.id = s.wood_id
       left join finishes f on f.id = s.finish_id
      where s.user_id = $1 order by s.created_at desc`,
    [userId],
  );
}

export async function updateProfileName(userId: string, name: string): Promise<void> {
  await query('update profiles set name = $2 where id = $1', [userId, name]);
}
```

Note: the `toggleFavorite` above is intentionally rewritten correctly in Step 2-fix below; implement the corrected version.

- [ ] **Step 2: Use this corrected `toggleFavorite`** (replace the stub from Step 1 with this exact implementation, which uses an atomic delete-returning then conditional insert)

```ts
import { transaction } from '@/lib/db';

export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  return transaction(async (client) => {
    const del = await client.query('delete from favorites where user_id = $1 and product_id = $2', [userId, productId]);
    if ((del.rowCount ?? 0) > 0) return false; // was favorited, now removed
    await client.query('insert into favorites (user_id, product_id) values ($1, $2) on conflict do nothing', [userId, productId]);
    return true;
  });
}
```
Remove the placeholder `toggleFavorite` body and the unused `existed`/`void del` lines from Step 1; keep only this transaction-based version. Add `transaction` to the `@/lib/db` import.

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(account): favorites, sample requests, and profile data layer"
```

---

## Task 3: Account server actions

**Files:** Create `src/app/actions/account.ts`.

- [ ] **Step 1: Implement `src/app/actions/account.ts`**

```ts
'use server';

import { getProfile, requireCustomer } from '@/lib/auth';
import { toggleFavorite, createSampleRequest, updateProfileName } from '@/lib/account';

export type FavoriteResult = { favorited: boolean } | { needsAuth: true };

export async function toggleFavoriteAction(productId: string): Promise<FavoriteResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  const favorited = await toggleFavorite(profile.id, productId);
  return { favorited };
}

export type SampleResult = { ok: true } | { needsAuth: true } | { error: string };

export async function requestSampleAction(
  productId: string | null, woodId: string | null, finishId: string | null,
): Promise<SampleResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  try {
    await createSampleRequest({ userId: profile.id, productId, woodId, finishId });
  } catch {
    return { error: 'Could not place the sample request. Please try again.' };
  }
  return { ok: true };
}

export async function updateProfileNameAction(formData: FormData): Promise<void> {
  const profile = await requireCustomer();
  const name = String(formData.get('name') ?? '').trim();
  if (name) await updateProfileName(profile.id, name);
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(account): favorite/sample/profile server actions with auth gating"
```

---

## Task 4: Portal shell + dashboard

**Files:** Create `src/components/account/PortalSidebar.tsx`, `src/app/account/layout.tsx`; modify `src/app/account/page.tsx`.

- [ ] **Step 1: Create `src/components/account/PortalSidebar.tsx`** (client, active nav)

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/samples', label: 'Wood Samples' },
  { href: '/account/profile', label: 'Profile' },
];

export function PortalSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-[248px] shrink-0 border-r border-[var(--line)] bg-[var(--paper)] py-8">
      <Link href="/" className="serif block px-7 text-center text-3xl tracking-[0.2em] text-[var(--espresso)]">HW</Link>
      <div className="mb-8 text-center text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">My Account</div>
      <nav className="flex flex-col">
        {NAV.map((n) => {
          const active = n.href === '/account' ? pathname === '/account' : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={`px-7 py-3 text-sm ${active ? 'border-l-2 border-[var(--walnut)] bg-[var(--bone)] pl-[26px] font-medium text-[var(--walnut)]' : 'text-[var(--ink)]'}`}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 border-t border-[var(--line)] px-7 pt-4 text-xs text-[var(--stone)]">{name}</div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `src/app/account/layout.tsx`** (customer-gated)

```tsx
import { requireCustomer } from '@/lib/auth';
import { PortalSidebar } from '@/components/account/PortalSidebar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <PortalSidebar name={profile.name} />
      <div className="flex-1">
        <div className="flex items-center justify-end border-b border-[var(--line)] bg-[var(--paper)] px-10 py-4">
          <form action="/auth/signout" method="post"><button type="submit" className="text-xs uppercase tracking-[0.12em] text-[var(--ink)]">Sign out</button></form>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/account/page.tsx`** (dashboard; layout gates, so just fetch + render)

```tsx
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
```

- [ ] **Step 4: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(account): customer-gated portal shell, sidebar, and dashboard"
```

---

## Task 5: Favorites, Samples, Profile pages

**Files:** Create `src/app/account/favorites/page.tsx`, `src/app/account/samples/page.tsx`, `src/app/account/profile/page.tsx`, `src/components/account/ProfileForm.tsx`.

- [ ] **Step 1: `src/app/account/favorites/page.tsx`**

```tsx
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
```

- [ ] **Step 2: `src/app/account/samples/page.tsx`**

```tsx
import { getProfile } from '@/lib/auth';
import { listSampleRequests } from '@/lib/account';

export default async function SamplesPage() {
  const profile = await getProfile();
  const samples = profile ? await listSampleRequests(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Wood Samples</h1>
      {samples.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--stone)]">No sample requests yet. Order a wood and finish sample from any product page.</p>
      ) : (
        <ul className="mt-8 max-w-2xl divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {samples.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-4 text-sm">
              <div>
                <div className="text-[var(--ink)]">{[s.wood_name, s.finish_name].filter(Boolean).join(' . ') || 'Sample'}</div>
                {s.product_name && <div className="text-xs text-[var(--stone)]">For {s.product_name}</div>}
              </div>
              <span className="rounded-full bg-[var(--bone)] px-3 py-1 text-xs capitalize text-[var(--walnut)]">{s.status}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 3: `src/components/account/ProfileForm.tsx`** (client)

```tsx
'use client';

import { useState } from 'react';
import { updateProfileNameAction } from '@/app/actions/account';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <form action={async (fd) => { await updateProfileNameAction(fd); setSaved(true); }} className="max-w-md space-y-4">
      <div className="space-y-2"><Label>Email</Label><Input value={email} disabled /></div>
      <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={name} required /></div>
      {saved && <p className="text-sm text-[var(--walnut)]">Saved.</p>}
      <Button type="submit" onClick={() => setSaved(false)}>Save</Button>
    </form>
  );
}
```

- [ ] **Step 4: `src/app/account/profile/page.tsx`**

```tsx
import { getProfile } from '@/lib/auth';
import { ProfileForm } from '@/components/account/ProfileForm';

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Profile</h1>
      <div className="mt-8">
        {profile && <ProfileForm name={profile.name} email={profile.email} />}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(account): favorites, samples, and profile pages"
```

---

## Task 6: Favorite button + sample form on the PDP

**Files:** Create `src/components/storefront/FavoriteButton.tsx`, `src/components/storefront/SampleRequestForm.tsx`; modify `src/components/storefront/ProductConfigurator.tsx`.

- [ ] **Step 1: Create `src/components/storefront/FavoriteButton.tsx`** (client)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavoriteAction } from '@/app/actions/account';
import { Button } from '@/components/ui/button';

export function FavoriteButton({ productId, initialFavorited }: { productId: string; initialFavorited: boolean }) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await toggleFavoriteAction(productId);
    setBusy(false);
    if ('needsAuth' in res) { router.push('/login'); return; }
    setFavorited(res.favorited);
  }
  return (
    <Button variant="outline" className="w-full" onClick={toggle} disabled={busy}>
      {favorited ? 'Saved to Favorites' : 'Add to Favorites'}
    </Button>
  );
}
```

- [ ] **Step 2: Create `src/components/storefront/SampleRequestForm.tsx`** (client)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestSampleAction } from '@/app/actions/account';

export function SampleRequestForm({ productId, woodId, finishId }: { productId: string; woodId: string | null; finishId: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'done'>('idle');
  const [busy, setBusy] = useState(false);

  async function order() {
    if (busy) return;
    setBusy(true);
    const res = await requestSampleAction(productId, woodId, finishId);
    setBusy(false);
    if ('needsAuth' in res) { router.push('/login'); return; }
    if ('ok' in res) setState('done');
  }
  if (state === 'done') return <p className="mt-4 text-sm text-[var(--walnut)]">Sample on its way. Track it in your account.</p>;
  return (
    <button type="button" onClick={order} disabled={busy} className="mt-4 text-sm text-[var(--walnut)] underline disabled:opacity-50">
      Order a wood and finish sample . $5, credited to your order
    </button>
  );
}
```

- [ ] **Step 3: Modify `src/components/storefront/ProductConfigurator.tsx`**

Import `FavoriteButton` and `SampleRequestForm`. After the `QuoteRequestForm` block, add the favorite button, and REPLACE the static `<p>Order a wood and finish sample ...</p>` line with `<SampleRequestForm productId={product.id} woodId={woodId} finishId={finishId} />`. The configurator already holds `woodId` and `finishId` state, so the sample reflects the current selection. Add an `initialFavorited` prop to the component:

```tsx
// change the component signature:
export function ProductConfigurator({ product, initialFavorited }: { product: StorefrontProduct; initialFavorited: boolean }) {
```
and in the actions area:
```tsx
<div className="mt-8 space-y-3">
  <QuoteRequestForm productId={product.id} configuration={configuration} />
  <FavoriteButton productId={product.id} initialFavorited={initialFavorited} />
</div>
<SampleRequestForm productId={product.id} woodId={woodId} finishId={finishId} />
```
(Add the two imports at the top. Remove the old static sample `<p>`.)

- [ ] **Step 4: Pass `initialFavorited` from the PDP page** `src/app/product/[slug]/page.tsx`

Import `getProfile` from `@/lib/auth` and `isFavorited` from `@/lib/account`. After loading `product`, compute:
```tsx
const profile = await getProfile();
const initialFavorited = profile ? await isFavorited(profile.id, product.id) : false;
```
and pass `initialFavorited={initialFavorited}` to `<ProductConfigurator />`.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit && npm run build
git add -A && git commit -m "feat(account): favorite button and sample request on the product page"
```

---

## Task 7: End-to-end verification

No new files. Prove favorites and samples work for a logged-in customer.

- [ ] **Step 1: Reset, typecheck, build, test**

```bash
cd /Users/expando/github/hw
npm run db:reset && npx tsc --noEmit && npm run build && npx vitest run
```
Expected: all pass.

- [ ] **Step 2: Gate + data check**

Start `npm run dev` backgrounded. Confirm `/account` redirects anonymous users to `/login` (307). Then verify the data layer round-trips by creating a customer + session and exercising favorites/samples through SQL (the actions are exercised by the UI; this confirms persistence):

```bash
# create a customer
psql -d hw <<'SQL'
with u as (insert into users (email,password_hash) values ('cust@test.local','x') returning id),
p as (insert into profiles (id,email,name,role) select id,'cust@test.local','Test Customer','customer' from u returning id)
select 1;
SQL
CID=$(psql -d hw -tAc "select id from users where email='cust@test.local'")
PID=$(psql -d hw -tAc "select id from products where slug='the-homestead-table'")
WID=$(psql -d hw -tAc "select id from wood_species where name='Walnut'")
FID=$(psql -d hw -tAc "select id from finishes where name='Natural Oil'")
psql -d hw -c "insert into favorites (user_id, product_id) values ('$CID','$PID');"
psql -d hw -c "insert into sample_requests (user_id, product_id, wood_id, finish_id) values ('$CID','$PID','$WID','$FID');"
psql -d hw -tAc "select count(*) from favorites where user_id='$CID'; select count(*) from sample_requests where user_id='$CID';"
# cleanup
psql -d hw -c "delete from users where email='cust@test.local';"
```
Expected: favorites=1, sample_requests=1; cascade cleans them on user delete. Stop the dev server.

- [ ] **Step 3: Final commit (if anything changed)**

```bash
git add -A && git commit -m "test(account): phase 3 verification" || echo "nothing to commit"
```

---

## Done criteria

Phase 3 is complete when: a logged-in customer can favorite a product from the PDP and see it in `/account/favorites`, request a wood/finish sample from the PDP and see it in `/account/samples`, edit their profile name, and the portal is customer-gated (anonymous to `/login`); guests who try to favorite or request a sample are sent to `/login`; and `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass. The next plan covers Phase 4: quotes, orders, the production tracker, and customer-admin messaging.
