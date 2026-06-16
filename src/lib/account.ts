import { query, queryOne, transaction } from '@/lib/db';
import type { StorefrontCard, SampleRequestRow } from '@/lib/types';

export async function isFavorited(userId: string, productId: string): Promise<boolean> {
  const row = await queryOne<{ one: number }>(
    'select 1 as one from favorites where user_id = $1 and product_id = $2', [userId, productId],
  );
  return row !== null;
}

// Toggle a favorite. Returns the resulting favorited state.
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  return transaction(async (client) => {
    const del = await client.query('delete from favorites where user_id = $1 and product_id = $2', [userId, productId]);
    if ((del.rowCount ?? 0) > 0) return false; // was favorited, now removed
    await client.query('insert into favorites (user_id, product_id) values ($1, $2) on conflict do nothing', [userId, productId]);
    return true;
  });
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
