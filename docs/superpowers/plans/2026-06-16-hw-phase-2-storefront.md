# HW Phase 2: Public Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, premium storefront that renders the catalog: a warm editorial home page, the Tables and Chairs category pages, and a product detail page with the live wood/finish/size configurator and a request-a-quote inquiry. Read-only browsing plus a lightweight inquiry capture; accounts/cart/full-quotes come in later phases.

**Architecture:** Extends Phases 0-1 (Next.js 16, local Postgres via `pg`, catalog data layer, staff admin). Adds public storefront queries to `src/lib/catalog.ts`, a demo catalog seed so the storefront has content, server-rendered pages styled to the approved mockups (`docs/mockups/hw_home.html`, `hw_plp.html`, `hw_pdp.html`), a client `ProductConfigurator` (live price via `computeConfiguredPriceCents`), and a quote-request inquiry table + action.

**Tech Stack:** Next.js 16 App Router, TypeScript, `pg`, Tailwind + shadcn, vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-hw-design.md`. v1 categories: `table`, `chair`.

**Builds on:** `src/lib/catalog.ts`, `src/lib/pricing.ts` (`computeConfiguredPriceCents`), `src/lib/format.ts` (`formatPriceCents`), `src/components/Header.tsx` + `Footer.tsx` (Phase 0), seeded woods/finishes. Brand imagery is committed at `public/brand/` (hero.png, craft.png, room.png); demo product images at `public/demo/` (demo-table.png, demo-table2..5.png, demo-chair.png, demo-room.png).

**Design system:** Cormorant Garamond serif + Inter; bone/cream backgrounds, espresso text, walnut `#6b4f3a` accent; large imagery, generous whitespace, quiet motion. The three mockup HTML files in `docs/mockups/` are the visual source of truth; port their layout/markup to React with real data and the existing CSS tokens (`var(--bone)`, `.serif`, `.eyebrow`, etc. from `globals.css`).

---

## File Structure

```
hw/
  db/migrations/0005_demo_catalog.sql   # NEW: demo collections + published products (dev/demo)
  db/migrations/0006_inquiries.sql      # NEW: quote-request inquiries table
  db/reset.sql / package.json           # MODIFY: db:reset chain adds 0005, 0006
  src/lib/
    catalog.ts                          # MODIFY: storefront read queries
    types.ts                            # MODIFY: StorefrontProduct, StorefrontCard
    inquiries.ts                        # NEW: createInquiry
  src/app/
    page.tsx                            # MODIFY: real home page
    tables/page.tsx                     # NEW
    chairs/page.tsx                     # NEW
    collections/page.tsx                # NEW
    collections/[slug]/page.tsx         # NEW
    search/page.tsx                     # NEW
    product/[slug]/page.tsx             # NEW: PDP (server)
    actions/inquiries.ts                # NEW: requestQuoteAction
  src/components/storefront/
    ProductCard.tsx                     # NEW
    CategoryView.tsx                    # NEW: shared PLP (filter/sort/grid), client
    ProductConfigurator.tsx             # NEW: gallery + options + live price + quote, client
    QuoteRequestForm.tsx                # NEW: inquiry form, client
```

---

## Task 1: Demo catalog seed

**Files:** Create `db/migrations/0005_demo_catalog.sql`; modify `package.json` db:reset.

- [ ] **Step 1: Write `db/migrations/0005_demo_catalog.sql`**

Inserts 2 collections and 8 published products (5 tables, 3 chairs) with images, and links each to all seeded woods + finishes plus a couple of sizes. Uses subqueries against the seeded `wood_species` / `finishes` so it does not hardcode ids.

```sql
-- Demo/dev catalog content so the storefront renders. Production builds its real
-- catalog through the admin; this seed is for local dev and review.
insert into collections (slug, name, description, sort_order) values
  ('homestead', 'The Homestead Collection', 'Solid, honest dining pieces built for daily life.', 1),
  ('heirloom', 'The Heirloom Collection', 'Showpiece tables and chairs meant to be handed down.', 2)
on conflict (slug) do nothing;

-- helper: insert a product, its images, all woods, all finishes, and two sizes
do $$
declare
  v_homestead uuid; v_heirloom uuid;
  v_pid uuid;
  rec record;
begin
  select id into v_homestead from collections where slug = 'homestead';
  select id into v_heirloom from collections where slug = 'heirloom';

  for rec in
    select * from (values
      ('the-homestead-table','The Homestead Table','table',v_homestead,'Solid oak, trestle base, made to seat the whole family.',320000,8,'/demo/demo-table.png'),
      ('the-garden-round','The Garden Round','table',v_homestead,'A round solid-walnut pedestal table.',245000,8,'/demo/demo-table2.png'),
      ('the-riverbend','The Riverbend','table',v_heirloom,'Live-edge walnut with a sculptural base.',480000,12,'/demo/demo-table3.png'),
      ('the-lancaster-farm','The Lancaster Farm','table',v_homestead,'Classic farmhouse oak with turned legs.',290000,9,'/demo/demo-table4.png'),
      ('the-orchard','The Orchard','table',v_heirloom,'Solid cherry extension table.',365000,10,'/demo/demo-table5.png'),
      ('the-lancaster-chair','The Lancaster Chair','chair',v_homestead,'Solid walnut, hand-finished, spindle back.',89000,8,'/demo/demo-chair.png'),
      ('the-shaker-side-chair','The Shaker Side Chair','chair',v_homestead,'Solid cherry with a woven seat.',64000,8,'/demo/demo-chair.png'),
      ('the-keeping-chair','The Keeping Chair','chair',v_heirloom,'A generous dining armchair in maple.',96000,9,'/demo/demo-chair.png')
    ) as t(slug,name,category,collection_id,descr,price,lead,img)
  loop
    insert into products (slug, name, category, collection_id, short_description, base_price_cents, lead_time_weeks, region, status, featured)
    values (rec.slug, rec.name, rec.category, rec.collection_id, rec.descr, rec.price, rec.lead, 'Holmes County, Ohio', 'published', true)
    on conflict (slug) do nothing
    returning id into v_pid;
    if v_pid is null then continue; end if;

    insert into product_images (product_id, url, type, sort_order) values (v_pid, rec.img, 'on_white', 0);
    insert into product_woods (product_id, wood_id, price_delta_cents) select v_pid, id, 0 from wood_species;
    insert into product_finishes (product_id, finish_id, price_delta_cents) select v_pid, id, 0 from finishes;
    if rec.category = 'table' then
      insert into product_sizes (product_id, label, seats, price_delta_cents, sort_order) values
        (v_pid, '72"', 6, 0, 0), (v_pid, '84"', 8, 40000, 1), (v_pid, '96"', 10, 80000, 2);
    end if;
    v_pid := null;
  end loop;
end $$;
```

- [ ] **Step 2: Add 0005 to the db:reset chain in `package.json`** (after 0004)

```json
"db:reset": "psql -d hw -v ON_ERROR_STOP=1 -f db/reset.sql -f db/migrations/0001_auth.sql -f db/migrations/0002_seed.sql -f db/migrations/0003_catalog.sql -f db/migrations/0004_catalog_seed.sql -f db/migrations/0005_demo_catalog.sql"
```

- [ ] **Step 3: Apply and verify**

```bash
npm run db:reset
psql -d hw -tAc "select count(*) from products where status='published'; select count(*) from product_images;"
```
Expected: `8` and `8`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(storefront): demo catalog seed (8 published products with images, woods, finishes, sizes)"
```

---

## Task 2: Storefront types + read queries

**Files:** Modify `src/lib/types.ts`, `src/lib/catalog.ts`.

- [ ] **Step 1: Add storefront types to `src/lib/types.ts`** (append)

```ts
export type StorefrontCard = Product & {
  image_url: string | null;
  wood_swatches: string[]; // swatch_color values, for the card dots
};

export type ConfigOption = { id: string; name: string; swatch_color: string; price_delta_cents: number };

export type StorefrontProduct = Product & {
  collection_name: string | null;
  images: ProductImage[];
  woods: ConfigOption[];
  finishes: ConfigOption[];
  sizes: ProductSize[];
};
```

- [ ] **Step 2: Append storefront read queries to `src/lib/catalog.ts`**

```ts
import type { StorefrontCard, StorefrontProduct, ProductImage, ConfigOption, ProductSize } from '@/lib/types';

const CARD_SELECT = `
  select p.*,
    (select url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url,
    coalesce(array(
      select w.swatch_color from product_woods pw join wood_species w on w.id = pw.wood_id
      where pw.product_id = p.id order by w.sort_order
    ), '{}') as wood_swatches
  from products p
  where p.status = 'published'`;

export async function listPublished(
  category: 'table' | 'chair' | null,
  opts: { woodId?: string; sort?: 'featured' | 'price_asc' | 'price_desc' | 'newest' } = {},
): Promise<StorefrontCard[]> {
  const params: unknown[] = [];
  let where = CARD_SELECT;
  if (category) { params.push(category); where += ` and p.category = $${params.length}`; }
  if (opts.woodId) {
    params.push(opts.woodId);
    where += ` and exists (select 1 from product_woods pw where pw.product_id = p.id and pw.wood_id = $${params.length})`;
  }
  const order =
    opts.sort === 'price_asc' ? 'p.base_price_cents asc' :
    opts.sort === 'price_desc' ? 'p.base_price_cents desc' :
    opts.sort === 'newest' ? 'p.created_at desc' :
    'p.featured desc, p.created_at desc';
  return query<StorefrontCard>(`${where} order by ${order} limit 100`, params);
}

export async function listFeatured(limit = 4): Promise<StorefrontCard[]> {
  return query<StorefrontCard>(`${CARD_SELECT} and p.featured = true order by p.created_at desc limit ${limit}`);
}

export async function getStorefrontProduct(slug: string): Promise<StorefrontProduct | null> {
  const product = await queryOne<StorefrontProduct>(
    `select p.*, c.name as collection_name from products p
       left join collections c on c.id = p.collection_id
      where p.slug = $1 and p.status = 'published'`,
    [slug],
  );
  if (!product) return null;
  const [images, woods, finishes, sizes] = await Promise.all([
    query<ProductImage>('select * from product_images where product_id = $1 order by sort_order', [product.id]),
    query<ConfigOption>(
      `select w.id, w.name, w.swatch_color, pw.price_delta_cents from product_woods pw
         join wood_species w on w.id = pw.wood_id where pw.product_id = $1 order by w.sort_order`, [product.id]),
    query<ConfigOption>(
      `select f.id, f.name, f.swatch_color, pf.price_delta_cents from product_finishes pf
         join finishes f on f.id = pf.finish_id where pf.product_id = $1 order by f.sort_order`, [product.id]),
    query<ProductSize>('select * from product_sizes where product_id = $1 order by sort_order', [product.id]),
  ]);
  return { ...product, images, woods, finishes, sizes };
}

export async function getCollectionBySlug(slug: string): Promise<{ id: string; name: string; description: string | null } | null> {
  return queryOne('select id, name, description from collections where slug = $1', [slug]);
}

export async function listPublishedByCollection(collectionId: string): Promise<StorefrontCard[]> {
  return query<StorefrontCard>(`${CARD_SELECT} and p.collection_id = $1 order by p.featured desc, p.created_at desc`, [collectionId]);
}

export async function searchPublished(q: string): Promise<StorefrontCard[]> {
  const term = `%${q.trim()}%`;
  return query<StorefrontCard>(
    `${CARD_SELECT} and (p.name ilike $1 or p.short_description ilike $1) order by p.featured desc limit 50`,
    [term],
  );
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(storefront): public catalog read queries and types"
```

---

## Task 3: ProductCard + home page

**Files:** Create `src/components/storefront/ProductCard.tsx`; modify `src/app/page.tsx`.

- [ ] **Step 1: Create `src/components/storefront/ProductCard.tsx`**

```tsx
import Link from 'next/link';
import { formatPriceCents } from '@/lib/format';
import type { StorefrontCard } from '@/lib/types';

export function ProductCard({ product }: { product: StorefrontCard }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden bg-[var(--bone)]">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        )}
      </div>
      <h3 className="serif mt-4 text-xl text-[var(--ink)]">{product.name}</h3>
      {product.wood_swatches.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {product.wood_swatches.map((c, i) => <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />)}
        </div>
      )}
      <p className="mt-2 text-sm text-[var(--ink)]">From {formatPriceCents(product.base_price_cents)}</p>
    </Link>
  );
}
```

- [ ] **Step 2: Replace `src/app/page.tsx` with the real home page**

Port the layout of `docs/mockups/hw_home.html` to React using `Header`/`Footer` and real data. Sections in order: announcement bar, Header, hero (full-bleed `public/brand/hero.png` with overlay headline "Built once. Kept for generations." + two CTAs to `/tables` and `/consultation`), an intro statement band, a Tables/Chairs category split (two large tiles linking to `/tables` and `/chairs`, backgrounds `public/demo/demo-table.png` and `public/demo/demo-chair.png`), a "Featured Pieces" grid rendering `listFeatured()` via `ProductCard`, a craft band (`public/brand/craft.png` + maker copy + link to `/our-craft`), a consultation band (`public/brand/room.png` overlay + CTA), a newsletter strip, and `Footer`. Use the CSS tokens and the serif/eyebrow classes. Use plain `<img>` for the large brand images (eslint-disable the next/image rule as in ProductCard).

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { listFeatured } from '@/lib/catalog';
import Link from 'next/link';

export default async function HomePage() {
  const featured = await listFeatured(4);
  return (
    <>
      <Header />
      <main>
        {/* Build the sections described above, styled to docs/mockups/hw_home.html.
            Render `featured` with <ProductCard product={p} /> in the Featured Pieces grid. */}
        <section className="mx-auto max-w-[1320px] px-14 py-20">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```
(The snippet above is the data-wiring skeleton. Fill in the hero/split/craft/consultation/newsletter sections to match the mockup; all are static markup plus the one `featured` map shown.)

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(storefront): product card and home page"
```

---

## Task 4: Category pages (Tables, Chairs) + CategoryView

**Files:** Create `src/components/storefront/CategoryView.tsx`, `src/app/tables/page.tsx`, `src/app/chairs/page.tsx`.

- [ ] **Step 1: Create `src/components/storefront/CategoryView.tsx`** (client; filter + sort + grid)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import type { StorefrontCard, WoodSpecies } from '@/lib/types';
import { getCategoryProductsAction } from '@/app/actions/storefront';

export function CategoryView({
  category, title, intro, woods, initial,
}: {
  category: 'table' | 'chair'; title: string; intro: string; woods: WoodSpecies[]; initial: StorefrontCard[];
}) {
  const [woodId, setWoodId] = useState<string>('');
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [items, setItems] = useState<StorefrontCard[]>(initial);

  useEffect(() => {
    getCategoryProductsAction(category, woodId || undefined, sort).then(setItems).catch(() => {});
  }, [category, woodId, sort]);

  return (
    <div className="mx-auto max-w-[1320px] px-14">
      <div className="py-10 text-center">
        <h1 className="serif text-5xl text-[var(--ink)]">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--stone)]">{intro}</p>
      </div>
      <div className="flex items-center justify-between border-y border-[var(--line)] py-4 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-[var(--stone)]">Wood</span>
          <select value={woodId} onChange={(e) => setWoodId(e.target.value)} className="border border-[var(--line)] px-2 py-1">
            <option value="">All</option>
            {woods.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border border-[var(--line)] px-2 py-1">
          <option value="featured">Featured</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-12 md:grid-cols-3">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
        {items.length === 0 && <p className="col-span-full text-sm text-[var(--stone)]">No pieces match.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/actions/storefront.ts`**

```ts
'use server';

import { listPublished } from '@/lib/catalog';
import type { StorefrontCard } from '@/lib/types';

export async function getCategoryProductsAction(
  category: 'table' | 'chair', woodId: string | undefined,
  sort: 'featured' | 'price_asc' | 'price_desc' | 'newest',
): Promise<StorefrontCard[]> {
  return listPublished(category, { woodId, sort });
}
```

- [ ] **Step 3: Create `src/app/tables/page.tsx`**

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryView } from '@/components/storefront/CategoryView';
import { listPublished, listWoods } from '@/lib/catalog';

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
```

- [ ] **Step 4: Create `src/app/chairs/page.tsx`** (identical shape, category="chair", title "Chairs", intro about seating)

```tsx
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
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(storefront): tables and chairs category pages with filter and sort"
```

---

## Task 5: Collections + search

**Files:** Create `src/app/collections/page.tsx`, `src/app/collections/[slug]/page.tsx`, `src/app/search/page.tsx`.

- [ ] **Step 1: `src/app/collections/page.tsx`** lists collections (name, description) linking to `/collections/[slug]`, using `listCollections()`. Header/Footer wrapper, centered serif heading "Collections".

```tsx
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { listCollections } from '@/lib/catalog';

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-16">
        <h1 className="serif mb-10 text-center text-5xl text-[var(--ink)]">Collections</h1>
        <ul className="grid gap-8 md:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.slug}`} className="block border border-[var(--line)] p-8 hover:bg-[var(--bone)]">
                <h2 className="serif text-2xl text-[var(--ink)]">{c.name}</h2>
                {c.description && <p className="mt-2 text-sm text-[var(--stone)]">{c.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: `src/app/collections/[slug]/page.tsx`** (await params; getCollectionBySlug; notFound if missing; listPublishedByCollection; grid of ProductCard).

```tsx
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getCollectionBySlug, listPublishedByCollection } from '@/lib/catalog';

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();
  const products = await listPublishedByCollection(collection.id);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-16">
        <h1 className="serif text-center text-5xl text-[var(--ink)]">{collection.name}</h1>
        {collection.description && <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--stone)]">{collection.description}</p>}
        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: `src/app/search/page.tsx`** reads `?q=`, calls `searchPublished(q)`, renders a grid. Use `searchParams` (a Promise in Next 16, await it).

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { searchPublished } from '@/lib/catalog';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? await searchPublished(q) : [];
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-16">
        <h1 className="serif text-3xl text-[var(--ink)]">Search</h1>
        <form action="/search" className="mt-4 max-w-md">
          <input name="q" defaultValue={q ?? ''} placeholder="Search the collection..." className="w-full border-b border-[var(--ink)] bg-transparent py-2 outline-none" />
        </form>
        {q && <p className="mt-6 text-sm text-[var(--stone)]">{results.length} result{results.length === 1 ? '' : 's'} for "{q}"</p>}
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(storefront): collections index, collection detail, and search"
```

---

## Task 6: Inquiry table + action

**Files:** Create `db/migrations/0006_inquiries.sql`, `src/lib/inquiries.ts`, `src/app/actions/inquiries.ts`; modify `package.json` db:reset.

- [ ] **Step 1: Write `db/migrations/0006_inquiries.sql`**

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  name text not null,
  email text not null,
  message text,
  configuration_json jsonb,
  status text not null default 'new' check (status in ('new','responded','closed')),
  created_at timestamptz not null default now()
);
create index inquiries_created_idx on inquiries(created_at desc);
```

- [ ] **Step 2: Add 0006 to db:reset chain in `package.json`** (after 0005).

- [ ] **Step 3: Create `src/lib/inquiries.ts`**

```ts
import { query } from '@/lib/db';

export async function createInquiry(args: {
  productId: string | null; name: string; email: string; message: string | null;
  configuration: Record<string, unknown> | null;
}): Promise<void> {
  await query(
    `insert into inquiries (product_id, name, email, message, configuration_json)
     values ($1, $2, $3, $4, $5)`,
    [args.productId, args.name, args.email, args.message, args.configuration ? JSON.stringify(args.configuration) : null],
  );
}
```

- [ ] **Step 4: Create `src/app/actions/inquiries.ts`**

```ts
'use server';

import { createInquiry } from '@/lib/inquiries';

export type InquiryState = { ok: true } | { error: string } | null;

export async function requestQuoteAction(
  productId: string | null,
  data: { name: string; email: string; message: string; configuration: Record<string, unknown> | null },
): Promise<InquiryState> {
  const name = data.name.trim();
  const email = data.email.trim();
  if (!name || !email) return { error: 'Name and email are required.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email.' };
  await createInquiry({ productId, name, email, message: data.message.trim() || null, configuration: data.configuration });
  return { ok: true };
}
```

- [ ] **Step 5: Apply migration, typecheck, commit**

```bash
npm run db:reset
npx tsc --noEmit
git add -A && git commit -m "feat(storefront): quote-request inquiry table, lib, and action"
```

---

## Task 7: Product detail page + configurator

**Files:** Create `src/components/storefront/ProductConfigurator.tsx`, `src/components/storefront/QuoteRequestForm.tsx`, `src/app/product/[slug]/page.tsx`.

- [ ] **Step 1: Create `src/components/storefront/QuoteRequestForm.tsx`** (client)

```tsx
'use client';

import { useState } from 'react';
import { requestQuoteAction } from '@/app/actions/inquiries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function QuoteRequestForm({ productId, configuration }: { productId: string; configuration: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [message, setMessage] = useState('');

  if (!open) return <Button className="w-full" onClick={() => setOpen(true)}>Request a Quote</Button>;
  if (done) return <p className="text-sm text-[var(--ink)]">Thank you. Our team will be in touch within two business days.</p>;

  async function submit() {
    setBusy(true); setError(null);
    const res = await requestQuoteAction(productId, { name, email, message, configuration });
    setBusy(false);
    if (res && 'error' in res) setError(res.error);
    else setDone(true);
  }
  return (
    <div className="space-y-3 border border-[var(--line)] p-4">
      <p className="text-sm text-[var(--stone)]">Tell us how to reach you and we will send a quote for this configuration.</p>
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Textarea placeholder="Anything we should know? (optional)" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Sending...' : 'Send request'}</Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/storefront/ProductConfigurator.tsx`** (client; gallery + options + live price + quote)

Port the right column of `docs/mockups/hw_pdp.html`. Selecting wood/finish/size recomputes the price with `computeConfiguredPriceCents`. Gallery: a main image + thumbnail row that swaps the main image. Renders `QuoteRequestForm` with the current configuration. Below the actions, render "Order a wood and finish sample" as static copy (sample ordering is a later phase).

```tsx
'use client';

import { useState } from 'react';
import { computeConfiguredPriceCents } from '@/lib/pricing';
import { formatPriceCents } from '@/lib/format';
import { QuoteRequestForm } from '@/components/storefront/QuoteRequestForm';
import type { StorefrontProduct } from '@/lib/types';

export function ProductConfigurator({ product }: { product: StorefrontProduct }) {
  const [activeImg, setActiveImg] = useState(product.images[0]?.url ?? null);
  const [woodId, setWoodId] = useState(product.woods[0]?.id ?? '');
  const [finishId, setFinishId] = useState(product.finishes[0]?.id ?? '');
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? '');

  const wood = product.woods.find((w) => w.id === woodId);
  const finish = product.finishes.find((f) => f.id === finishId);
  const size = product.sizes.find((s) => s.id === sizeId);
  const price = computeConfiguredPriceCents({
    base: product.base_price_cents,
    woodDelta: wood?.price_delta_cents ?? 0,
    finishDelta: finish?.price_delta_cents ?? 0,
    sizeDelta: size?.price_delta_cents ?? 0,
  });
  const configuration = {
    product: product.name, wood: wood?.name ?? null, finish: finish?.name ?? null,
    size: size?.label ?? null, price: formatPriceCents(price),
  };

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden bg-[var(--bone)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {activeImg && <img src={activeImg} alt={product.name} className="h-full w-full object-cover" />}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {product.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <button key={img.id} onClick={() => setActiveImg(img.url)} className={`h-16 w-16 overflow-hidden border ${activeImg === img.url ? 'border-[var(--walnut)]' : 'border-[var(--line)]'}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.collection_name && <div className="eyebrow">{product.collection_name}</div>}
        <h1 className="serif mt-2 text-4xl text-[var(--ink)]">{product.name}</h1>
        <p className="mt-3 text-xl text-[var(--ink)]">From {formatPriceCents(price)}</p>
        {(product.region || product.lead_time_weeks) && (
          <p className="mt-2 text-xs text-[var(--stone)]">
            {product.region ? `Handcrafted in ${product.region}` : ''}{product.region && product.lead_time_weeks ? ' . ' : ''}
            {product.lead_time_weeks ? `made to order in ${product.lead_time_weeks} weeks` : ''}
          </p>
        )}

        {product.woods.length > 0 && (
          <Field label={`Wood Species${wood ? ' . ' + wood.name : ''}`}>
            <div className="flex gap-3">
              {product.woods.map((w) => (
                <button key={w.id} onClick={() => setWoodId(w.id)} title={w.name}
                  className={`h-10 w-10 rounded-full border ${woodId === w.id ? 'ring-2 ring-[var(--walnut)] ring-offset-2' : 'border-black/10'}`} style={{ background: w.swatch_color }} />
              ))}
            </div>
          </Field>
        )}
        {product.finishes.length > 0 && (
          <Field label={`Finish${finish ? ' . ' + finish.name : ''}`}>
            <div className="flex flex-wrap gap-2">
              {product.finishes.map((f) => (
                <button key={f.id} onClick={() => setFinishId(f.id)} className={`border px-4 py-2 text-sm ${finishId === f.id ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>{f.name}</button>
              ))}
            </div>
          </Field>
        )}
        {product.sizes.length > 0 && (
          <Field label="Size">
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s.id} onClick={() => setSizeId(s.id)} className={`border px-4 py-2 text-center text-sm ${sizeId === s.id ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
                  {s.label}{s.seats ? <span className="block text-xs text-[var(--stone)]">Seats {s.seats}</span> : null}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="mt-8"><QuoteRequestForm productId={product.id} configuration={configuration} /></div>
        <p className="mt-4 text-sm text-[var(--walnut)]">Order a wood and finish sample . $5, credited to your order</p>
        {product.story && <p className="mt-8 border-t border-[var(--line)] pt-6 text-sm leading-relaxed text-[var(--ink)]">{product.story}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">{label}</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/product/[slug]/page.tsx`** (server; await params; getStorefrontProduct; notFound; render breadcrumb + ProductConfigurator + a "Complete the Room" related grid using `listPublished(product.category)` minus the current item, limited to 4)

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductConfigurator } from '@/components/storefront/ProductConfigurator';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStorefrontProduct, listPublished } from '@/lib/catalog';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();
  const related = (await listPublished(product.category, {})).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-10">
        <div className="mb-6 text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">
          <Link href="/">Home</Link> / <Link href={`/${product.category}s`} className="capitalize">{product.category}s</Link> / {product.name}
        </div>
        <ProductConfigurator product={product} />
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="serif mb-10 text-center text-3xl text-[var(--ink)]">Complete the Room</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit && npm run build
git add -A && git commit -m "feat(storefront): product detail page with live configurator and quote request"
```

---

## Task 8: End-to-end verification

No new files. Prove the storefront renders the catalog and the configurator/inquiry work.

- [ ] **Step 1: Reset, typecheck, build, test**

```bash
cd /Users/expando/github/hw
npm run db:reset && npx tsc --noEmit && npm run build && npx vitest run
```
Expected: all pass; 8 published products seeded.

- [ ] **Step 2: HTTP smoke (storefront is public, no auth)**

Start `npm run dev` backgrounded, wait, then confirm 200s and content:
```bash
echo "home: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"
echo "tables: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/tables)"
echo "chairs: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/chairs)"
echo "collections: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/collections)"
echo "pdp: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/product/the-homestead-table)"
echo "search: $(curl -s -o /dev/null -w '%{http_code}' 'http://localhost:3000/search?q=table')"
curl -s http://localhost:3000/tables | grep -o "The Homestead Table" | head -1
curl -s http://localhost:3000/product/the-homestead-table | grep -o "Request a Quote" | head -1
```
Expected: all 200, the product name appears on the Tables page, and the PDP shows the quote CTA.

- [ ] **Step 3: Inquiry round-trip**

With the dev server up, submit an inquiry via the data layer to confirm persistence (the action is exercised by the UI; this confirms the table):
```bash
psql -d hw -c "insert into inquiries (product_id, name, email, message) select id, 'Test Buyer', 'buyer@test.local', 'Interested' from products where slug='the-homestead-table';"
psql -d hw -tAc "select name, email, status from inquiries;"
psql -d hw -c "delete from inquiries where email='buyer@test.local';"
```
Expected: the row appears with status `new`. Stop the dev server.

- [ ] **Step 4: Commit (if anything changed)**

```bash
git add -A && git commit -m "test(storefront): phase 2 verification" || echo "nothing to commit"
```

---

## Done criteria

Phase 2 is complete when: the public storefront renders the seeded catalog with the warm premium design; visitors can browse Tables and Chairs (filter by wood, sort), open collections, search, and view a product detail page where selecting wood/finish/size updates the price live and a request-a-quote inquiry persists to the database; and `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass. The next plan covers Phase 3: customer accounts and the portal (favorites, sample requests, order tracking).
