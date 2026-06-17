-- Physical dimensions for a product (distinct from the size variants in
-- product_sizes). Stored in inches and pounds. Nullable: not every piece has
-- published specs. Idempotent column adds so the migration is safe to re-run.
alter table products add column if not exists length_in numeric(6,1);
alter table products add column if not exists width_in  numeric(6,1);
alter table products add column if not exists height_in numeric(6,1);
alter table products add column if not exists weight_lb numeric(7,1);

-- Backfill the seeded demo catalog so the admin product detail shows real specs.
do $$
begin
  update products set length_in = 84, width_in = 42, height_in = 30, weight_lb = 180 where slug = 'the-homestead-table' and length_in is null;
  update products set length_in = 48, width_in = 48, height_in = 30, weight_lb = 120 where slug = 'the-garden-round'    and length_in is null;
  update products set length_in = 96, width_in = 44, height_in = 30, weight_lb = 240 where slug = 'the-riverbend'       and length_in is null;
  update products set length_in = 72, width_in = 40, height_in = 30, weight_lb = 160 where slug = 'the-lancaster-farm'  and length_in is null;
  update products set length_in = 90, width_in = 42, height_in = 30, weight_lb = 210 where slug = 'the-orchard'         and length_in is null;
  update products set length_in = 20, width_in = 22, height_in = 38, weight_lb = 18  where slug = 'the-lancaster-chair' and length_in is null;
  update products set length_in = 18, width_in = 20, height_in = 36, weight_lb = 14  where slug = 'the-shaker-side-chair' and length_in is null;
  update products set length_in = 21, width_in = 23, height_in = 40, weight_lb = 20  where slug = 'the-keeping-chair'   and length_in is null;
end $$;
