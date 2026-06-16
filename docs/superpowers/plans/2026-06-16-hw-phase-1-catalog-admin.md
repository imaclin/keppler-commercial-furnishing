# HW Phase 1: Catalog + Admin Catalog Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give HW staff a working admin to build the catalog: create and edit products (with rich detail, wood/finish/size options, and image uploads), organize them into collections, and manage the wood species and finishes the configurator offers.

**Architecture:** Extends the Phase 0 foundation (Next.js 16, local Postgres via `pg`, custom session auth, staff-gated `/admin`). New catalog schema (collections, products, product_images, wood_species, finishes, and the join/option tables), a `src/lib/catalog.ts` data layer, a pure price helper, and staff-only admin CRUD pages under `/admin`. Image upload writes to local `public/uploads/` in dev (production swaps to Supabase Storage; the stored value is a URL/path so the swap is contained).

**Tech Stack:** Next.js 16 App Router, TypeScript, `pg`, Tailwind + shadcn, vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-hw-design.md` (data model section). v1 categories are `table` and `chair` only.

**Builds on Phase 0:** `src/lib/db.ts` (`query`, `queryOne`, `transaction`), `src/lib/auth.ts` (`requireStaff`), `src/lib/types.ts`, `src/lib/format.ts` (`slugify`, `formatPriceCents`), shadcn primitives, the seeded `admin@hw.test` / `hwadmin123` staff account.

---

## File Structure

```
hw/
  db/migrations/0003_catalog.sql        # collections, products, images, woods, finishes, options
  db/migrations/0004_catalog_seed.sql   # wood species + finishes seed
  db/reset.sql                          # MODIFY: add 0003 + 0004 to the chain
  package.json                          # MODIFY: db:reset includes 0003, 0004
  public/uploads/.gitkeep               # dev image storage (gitignored contents)
  .gitignore                            # MODIFY: ignore public/uploads/*
  src/lib/
    types.ts                            # MODIFY: catalog row types
    pricing.ts                          # NEW: computeConfiguredPriceCents (pure, tested)
    catalog.ts                          # NEW: catalog data layer
    upload.ts                           # NEW: saveUploadedImage (local fs in dev)
  src/app/admin/
    layout.tsx                          # NEW: admin shell (sidebar nav), staff-gated
    page.tsx                            # MODIFY: dashboard with counts
    woods/page.tsx                      # NEW: wood species + finishes management
    collections/page.tsx                # NEW: collections list + create
    products/page.tsx                   # NEW: products list
    products/new/page.tsx               # NEW: create product
    products/[id]/page.tsx              # NEW: edit product
  src/app/actions/
    catalog.ts                          # NEW: server actions (products, collections, woods, finishes)
    upload.ts                           # NEW: image upload action
  src/components/admin/
    AdminSidebar.tsx                    # NEW
    ProductForm.tsx                     # NEW: shared create/edit form (client)
  test/
    pricing.test.ts                     # NEW
```

---

## Task 1: Catalog schema + seed

**Files:** Create `db/migrations/0003_catalog.sql`, `db/migrations/0004_catalog_seed.sql`; modify `db/reset.sql`, `package.json`.

- [ ] **Step 1: Write `db/migrations/0003_catalog.sql`**

```sql
create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  hero_image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('table','chair')),
  collection_id uuid references collections(id) on delete set null,
  short_description text,
  story text,
  base_price_cents int not null default 0,
  lead_time_weeks int,
  region text,
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_status_idx on products(category, status);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  type text not null default 'on_white' check (type in ('on_white','lifestyle','detail')),
  sort_order int not null default 0
);
create index product_images_product_idx on product_images(product_id, sort_order);

create table wood_species (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  swatch_color text not null,
  sort_order int not null default 0
);

create table finishes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  swatch_color text not null,
  sort_order int not null default 0
);

create table product_woods (
  product_id uuid not null references products(id) on delete cascade,
  wood_id uuid not null references wood_species(id) on delete cascade,
  price_delta_cents int not null default 0,
  primary key (product_id, wood_id)
);

create table product_finishes (
  product_id uuid not null references products(id) on delete cascade,
  finish_id uuid not null references finishes(id) on delete cascade,
  price_delta_cents int not null default 0,
  primary key (product_id, finish_id)
);

create table product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  seats int,
  price_delta_cents int not null default 0,
  sort_order int not null default 0
);
create index product_sizes_product_idx on product_sizes(product_id, sort_order);
```

- [ ] **Step 2: Write `db/migrations/0004_catalog_seed.sql`**

```sql
insert into wood_species (name, swatch_color, sort_order) values
  ('Oak', '#caa472', 1), ('Walnut', '#6b4f3a', 2), ('Cherry', '#8a4b34', 3), ('Maple', '#d8c19a', 4)
on conflict (name) do nothing;

insert into finishes (name, swatch_color, sort_order) values
  ('Natural Oil', '#caa472', 1), ('Honey', '#b8956a', 2), ('Chestnut', '#7a5230', 3), ('Espresso', '#3a2e24', 4)
on conflict (name) do nothing;
```

- [ ] **Step 3: Update `db/reset.sql` chain and `package.json` db:reset**

Modify the `db:reset` script in `package.json` to apply, in order: `db/reset.sql`, `0001_auth.sql`, `0002_seed.sql`, `0003_catalog.sql`, `0004_catalog_seed.sql`:

```json
"db:reset": "psql -d hw -v ON_ERROR_STOP=1 -f db/reset.sql -f db/migrations/0001_auth.sql -f db/migrations/0002_seed.sql -f db/migrations/0003_catalog.sql -f db/migrations/0004_catalog_seed.sql"
```

- [ ] **Step 4: Apply and verify**

```bash
npm run db:reset
psql -d hw -tAc "select count(*) from wood_species; select count(*) from finishes;"
```
Expected: `4` and `4`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(catalog): schema (products, collections, images, woods, finishes, options) + seed"
```

---

## Task 2: Catalog types + pure price helper (TDD)

**Files:** Modify `src/lib/types.ts`; create `src/lib/pricing.ts`, `test/pricing.test.ts`.

- [ ] **Step 1: Add catalog types to `src/lib/types.ts`** (append)

```ts
export type ProductCategory = 'table' | 'chair';
export type ProductStatus = 'draft' | 'published';
export type ImageType = 'on_white' | 'lifestyle' | 'detail';

export type Collection = {
  id: string; slug: string; name: string; description: string | null;
  hero_image_url: string | null; sort_order: number; created_at: string;
};

export type WoodSpecies = { id: string; name: string; swatch_color: string; sort_order: number };
export type Finish = { id: string; name: string; swatch_color: string; sort_order: number };

export type Product = {
  id: string; slug: string; name: string; category: ProductCategory;
  collection_id: string | null; short_description: string | null; story: string | null;
  base_price_cents: number; lead_time_weeks: number | null; region: string | null;
  status: ProductStatus; featured: boolean; created_at: string; updated_at: string;
};

export type ProductImage = { id: string; product_id: string; url: string; type: ImageType; sort_order: number };
export type ProductSize = { id: string; product_id: string; label: string; seats: number | null; price_delta_cents: number; sort_order: number };
```

- [ ] **Step 2: Write the failing test `test/pricing.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeConfiguredPriceCents } from '@/lib/pricing';

describe('computeConfiguredPriceCents', () => {
  it('sums base plus selected option deltas', () => {
    expect(computeConfiguredPriceCents({ base: 320000, woodDelta: 0, finishDelta: 0, sizeDelta: 40000 })).toBe(360000);
  });
  it('handles all deltas and a walnut upcharge', () => {
    expect(computeConfiguredPriceCents({ base: 320000, woodDelta: 50000, finishDelta: 10000, sizeDelta: 80000 })).toBe(460000);
  });
  it('never returns below zero', () => {
    expect(computeConfiguredPriceCents({ base: 0, woodDelta: -100, finishDelta: 0, sizeDelta: 0 })).toBe(0);
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npx vitest run test/pricing.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/pricing'".

- [ ] **Step 4: Implement `src/lib/pricing.ts`**

```ts
export function computeConfiguredPriceCents(args: {
  base: number; woodDelta: number; finishDelta: number; sizeDelta: number;
}): number {
  const total = args.base + args.woodDelta + args.finishDelta + args.sizeDelta;
  return Math.max(0, total);
}
```

- [ ] **Step 5: Run to verify pass, then commit**

```bash
npx vitest run test/pricing.test.ts
git add -A && git commit -m "feat(catalog): catalog row types and configured-price helper (TDD)"
```

---

## Task 3: Catalog data layer

**Files:** Create `src/lib/catalog.ts`.

- [ ] **Step 1: Implement `src/lib/catalog.ts`**

```ts
import { query, queryOne, transaction } from '@/lib/db';
import type { Collection, WoodSpecies, Finish, Product, ProductImage, ProductSize } from '@/lib/types';

// ---------- reference data ----------
export async function listWoods(): Promise<WoodSpecies[]> {
  return query<WoodSpecies>('select * from wood_species order by sort_order, name');
}
export async function listFinishes(): Promise<Finish[]> {
  return query<Finish>('select * from finishes order by sort_order, name');
}
export async function createWood(name: string, swatchColor: string): Promise<void> {
  await query('insert into wood_species (name, swatch_color) values ($1, $2) on conflict (name) do nothing', [name, swatchColor]);
}
export async function createFinish(name: string, swatchColor: string): Promise<void> {
  await query('insert into finishes (name, swatch_color) values ($1, $2) on conflict (name) do nothing', [name, swatchColor]);
}

// ---------- collections ----------
export async function listCollections(): Promise<Collection[]> {
  return query<Collection>('select * from collections order by sort_order, name');
}
export async function createCollection(args: { slug: string; name: string; description: string | null }): Promise<void> {
  await query('insert into collections (slug, name, description) values ($1, $2, $3)', [args.slug, args.name, args.description]);
}

// ---------- products ----------
export async function listProducts(): Promise<(Product & { image_url: string | null })[]> {
  return query<Product & { image_url: string | null }>(
    `select p.*, (select url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url
       from products p order by p.created_at desc`,
  );
}

export type ProductDetail = Product & {
  images: ProductImage[];
  sizes: ProductSize[];
  woodIds: { wood_id: string; price_delta_cents: number }[];
  finishIds: { finish_id: string; price_delta_cents: number }[];
};

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const product = await queryOne<Product>('select * from products where id = $1', [id]);
  if (!product) return null;
  const [images, sizes, woodIds, finishIds] = await Promise.all([
    query<ProductImage>('select * from product_images where product_id = $1 order by sort_order', [id]),
    query<ProductSize>('select * from product_sizes where product_id = $1 order by sort_order', [id]),
    query<{ wood_id: string; price_delta_cents: number }>('select wood_id, price_delta_cents from product_woods where product_id = $1', [id]),
    query<{ finish_id: string; price_delta_cents: number }>('select finish_id, price_delta_cents from product_finishes where product_id = $1', [id]),
  ]);
  return { ...product, images, sizes, woodIds, finishIds };
}

export type ProductInput = {
  slug: string; name: string; category: 'table' | 'chair'; collection_id: string | null;
  short_description: string | null; story: string | null; base_price_cents: number;
  lead_time_weeks: number | null; region: string | null; status: 'draft' | 'published'; featured: boolean;
  woodIds: string[]; finishIds: string[];
  sizes: { label: string; seats: number | null; price_delta_cents: number }[];
  imageUrls: string[];
};

export async function createProduct(input: ProductInput): Promise<string> {
  return transaction(async (client) => {
    const { rows } = await client.query(
      `insert into products (slug, name, category, collection_id, short_description, story,
         base_price_cents, lead_time_weeks, region, status, featured)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [input.slug, input.name, input.category, input.collection_id, input.short_description, input.story,
       input.base_price_cents, input.lead_time_weeks, input.region, input.status, input.featured],
    );
    const id = rows[0].id as string;
    await writeProductRelations(client, id, input);
    return id;
  });
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      `update products set slug=$2, name=$3, category=$4, collection_id=$5, short_description=$6, story=$7,
         base_price_cents=$8, lead_time_weeks=$9, region=$10, status=$11, featured=$12, updated_at=now()
       where id=$1`,
      [id, input.slug, input.name, input.category, input.collection_id, input.short_description, input.story,
       input.base_price_cents, input.lead_time_weeks, input.region, input.status, input.featured],
    );
    // Replace relations wholesale (simplest correct approach for an admin form save).
    await client.query('delete from product_woods where product_id = $1', [id]);
    await client.query('delete from product_finishes where product_id = $1', [id]);
    await client.query('delete from product_sizes where product_id = $1', [id]);
    await client.query('delete from product_images where product_id = $1', [id]);
    await writeProductRelations(client, id, input);
  });
}

async function writeProductRelations(client: import('pg').PoolClient, id: string, input: ProductInput): Promise<void> {
  for (const woodId of input.woodIds) {
    await client.query('insert into product_woods (product_id, wood_id, price_delta_cents) values ($1,$2,0) on conflict do nothing', [id, woodId]);
  }
  for (const finishId of input.finishIds) {
    await client.query('insert into product_finishes (product_id, finish_id, price_delta_cents) values ($1,$2,0) on conflict do nothing', [id, finishId]);
  }
  let s = 0;
  for (const size of input.sizes) {
    await client.query('insert into product_sizes (product_id, label, seats, price_delta_cents, sort_order) values ($1,$2,$3,$4,$5)',
      [id, size.label, size.seats, size.price_delta_cents, s++]);
  }
  let i = 0;
  for (const url of input.imageUrls) {
    await client.query('insert into product_images (product_id, url, type, sort_order) values ($1,$2,$3,$4)', [id, url, 'on_white', i++]);
  }
}

export async function catalogCounts(): Promise<{ products: number; published: number; collections: number }> {
  const row = await queryOne<{ products: string; published: string; collections: string }>(
    `select (select count(*) from products)::text as products,
            (select count(*) from products where status='published')::text as published,
            (select count(*) from collections)::text as collections`,
  );
  return { products: Number(row?.products ?? 0), published: Number(row?.published ?? 0), collections: Number(row?.collections ?? 0) };
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(catalog): data layer (products, collections, woods, finishes, options)"
```

---

## Task 4: Image upload (local dev storage)

**Files:** Create `src/lib/upload.ts`, `src/app/actions/upload.ts`, `public/uploads/.gitkeep`; modify `.gitignore`.

- [ ] **Step 1: Ignore uploaded files but keep the dir**

Add to `.gitignore`:
```
/public/uploads/*
!/public/uploads/.gitkeep
```
Create an empty file `public/uploads/.gitkeep`.

- [ ] **Step 2: Implement `src/lib/upload.ts`**

```ts
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Dev: persist to public/uploads and return a public path. Production swaps this
// for Supabase Storage; callers only depend on the returned URL string.
export async function saveUploadedImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED.has(file.type)) return { error: 'Only JPEG, PNG, or WebP images are allowed.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Images must be under 8 MB.' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}` };
}
```

- [ ] **Step 3: Implement `src/app/actions/upload.ts`**

```ts
'use server';

import { requireStaff } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/upload';

export async function uploadImageAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireStaff();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided.' };
  return saveUploadedImage(file);
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(catalog): staff image upload to local storage (dev)"
```

---

## Task 5: Admin shell (sidebar) + dashboard

**Files:** Create `src/components/admin/AdminSidebar.tsx`, `src/app/admin/layout.tsx`; modify `src/app/admin/page.tsx`.

- [ ] **Step 1: Create `src/components/admin/AdminSidebar.tsx`**

```tsx
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/woods', label: 'Wood & Finishes' },
];

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-[248px] flex-col bg-[var(--espresso)] py-8 text-[#cdbfaf]">
      <div className="serif px-7 text-center text-3xl font-semibold tracking-[0.2em] text-[#fffdfa]">HW</div>
      <div className="mb-8 text-center text-[8px] uppercase tracking-[0.4em] text-[#8a7d6c]">Admin</div>
      <nav className="flex flex-col">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="px-7 py-2.5 text-sm text-[#c9bca9] hover:text-[#fffdfa]">{n.label}</Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 px-7 pt-4 text-xs text-[#c9bca9]">{email}</div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/layout.tsx`**

```tsx
import { requireStaff } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <AdminSidebar email={profile.email} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/admin/page.tsx`** (the layout now gates, so the page can focus on content)

```tsx
import Link from 'next/link';
import { catalogCounts } from '@/lib/catalog';

export default async function AdminDashboard() {
  const counts = await catalogCounts();
  const stats = [
    { label: 'Products', value: counts.products },
    { label: 'Published', value: counts.published },
    { label: 'Collections', value: counts.collections },
  ];
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Dashboard</h1>
      <div className="mt-8 grid max-w-3xl grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="border border-[var(--line)] bg-[var(--paper)] p-6">
            <div className="eyebrow">{s.label}</div>
            <div className="serif mt-2 text-4xl text-[var(--ink)]">{s.value}</div>
          </div>
        ))}
      </div>
      <Link href="/admin/products/new" className="mt-8 inline-block bg-[var(--espresso)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#fffdfa]">+ New Product</Link>
    </main>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(admin): staff-gated admin shell with sidebar and dashboard counts"
```

---

## Task 6: Wood & Finishes management

**Files:** Create `src/app/admin/woods/page.tsx`; add wood/finish actions to `src/app/actions/catalog.ts`.

- [ ] **Step 1: Create `src/app/actions/catalog.ts` with wood/finish actions**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { createWood, createFinish } from '@/lib/catalog';

export async function addWoodAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const color = String(formData.get('swatch_color') ?? '').trim() || '#6b4f3a';
  if (name) await createWood(name, color);
  revalidatePath('/admin/woods');
}

export async function addFinishAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const color = String(formData.get('swatch_color') ?? '').trim() || '#6b4f3a';
  if (name) await createFinish(name, color);
  revalidatePath('/admin/woods');
}
```

- [ ] **Step 2: Create `src/app/admin/woods/page.tsx`**

```tsx
import { listWoods, listFinishes } from '@/lib/catalog';
import { addWoodAction, addFinishAction } from '@/app/actions/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function WoodsPage() {
  const [woods, finishes] = await Promise.all([listWoods(), listFinishes()]);
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Wood &amp; Finishes</h1>
      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-10">
        <section>
          <div className="eyebrow mb-3">Wood Species</div>
          <ul className="mb-4 space-y-2">
            {woods.map((w) => (
              <li key={w.id} className="flex items-center gap-3 text-sm">
                <span className="inline-block h-4 w-4 rounded-full border border-black/10" style={{ background: w.swatch_color }} />
                {w.name}
              </li>
            ))}
          </ul>
          <form action={addWoodAction} className="flex gap-2">
            <Input name="name" placeholder="Name" required />
            <Input name="swatch_color" placeholder="#color" defaultValue="#6b4f3a" className="w-28" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </section>
        <section>
          <div className="eyebrow mb-3">Finishes</div>
          <ul className="mb-4 space-y-2">
            {finishes.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className="inline-block h-4 w-4 rounded-full border border-black/10" style={{ background: f.swatch_color }} />
                {f.name}
              </li>
            ))}
          </ul>
          <form action={addFinishAction} className="flex gap-2">
            <Input name="name" placeholder="Name" required />
            <Input name="swatch_color" placeholder="#color" defaultValue="#6b4f3a" className="w-28" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(admin): wood species and finishes management"
```

---

## Task 7: Collections management

**Files:** Create `src/app/admin/collections/page.tsx`; add collection action to `src/app/actions/catalog.ts`.

- [ ] **Step 1: Append the collection action to `src/app/actions/catalog.ts`**

```ts
import { createCollection, listCollections } from '@/lib/catalog';
import { slugify } from '@/lib/format';

export async function addCollectionAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (name) await createCollection({ slug: slugify(name), name, description });
  revalidatePath('/admin/collections');
}
```
(Merge the new imports into the existing import block; do not duplicate the `'use server'` line or the `requireStaff`/`revalidatePath` imports.)

- [ ] **Step 2: Create `src/app/admin/collections/page.tsx`**

```tsx
import { listCollections } from '@/lib/catalog';
import { addCollectionAction } from '@/app/actions/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Collections</h1>
      <Card className="mt-8 max-w-xl p-5">
        <form action={addCollectionAction} className="space-y-3">
          <Input name="name" placeholder="Collection name" required />
          <Input name="description" placeholder="Short description (optional)" />
          <Button type="submit">Add collection</Button>
        </form>
      </Card>
      <ul className="mt-8 max-w-xl space-y-2">
        {collections.map((c) => (
          <li key={c.id} className="border-b border-[var(--line)] py-3">
            <div className="font-medium text-[var(--ink)]">{c.name}</div>
            {c.description && <div className="text-sm text-[var(--stone)]">{c.description}</div>}
          </li>
        ))}
        {collections.length === 0 && <li className="text-sm text-[var(--stone)]">No collections yet.</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(admin): collections management"
```

---

## Task 8: Products list

**Files:** Create `src/app/admin/products/page.tsx`.

- [ ] **Step 1: Create `src/app/admin/products/page.tsx`**

```tsx
import Link from 'next/link';
import { listProducts } from '@/lib/catalog';
import { formatPriceCents } from '@/lib/format';

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
          <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
            <th className="py-3">Name</th><th>Category</th><th>Base Price</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-[var(--line)]">
              <td className="py-3"><Link href={`/admin/products/${p.id}`} className="font-medium text-[var(--ink)] hover:underline">{p.name}</Link></td>
              <td className="capitalize">{p.category}</td>
              <td>{formatPriceCents(p.base_price_cents)}</td>
              <td><span className="capitalize text-[var(--stone)]">{p.status}</span></td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan={4} className="py-6 text-[var(--stone)]">No products yet. Create your first piece.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build
git add -A && git commit -m "feat(admin): products list"
```

---

## Task 9: Product create/edit form

**Files:** Create `src/components/admin/ProductForm.tsx`, `src/app/admin/products/new/page.tsx`, `src/app/admin/products/[id]/page.tsx`; add product save action to `src/app/actions/catalog.ts`.

- [ ] **Step 1: Add the product save action to `src/app/actions/catalog.ts`** (append; reuse existing imports, add the ones below)

```ts
import { redirect } from 'next/navigation';
import { createProduct, updateProduct, type ProductInput } from '@/lib/catalog';

export type SaveProductState = { error: string } | null;

export async function saveProductAction(
  productId: string | null,
  input: ProductInput,
): Promise<SaveProductState> {
  await requireStaff();
  if (!input.name.trim()) return { error: 'Name is required.' };
  if (!input.slug.trim()) return { error: 'Slug is required.' };
  if (productId) await updateProduct(productId, input);
  else await createProduct(input);
  redirect('/admin/products');
}
```
Note: this action takes a typed `ProductInput` object (not raw FormData) because the form assembles the woods/finishes/sizes/images client-side. `redirect` is called outside any try/catch.

- [ ] **Step 2: Create `src/components/admin/ProductForm.tsx`** (client component)

```tsx
'use client';

import { useState } from 'react';
import { uploadImageAction } from '@/app/actions/upload';
import { saveProductAction, type SaveProductState } from '@/app/actions/catalog';
import { slugify } from '@/lib/format';
import type { Collection, WoodSpecies, Finish } from '@/lib/types';
import type { ProductInput, ProductDetail } from '@/lib/catalog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type SizeRow = { label: string; seats: string; price_delta: string };

export function ProductForm({
  product, collections, woods, finishes,
}: {
  product: ProductDetail | null;
  collections: Collection[];
  woods: WoodSpecies[];
  finishes: Finish[];
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [category, setCategory] = useState<'table' | 'chair'>(product?.category ?? 'table');
  const [collectionId, setCollectionId] = useState(product?.collection_id ?? '');
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? '');
  const [story, setStory] = useState(product?.story ?? '');
  const [basePrice, setBasePrice] = useState(product ? String(product.base_price_cents / 100) : '');
  const [leadTime, setLeadTime] = useState(product?.lead_time_weeks ? String(product.lead_time_weeks) : '');
  const [region, setRegion] = useState(product?.region ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(product?.status ?? 'draft');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [woodIds, setWoodIds] = useState<string[]>(product?.woodIds.map((w) => w.wood_id) ?? []);
  const [finishIds, setFinishIds] = useState<string[]>(product?.finishIds.map((f) => f.finish_id) ?? []);
  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes.map((s) => ({ label: s.label, seats: s.seats ? String(s.seats) : '', price_delta: String(s.price_delta_cents / 100) })) ?? [],
  );
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadImageAction(fd);
    if ('error' in res) setError(res.error);
    else setImageUrls((prev) => [...prev, res.url]);
    e.target.value = '';
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const input: ProductInput = {
      slug: slug.trim() || slugify(name),
      name: name.trim(), category, collection_id: collectionId || null,
      short_description: shortDesc.trim() || null, story: story.trim() || null,
      base_price_cents: Math.round(parseFloat(basePrice || '0') * 100),
      lead_time_weeks: leadTime ? parseInt(leadTime, 10) : null,
      region: region.trim() || null, status, featured,
      woodIds, finishIds,
      sizes: sizes.filter((s) => s.label.trim()).map((s) => ({
        label: s.label.trim(), seats: s.seats ? parseInt(s.seats, 10) : null,
        price_delta_cents: Math.round(parseFloat(s.price_delta || '0') * 100),
      })),
      imageUrls,
    };
    const res: SaveProductState = await saveProductAction(product?.id ?? null, input);
    if (res && 'error' in res) { setError(res.error); setBusy(false); }
    // on success the action redirects; no need to reset busy
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!product) setSlug(slugify(e.target.value)); }} /></div>
        <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value as 'table' | 'chair')} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
            <option value="table">Table</option><option value="chair">Chair</option>
          </select>
        </div>
        <div className="space-y-2"><Label>Collection</Label>
          <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
            <option value="">None</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Base price ($)</Label><Input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} inputMode="decimal" /></div>
      </div>
      <div className="space-y-2"><Label>Short description</Label><Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} /></div>
      <div className="space-y-2"><Label>Story</Label><Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={3} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Lead time (weeks)</Label><Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} inputMode="numeric" /></div>
        <div className="space-y-2"><Label>Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Holmes County, Ohio" /></div>
      </div>

      <div className="space-y-2"><Label>Wood species offered</Label>
        <div className="flex flex-wrap gap-2">
          {woods.map((w) => (
            <button type="button" key={w.id} onClick={() => toggle(woodIds, setWoodIds, w.id)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${woodIds.includes(w.id) ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
              <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: w.swatch_color }} />{w.name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2"><Label>Finishes offered</Label>
        <div className="flex flex-wrap gap-2">
          {finishes.map((f) => (
            <button type="button" key={f.id} onClick={() => toggle(finishIds, setFinishIds, f.id)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${finishIds.includes(f.id) ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
              <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: f.swatch_color }} />{f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2"><Label>Sizes</Label>
        {sizes.map((s, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <Input placeholder='Label e.g. 84"' value={s.label} onChange={(e) => setSizes((a) => a.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <Input placeholder="Seats" className="w-24" value={s.seats} onChange={(e) => setSizes((a) => a.map((x, j) => j === i ? { ...x, seats: e.target.value } : x))} />
            <Input placeholder="+$ delta" className="w-28" value={s.price_delta} onChange={(e) => setSizes((a) => a.map((x, j) => j === i ? { ...x, price_delta: e.target.value } : x))} />
            <button type="button" className="text-sm text-red-600" onClick={() => setSizes((a) => a.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setSizes((a) => [...a, { label: '', seats: '', price_delta: '0' }])}>+ Add size</Button>
      </div>

      <div className="space-y-2"><Label>Images</Label>
        <div className="mb-2 flex flex-wrap gap-3">
          {imageUrls.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-24 w-24 object-cover border border-[var(--line)]" />
              <button type="button" onClick={() => setImageUrls((p) => p.filter((x) => x !== u))} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[var(--espresso)] text-xs text-white">x</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
        <div className="flex items-center gap-2 text-sm">Status:
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="h-9 border border-[var(--line)] px-2">
            <option value="draft">Draft</option><option value="published">Published</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save product'}</Button>
    </div>
  );
}
```

- [ ] **Step 3: Add the Textarea primitive if missing**

```bash
cd /Users/expando/github/hw && [ -f src/components/ui/textarea.tsx ] || npx shadcn@latest add textarea
```

- [ ] **Step 4: Create `src/app/admin/products/new/page.tsx`**

```tsx
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
```

- [ ] **Step 5: Create `src/app/admin/products/[id]/page.tsx`**

```tsx
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
```

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit && npm run build
git add -A && git commit -m "feat(admin): product create/edit form with options and image upload"
```

---

## Task 10: End-to-end verification

No new files. Prove a staff member can build a full product through the admin.

- [ ] **Step 1: Reset, typecheck, build, test**

```bash
cd /Users/expando/github/hw
npm run db:reset && npx tsc --noEmit && npm run build && npx vitest run
```
Expected: all pass (vitest now includes pricing tests: 8 total).

- [ ] **Step 2: Manual flow check**

```bash
npm run dev
```
- Sign in at `/login` as `admin@hw.test` / `hwadmin123`.
- Visit `/admin` and confirm the dashboard shows counts (0 products).
- Visit `/admin/woods` and confirm the 4 seeded woods and 4 finishes appear; add one finish and confirm it persists.
- Visit `/admin/collections`, add a collection.
- Visit `/admin/products/new`, fill the form (name, base price, pick woods/finishes, add a size, upload an image), set Published, Save.
- Confirm redirect to `/admin/products` and the new product appears with its price.
- Click the product, confirm the edit form repopulates all fields, woods/finishes selected, the size, and the uploaded image.

Scripted DB confirmation after creating one product:
```bash
psql -d hw -tAc "select name, status, base_price_cents from products;"
psql -d hw -tAc "select count(*) from product_woods; select count(*) from product_images;"
```
Expected: the product row, and non-zero option/image counts. Stop the dev server when done.

- [ ] **Step 3: Final commit (if any verification docs changed)**

```bash
git add -A && git commit -m "test(catalog): phase 1 verification" || echo "nothing to commit"
```

---

## Done criteria

Phase 1 is complete when: a signed-in staff member can manage wood species and finishes, create collections, and create and edit products with multiple wood/finish options, sizes, and uploaded images, with everything persisting to Postgres; and `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass. The next plan covers Phase 2: the public storefront (home, category, product detail with the live configurator) that renders this catalog.
