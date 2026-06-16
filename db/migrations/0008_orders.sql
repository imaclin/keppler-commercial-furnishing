create table quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','sent','accepted','declined','expired')),
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  valid_until timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index quotes_customer_idx on quotes(customer_id, created_at desc);
create index quotes_status_idx on quotes(status, created_at desc);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title_snapshot text not null,
  wood_name text, finish_name text, size_label text,
  quantity int not null default 1,
  unit_price_cents int not null default 0,
  configuration_json jsonb
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed','in_production','shipping','delivered','cancelled')),
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  est_delivery_date date,
  created_at timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id, created_at desc);
create index orders_status_idx on orders(status, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title_snapshot text not null,
  wood_name text, finish_name text, size_label text,
  quantity int not null default 1,
  unit_price_cents int not null default 0,
  configuration_json jsonb
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  sender text not null check (sender in ('customer','staff')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_customer_idx on messages(customer_id, created_at);
