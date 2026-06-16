create table inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  name text not null,
  email text not null,
  message text,
  configuration_json jsonb,
  status text not null default 'new' check (status in ('new','responded','closed')),
  created_at timestamptz not null default now()
);
create index inquiries_created_idx on inquiries(created_at desc);
