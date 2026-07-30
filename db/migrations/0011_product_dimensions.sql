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
  update products set length_in = 24, width_in = 23, height_in = 38, weight_lb = 24  where slug = 'the-homestead-armchair'    and length_in is null;
  update products set length_in = 17, width_in = 17, height_in = 40, weight_lb = 16  where slug = 'the-garden-counter-stool' and length_in is null;
  update products set length_in = 60, width_in = 16, height_in = 18, weight_lb = 62  where slug = 'the-riverbend-bench'      and length_in is null;
  update products set length_in = 18, width_in = 20, height_in = 41, weight_lb = 13  where slug = 'the-farmhouse-ladderback' and length_in is null;
  update products set length_in = 30, width_in = 25, height_in = 42, weight_lb = 28  where slug = 'the-orchard-rocker'       and length_in is null;
  update products set length_in = 20, width_in = 22, height_in = 38, weight_lb = 18  where slug = 'the-lancaster-chair' and length_in is null;
  update products set length_in = 18, width_in = 20, height_in = 36, weight_lb = 14  where slug = 'the-shaker-side-chair' and length_in is null;
  update products set length_in = 21, width_in = 23, height_in = 40, weight_lb = 20  where slug = 'the-keeping-chair'   and length_in is null;
end $$;
