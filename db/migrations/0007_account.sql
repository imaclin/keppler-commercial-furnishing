create table favorites (
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table sample_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  wood_id uuid references wood_species(id) on delete set null,
  finish_id uuid references finishes(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','shipped','delivered')),
  created_at timestamptz not null default now()
);
create index sample_requests_user_idx on sample_requests(user_id, created_at desc);
