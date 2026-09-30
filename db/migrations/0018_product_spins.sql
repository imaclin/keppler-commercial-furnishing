-- 360-degree product views.
--
-- A spin is a set of photos taken from evenly spaced angles around a product,
-- shown one at a time as the customer drags. The frames are ordinary image URLs
-- (served from the media CDN) kept in rotation order by sort_order.
--
-- A separate table rather than a new product_images.type: spin frames are not
-- gallery photos. They must never appear as thumbnails, as the card image, or
-- in the "first image" lookups that orders, quotes and favorites use, all of
-- which read product_images.

create table if not exists product_spin_frames (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

create index if not exists product_spin_frames_product_idx on product_spin_frames(product_id, sort_order);
