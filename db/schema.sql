-- Keppler Commercial Furnishing: the whole schema, for Cloudflare D1 (SQLite).
--
-- This replaces the Postgres migrations in db/migrations/, which are kept as
-- history. Conventions:
--   ids           text UUIDs; the default below generates a v4 UUID in SQLite
--   timestamps    text, ISO 8601 UTC with milliseconds ("2026-10-07T17:00:00.000Z"),
--                 which sorts correctly as text; lib/db.ts's NOW makes the same shape
--   dates         text "YYYY-MM-DD"
--   booleans      integer 0/1 (lib/db.ts turns known columns back into booleans)
--   json          text (lib/db.ts parses known columns on the way out)
--
-- Apply locally:  npm run db:reset        (local D1 used by `next dev`)
-- Apply remotely: only ever on a brand-new database; it drops nothing.

pragma foreign_keys = on;

create table if not exists users (
  id            text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  email         text not null unique,
  password_hash text not null,
  created_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists sessions (
  token      text primary key,
  user_id    text not null references users(id) on delete cascade,
  expires_at text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists sessions_user_id_idx on sessions (user_id);

create table if not exists profiles (
  id         text primary key references users(id) on delete cascade,
  email      text not null,
  name       text not null,
  role       text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists collections (
  id             text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  slug           text not null unique,
  name           text not null,
  description    text,
  hero_image_url text,
  sort_order     integer not null default 0,
  created_at     text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists wood_species (
  id           text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name         text not null unique,
  swatch_color text not null,
  sort_order   integer not null default 0
);

create table if not exists finishes (
  id           text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name         text not null unique,
  swatch_color text not null,
  sort_order   integer not null default 0
);

create table if not exists products (
  id                text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  slug              text not null unique,
  name              text not null,
  category          text not null check (category in ('chair')),
  collection_id     text references collections(id) on delete set null,
  short_description text,
  story             text,
  base_price_cents  integer not null default 0,
  lead_time_weeks   integer,
  region            text,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  featured          integer not null default 0,
  created_at        text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  length_in         real,
  width_in          real,
  height_in         real,
  weight_lb         real
);
create index if not exists products_category_status_idx on products (category, status);

create table if not exists product_images (
  id         text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  product_id text not null references products(id) on delete cascade,
  url        text not null,
  type       text not null default 'on_white' check (type in ('on_white', 'lifestyle', 'detail')),
  sort_order integer not null default 0
);
create index if not exists product_images_product_idx on product_images (product_id, sort_order);

create table if not exists product_spin_frames (
  id         text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  product_id text not null references products(id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0
);
create index if not exists product_spin_frames_product_idx on product_spin_frames (product_id, sort_order);

create table if not exists product_woods (
  product_id        text not null references products(id) on delete cascade,
  wood_id           text not null references wood_species(id) on delete cascade,
  price_delta_cents integer not null default 0,
  primary key (product_id, wood_id)
);

create table if not exists product_finishes (
  product_id        text not null references products(id) on delete cascade,
  finish_id         text not null references finishes(id) on delete cascade,
  price_delta_cents integer not null default 0,
  primary key (product_id, finish_id)
);

create table if not exists product_sizes (
  id                text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  product_id        text not null references products(id) on delete cascade,
  label             text not null,
  seats             integer,
  price_delta_cents integer not null default 0,
  sort_order        integer not null default 0
);
create index if not exists product_sizes_product_idx on product_sizes (product_id, sort_order);

create table if not exists inquiries (
  id                 text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  product_id         text references products(id) on delete set null,
  name               text not null,
  email              text not null,
  message            text,
  configuration_json text,
  status             text not null default 'new' check (status in ('new', 'responded', 'closed')),
  created_at         text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists inquiries_created_idx on inquiries (created_at desc);

create table if not exists favorites (
  user_id    text not null references users(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (user_id, product_id)
);

create table if not exists sample_requests (
  id         text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id    text not null references users(id) on delete cascade,
  product_id text references products(id) on delete set null,
  wood_id    text references wood_species(id) on delete set null,
  finish_id  text references finishes(id) on delete set null,
  status     text not null default 'requested' check (status in ('requested', 'shipped', 'delivered')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists sample_requests_user_idx on sample_requests (user_id, created_at desc);

create table if not exists quotes (
  id               text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  customer_id      text not null references users(id) on delete cascade,
  status           text not null default 'requested' check (status in ('requested', 'sent', 'accepted', 'declined', 'expired')),
  subtotal_cents   integer not null default 0,
  total_cents      integer not null default 0,
  valid_until      text,
  notes            text,
  created_at       text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  payment_link_url text
);
create index if not exists quotes_status_idx on quotes (status, created_at desc);
create index if not exists quotes_customer_idx on quotes (customer_id, created_at desc);

create table if not exists quote_items (
  id                 text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  quote_id           text not null references quotes(id) on delete cascade,
  product_id         text references products(id) on delete set null,
  title_snapshot     text not null,
  wood_name          text,
  finish_name        text,
  size_label         text,
  quantity           integer not null default 1,
  unit_price_cents   integer not null default 0,
  configuration_json text
);

create table if not exists orders (
  id                text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  customer_id       text not null references users(id) on delete cascade,
  quote_id          text references quotes(id) on delete set null,
  status            text not null default 'confirmed' check (status in ('confirmed', 'in_production', 'shipping', 'delivered', 'cancelled')),
  subtotal_cents    integer not null default 0,
  total_cents       integer not null default 0,
  est_delivery_date text,
  created_at        text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists orders_customer_idx on orders (customer_id, created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);

create table if not exists order_items (
  id                 text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  order_id           text not null references orders(id) on delete cascade,
  product_id         text references products(id) on delete set null,
  title_snapshot     text not null,
  wood_name          text,
  finish_name        text,
  size_label         text,
  quantity           integer not null default 1,
  unit_price_cents   integer not null default 0,
  configuration_json text
);

create table if not exists order_status_history (
  id         text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  order_id   text not null references orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists messages (
  id          text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  customer_id text not null references users(id) on delete cascade,
  sender      text not null check (sender in ('customer', 'staff')),
  body        text not null,
  read_at     text,
  created_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  attachments text not null default '[]'
);
create index if not exists messages_customer_idx on messages (customer_id, created_at);

create table if not exists site_settings (
  id               integer primary key default 1 check (id = 1),
  site_title       text not null default 'Keppler Commercial Furnishing',
  meta_description text,
  company_name     text,
  contact_email    text,
  contact_phone    text,
  address          text,
  og_image_url     text,
  updated_at       text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists staff_invites (
  id               text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  token            text not null unique,
  email            text,
  role             text not null default 'staff' check (role in ('staff', 'admin')),
  invited_by       text references users(id) on delete set null,
  created_at       text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at       text,
  accepted_at      text,
  accepted_user_id text references users(id) on delete set null,
  revoked          integer not null default 0
);
create index if not exists staff_invites_token_idx on staff_invites (token);
