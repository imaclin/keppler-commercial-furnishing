-- Narrows the catalog to chairs only.
--
-- Migration 0005 now seeds a chairs-only catalog, so a fresh `npm run db:reset`
-- never sees a table product. This file exists for databases that were already
-- seeded with the old table/chair catalog (production). It converts the five
-- table products into chairs in place rather than deleting them, so the demo
-- quotes, orders, favorites, sample requests, and message threads keep pointing
-- at live rows instead of going null.
--
-- Idempotent: every statement keys off the old slug or the old title snapshot,
-- so re-running it is a no-op.

-- ---------- products ----------
update products set
  slug = 'the-homestead-armchair', name = 'The Homestead Armchair', category = 'chair',
  short_description = 'Solid oak dining armchair with a hand-shaped saddle seat.',
  base_price_cents = 112000, lead_time_weeks = 8,
  length_in = 24, width_in = 23, height_in = 38, weight_lb = 24, updated_at = now()
where slug = 'the-homestead-table';

update products set
  slug = 'the-garden-counter-stool', name = 'The Garden Counter Stool', category = 'chair',
  short_description = 'A round-seat walnut counter stool with a turned footrest.',
  base_price_cents = 78000, lead_time_weeks = 8,
  length_in = 17, width_in = 17, height_in = 40, weight_lb = 16, updated_at = now()
where slug = 'the-garden-round';

update products set
  slug = 'the-riverbend-bench', name = 'The Riverbend Bench', category = 'chair',
  short_description = 'Live-edge walnut dining bench on a sculptural base.',
  base_price_cents = 148000, lead_time_weeks = 12,
  length_in = 60, width_in = 16, height_in = 18, weight_lb = 62, updated_at = now()
where slug = 'the-riverbend';

update products set
  slug = 'the-farmhouse-ladderback', name = 'The Farmhouse Ladderback', category = 'chair',
  short_description = 'Classic oak ladderback with a hand-woven rush seat.',
  base_price_cents = 58000, lead_time_weeks = 9,
  length_in = 18, width_in = 20, height_in = 41, weight_lb = 13, updated_at = now()
where slug = 'the-lancaster-farm';

update products set
  slug = 'the-orchard-rocker', name = 'The Orchard Rocker', category = 'chair',
  short_description = 'Solid cherry rocker, steam-bent and hand-shaped.',
  base_price_cents = 132000, lead_time_weeks = 10,
  length_in = 30, width_in = 25, height_in = 42, weight_lb = 28, updated_at = now()
where slug = 'the-orchard';

update products set short_description = 'Solid cherry with a hand-woven tape seat.', updated_at = now()
where slug = 'the-shaker-side-chair';

-- Chairs are configured by wood and finish. The seeded size variants were table
-- lengths ('72"', '84"', '96"') and no longer mean anything.
delete from product_sizes;

-- The demo table photos are gone from public/demo. Give every product its own
-- chair photo so no two cards share an image.
update product_images i set url = m.url from (values
  ('the-homestead-armchair',    '/demo/demo-chair2.png'),
  ('the-garden-counter-stool',  '/demo/demo-chair3.png'),
  ('the-riverbend-bench',       '/demo/demo-chair4.png'),
  ('the-farmhouse-ladderback',  '/demo/demo-chair5.png'),
  ('the-orchard-rocker',        '/demo/demo-chair6.png'),
  ('the-shaker-side-chair',     '/demo/demo-chair7.png'),
  ('the-keeping-chair',         '/demo/demo-chair8.png')
) as m(slug, url)
join products p on p.slug = m.slug
where i.product_id = p.id and i.url <> m.url;

-- Only one category is allowed now. Widen this check if one is ever added back.
alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check check (category in ('chair'));

update collections set description = 'Showpiece seating meant to be handed down.'
where slug = 'heirloom';

-- ---------- denormalized line items ----------
-- order_items and quote_items snapshot the title, size, quantity, and price at
-- the time of sale, so renaming the product does not reach them. Rewrite the
-- demo rows to the chair equivalents, then recompute every parent total from
-- its items so the math stays consistent.
update order_items set
  title_snapshot = 'The Homestead Armchair', size_label = 'Standard',
  quantity = 4, unit_price_cents = 112000
where title_snapshot = 'The Homestead Table';

update order_items set
  title_snapshot = 'The Riverbend Bench', size_label = 'Standard',
  quantity = 1, unit_price_cents = 148000
where title_snapshot = 'The Riverbend';

update order_items set
  title_snapshot = 'The Garden Counter Stool', size_label = 'Counter height',
  quantity = 2, unit_price_cents = 78000
where title_snapshot = 'The Garden Round';

update quote_items set
  title_snapshot = 'The Riverbend Bench', size_label = 'Standard',
  quantity = 2, unit_price_cents = 148000
where title_snapshot = 'The Riverbend';

-- This one is an unpriced request awaiting quoting, so unit_price_cents stays 0.
update quote_items set
  title_snapshot = 'The Garden Counter Stool', size_label = 'Counter height',
  quantity = 4
where title_snapshot = 'The Garden Round';

update orders o set subtotal_cents = s.total, total_cents = s.total
from (select order_id, sum(quantity * unit_price_cents)::int as total from order_items group by order_id) s
where s.order_id = o.id and o.total_cents <> s.total;

update quotes q set subtotal_cents = s.total, total_cents = s.total
from (select quote_id, sum(quantity * unit_price_cents)::int as total from quote_items group by quote_id) s
where s.quote_id = q.id and q.total_cents <> s.total;

-- ---------- demo message copy ----------
update messages set body = 'Hi, any update on when the Homestead armchairs will ship?'
where body = 'Hi, any update on when the Homestead table will ship?';

update messages set body = 'Excited about the armchairs. Any way to add a matching bench later?'
where body = 'Excited about the table. Any way to add a matching bench later?';
