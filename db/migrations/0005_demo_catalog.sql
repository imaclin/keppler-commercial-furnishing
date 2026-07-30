-- Demo/dev catalog content so the storefront renders. Production builds its real
-- catalog through the admin; this seed is for local dev and review.
insert into collections (slug, name, description, sort_order) values
  ('homestead', 'The Homestead Collection', 'Solid, honest dining pieces built for daily life.', 1),
  ('heirloom', 'The Heirloom Collection', 'Showpiece seating meant to be handed down.', 2)
on conflict (slug) do nothing;

-- helper: insert a product, its image, and every wood and finish as an option
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
      ('the-lancaster-chair','The Lancaster Chair','chair',v_homestead,'Solid walnut, hand-finished, spindle back.',89000,8,'/demo/demo-chair.png'),
      ('the-shaker-side-chair','The Shaker Side Chair','chair',v_homestead,'Solid cherry with a hand-woven tape seat.',64000,8,'/demo/demo-chair7.png'),
      ('the-keeping-chair','The Keeping Chair','chair',v_heirloom,'A generous dining armchair in maple.',96000,9,'/demo/demo-chair8.png'),
      ('the-homestead-armchair','The Homestead Armchair','chair',v_homestead,'Solid oak dining armchair with a hand-shaped saddle seat.',112000,8,'/demo/demo-chair2.png'),
      ('the-garden-counter-stool','The Garden Counter Stool','chair',v_homestead,'A round-seat walnut counter stool with a turned footrest.',78000,8,'/demo/demo-chair3.png'),
      ('the-riverbend-bench','The Riverbend Bench','chair',v_heirloom,'Live-edge walnut dining bench on a sculptural base.',148000,12,'/demo/demo-chair4.png'),
      ('the-farmhouse-ladderback','The Farmhouse Ladderback','chair',v_homestead,'Classic oak ladderback with a hand-woven rush seat.',58000,9,'/demo/demo-chair5.png'),
      ('the-orchard-rocker','The Orchard Rocker','chair',v_heirloom,'Solid cherry rocker, steam-bent and hand-shaped.',132000,10,'/demo/demo-chair6.png')
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
    -- No product_sizes: chairs are configured by wood and finish, not by length.
    v_pid := null;
  end loop;
end $$;
