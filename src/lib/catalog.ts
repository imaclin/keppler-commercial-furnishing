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
