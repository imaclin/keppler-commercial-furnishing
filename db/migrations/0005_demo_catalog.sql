-- Demo/dev catalog content so the storefront renders. Production builds its real
-- catalog through the admin; this seed is for local dev and review.
insert into collections (slug, name, description, sort_order) values
  ('homestead', 'The Homestead Collection', 'Solid, honest dining pieces built for daily life.', 1),
  ('heirloom', 'The Heirloom Collection', 'Showpiece tables and chairs meant to be handed down.', 2)
on conflict (slug) do nothing;

-- helper: insert a product, its images, all woods, all finishes, and two sizes
do $$
declare
  v_homestead uuid; v_heirloom uuid;
  v_pid uuid;
  rec record;
begin
  select id into v_homestead from collections where slug = 'homestead';
  select id into v_heirloom from collections where slug = 'heirloom';

  for rec in
    select * from (values
      ('the-homestead-table','The Homestead Table','table',v_homestead,'Solid oak, trestle base, made to seat the whole family.',320000,8,'/demo/demo-table.png'),
      ('the-garden-round','The Garden Round','table',v_homestead,'A round solid-walnut pedestal table.',245000,8,'/demo/demo-table2.png'),
      ('the-riverbend','The Riverbend','table',v_heirloom,'Live-edge walnut with a sculptural base.',480000,12,'/demo/demo-table3.png'),
      ('the-lancaster-farm','The Lancaster Farm','table',v_homestead,'Classic farmhouse oak with turned legs.',290000,9,'/demo/demo-table4.png'),
      ('the-orchard','The Orchard','table',v_heirloom,'Solid cherry extension table.',365000,10,'/demo/demo-table5.png'),
      ('the-lancaster-chair','The Lancaster Chair','chair',v_homestead,'Solid walnut, hand-finished, spindle back.',89000,8,'/demo/demo-chair.png'),
      ('the-shaker-side-chair','The Shaker Side Chair','chair',v_homestead,'Solid cherry with a woven seat.',64000,8,'/demo/demo-chair.png'),
      ('the-keeping-chair','The Keeping Chair','chair',v_heirloom,'A generous dining armchair in maple.',96000,9,'/demo/demo-chair.png')
    ) as t(slug,name,category,collection_id,descr,price,lead,img)
  loop
    insert into products (slug, name, category, collection_id, short_description, base_price_cents, lead_time_weeks, region, status, featured)
    values (rec.slug, rec.name, rec.category, rec.collection_id, rec.descr, rec.price, rec.lead, 'Holmes County, Ohio', 'published', true)
    on conflict (slug) do nothing
    returning id into v_pid;
    if v_pid is null then continue; end if;

    insert into product_images (product_id, url, type, sort_order) values (v_pid, rec.img, 'on_white', 0);
    insert into product_woods (product_id, wood_id, price_delta_cents) select v_pid, id, 0 from wood_species;
    insert into product_finishes (product_id, finish_id, price_delta_cents) select v_pid, id, 0 from finishes;
    if rec.category = 'table' then
      insert into product_sizes (product_id, label, seats, price_delta_cents, sort_order) values
        (v_pid, '72"', 6, 0, 0), (v_pid, '84"', 8, 40000, 1), (v_pid, '96"', 10, 80000, 2);
    end if;
    v_pid := null;
  end loop;
end $$;
