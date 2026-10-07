import { query, queryOne, run, batch, newId, NOW, type Statement } from '@/lib/db';
import type { Collection, WoodSpecies, Finish, Product, ProductCategory, ProductImage, ProductSize, StorefrontCard, StorefrontProduct, ConfigOption } from '@/lib/types';

// ---------- reference data ----------
export async function listWoods(): Promise<WoodSpecies[]> {
  return query<WoodSpecies>('select * from wood_species order by sort_order, name');
}
export async function listFinishes(): Promise<Finish[]> {
  return query<Finish>('select * from finishes order by sort_order, name');
}
export async function createWood(name: string, swatchColor: string): Promise<void> {
  await run('insert into wood_species (name, swatch_color) values ($1, $2) on conflict (name) do nothing', [name, swatchColor]);
}
export async function createFinish(name: string, swatchColor: string): Promise<void> {
  await run('insert into finishes (name, swatch_color) values ($1, $2) on conflict (name) do nothing', [name, swatchColor]);
}

// ---------- collections ----------
export async function listCollections(): Promise<Collection[]> {
  return query<Collection>('select * from collections order by sort_order, name');
}

export type CollectionWithCount = Collection & { product_count: number };
export async function listCollectionsWithCounts(): Promise<CollectionWithCount[]> {
  return query<CollectionWithCount>(
    `select c.*, (select count(*) from products p where p.collection_id = c.id) as product_count
       from collections c order by c.sort_order, c.name`,
  );
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  return queryOne<Collection>('select * from collections where id = $1', [id]);
}

export async function createCollection(args: { slug: string; name: string; description: string | null; heroImageUrl?: string | null }): Promise<void> {
  await run(
    'insert into collections (slug, name, description, hero_image_url) values ($1, $2, $3, $4) on conflict (slug) do nothing',
    [args.slug, args.name, args.description, args.heroImageUrl ?? null],
  );
}

/** Assign or unassign a product to a collection (products belong to one collection). */
export async function setProductCollection(productId: string, collectionId: string | null): Promise<void> {
  await run(`update products set collection_id = $2, updated_at = ${NOW} where id = $1`, [productId, collectionId]);
}

// ---------- products ----------
export async function listProducts(
  opts: { q?: string; category?: ProductCategory; status?: 'draft' | 'published' } = {},
): Promise<(Product & { image_url: string | null })[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.q) { params.push(`%${opts.q}%`); where.push(`p.name like $${params.length}`); }
  if (opts.category) { params.push(opts.category); where.push(`p.category = $${params.length}`); }
  if (opts.status) { params.push(opts.status); where.push(`p.status = $${params.length}`); }
  const clause = where.length ? `where ${where.join(' and ')}` : '';
  return query<Product & { image_url: string | null }>(
    `select p.*, (select url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url
       from products p ${clause} order by p.created_at desc`,
    params,
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
  slug: string; name: string; category: ProductCategory; collection_id: string | null;
  short_description: string | null; story: string | null; base_price_cents: number;
  lead_time_weeks: number | null; region: string | null; status: 'draft' | 'published'; featured: boolean;
  length_in: number | null; width_in: number | null; height_in: number | null; weight_lb: number | null;
  woodIds: string[]; finishIds: string[];
  sizes: { label: string; seats: number | null; price_delta_cents: number }[];
  imageUrls: string[];
};

// The product row and all its relations are written in one atomic batch. The
// id is drawn up front so the relation rows can reference it in the same batch.
export async function createProduct(input: ProductInput): Promise<string> {
  const id = newId();
  await batch([
    {
      sql: `insert into products (id, slug, name, category, collection_id, short_description, story,
              base_price_cents, lead_time_weeks, region, status, featured,
              length_in, width_in, height_in, weight_lb)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      params: [id, input.slug, input.name, input.category, input.collection_id, input.short_description, input.story,
        input.base_price_cents, input.lead_time_weeks, input.region, input.status, input.featured,
        input.length_in, input.width_in, input.height_in, input.weight_lb],
    },
    ...productRelationStatements(id, input),
  ]);
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await batch([
    {
      sql: `update products set slug=$2, name=$3, category=$4, collection_id=$5, short_description=$6, story=$7,
              base_price_cents=$8, lead_time_weeks=$9, region=$10, status=$11, featured=$12,
              length_in=$13, width_in=$14, height_in=$15, weight_lb=$16, updated_at=${NOW}
            where id=$1`,
      params: [id, input.slug, input.name, input.category, input.collection_id, input.short_description, input.story,
        input.base_price_cents, input.lead_time_weeks, input.region, input.status, input.featured,
        input.length_in, input.width_in, input.height_in, input.weight_lb],
    },
    // Replace relations wholesale (simplest correct approach for an admin form save).
    { sql: 'delete from product_woods where product_id = $1', params: [id] },
    { sql: 'delete from product_finishes where product_id = $1', params: [id] },
    { sql: 'delete from product_sizes where product_id = $1', params: [id] },
    { sql: 'delete from product_images where product_id = $1', params: [id] },
    ...productRelationStatements(id, input),
  ]);
}

function productRelationStatements(id: string, input: ProductInput): Statement[] {
  const out: Statement[] = [];
  for (const woodId of input.woodIds) {
    out.push({ sql: 'insert into product_woods (product_id, wood_id, price_delta_cents) values ($1,$2,0) on conflict do nothing', params: [id, woodId] });
  }
  for (const finishId of input.finishIds) {
    out.push({ sql: 'insert into product_finishes (product_id, finish_id, price_delta_cents) values ($1,$2,0) on conflict do nothing', params: [id, finishId] });
  }
  input.sizes.forEach((size, s) => {
    out.push({ sql: 'insert into product_sizes (product_id, label, seats, price_delta_cents, sort_order) values ($1,$2,$3,$4,$5)', params: [id, size.label, size.seats, size.price_delta_cents, s] });
  });
  input.imageUrls.forEach((url, i) => {
    out.push({ sql: 'insert into product_images (product_id, url, type, sort_order) values ($1,$2,$3,$4)', params: [id, url, 'on_white', i] });
  });
  return out;
}

export async function catalogCounts(): Promise<{ products: number; published: number; collections: number }> {
  const row = await queryOne<{ products: number; published: number; collections: number }>(
    `select (select count(*) from products) as products,
            (select count(*) from products where status='published') as published,
            (select count(*) from collections) as collections`,
  );
  return { products: Number(row?.products ?? 0), published: Number(row?.published ?? 0), collections: Number(row?.collections ?? 0) };
}

// ---------- storefront read queries ----------

// wood_swatches comes back as a JSON array in text; lib/db.ts parses it.
const CARD_SELECT = `
  select p.*,
    (select url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url,
    coalesce((select json_group_array(swatch_color) from (
      select w.swatch_color from product_woods pw join wood_species w on w.id = pw.wood_id
      where pw.product_id = p.id order by w.sort_order
    )), '[]') as wood_swatches
  from products p
  where p.status = 'published'`;

export async function listPublished(
  category: ProductCategory | null,
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
  return query<StorefrontCard>(`${CARD_SELECT} and p.featured = 1 order by p.created_at desc limit ${limit}`);
}

// The public only ever sees published products. includeDrafts is for staff, so a
// product can be checked on its real page before it goes live; the caller is
// responsible for having verified the viewer is staff.
export async function getStorefrontProduct(
  slug: string,
  opts: { includeDrafts?: boolean } = {},
): Promise<StorefrontProduct | null> {
  const product = await queryOne<StorefrontProduct>(
    `select p.*, c.name as collection_name from products p
       left join collections c on c.id = p.collection_id
      where p.slug = $1 ${opts.includeDrafts ? '' : "and p.status = 'published'"}`,
    [slug],
  );
  if (!product) return null;
  const [images, woods, finishes, sizes, spin] = await Promise.all([
    query<ProductImage>('select * from product_images where product_id = $1 order by sort_order', [product.id]),
    query<ConfigOption>(
      `select w.id, w.name, w.swatch_color, pw.price_delta_cents from product_woods pw
         join wood_species w on w.id = pw.wood_id where pw.product_id = $1 order by w.sort_order`, [product.id]),
    query<ConfigOption>(
      `select f.id, f.name, f.swatch_color, pf.price_delta_cents from product_finishes pf
         join finishes f on f.id = pf.finish_id where pf.product_id = $1 order by f.sort_order`, [product.id]),
    query<ProductSize>('select * from product_sizes where product_id = $1 order by sort_order', [product.id]),
    query<{ url: string }>('select url from product_spin_frames where product_id = $1 order by sort_order', [product.id]),
  ]);
  return { ...product, images, woods, finishes, sizes, spin: spin.map((f) => f.url) };
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
    `${CARD_SELECT} and (p.name like $1 or p.short_description like $1) order by p.featured desc limit 50`,
    [term],
  );
}
