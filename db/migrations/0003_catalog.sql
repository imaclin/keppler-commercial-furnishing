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
  -- The catalog is chairs only. Widen this check if a category is ever added.
  category text not null check (category in ('chair')),
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
