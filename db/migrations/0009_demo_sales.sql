-- Demo/dev sales data so the admin dashboard, quotes, orders, and messages views
-- have realistic content. Idempotent: skips entirely if the demo customers exist.
-- All demo customers share the password 'customer123'.
do $$
declare
  v_sarah uuid; v_david uuid; v_anna uuid;
  v_hash text := '$2b$10$piLyyWil.SqrN6sWYvc9IOudP5rdCrV5a4tj/WGosykRyDnvBTYCK';
  v_homestead uuid; v_garden uuid; v_lancaster uuid; v_riverbend uuid;
  v_oak text; v_walnut text; v_natural text; v_chestnut text;
  q1 uuid; q2 uuid; o1 uuid; o2 uuid; o3 uuid; o4 uuid;
begin
  if exists (select 1 from users where email = 'sarah@hw-demo.test') then return; end if;

  -- product / option references
  select id into v_homestead from products where slug = 'the-homestead-table';
  select id into v_garden from products where slug = 'the-garden-round';
  select id into v_lancaster from products where slug = 'the-lancaster-chair';
  select id into v_riverbend from products where slug = 'the-riverbend';
  select name into v_oak from wood_species where name = 'Oak';
  select name into v_walnut from wood_species where name = 'Walnut';
  select name into v_natural from finishes where name = 'Natural Oil';
  select name into v_chestnut from finishes where name = 'Chestnut';

  -- ---------- customers ----------
  insert into users (email, password_hash) values ('sarah@hw-demo.test', v_hash) returning id into v_sarah;
  insert into profiles (id, email, name, role) values (v_sarah, 'sarah@hw-demo.test', 'Sarah Whitfield', 'customer');
  insert into users (email, password_hash) values ('david@hw-demo.test', v_hash) returning id into v_david;
  insert into profiles (id, email, name, role) values (v_david, 'david@hw-demo.test', 'David Penner', 'customer');
  insert into users (email, password_hash) values ('anna@hw-demo.test', v_hash) returning id into v_anna;
  insert into profiles (id, email, name, role) values (v_anna, 'anna@hw-demo.test', 'Anna Yoder', 'customer');

  -- ---------- quotes ----------
  -- Anna: a fresh request awaiting pricing (shows in the admin attention queue)
  insert into quotes (customer_id, status, subtotal_cents, total_cents, created_at)
    values (v_anna, 'requested', 0, 0, now() - interval '2 days') returning id into q1;
  insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (q1, v_garden, 'The Garden Round', v_walnut, v_chestnut, '48" round', 1, 0);

  -- David: a priced quote sent, awaiting his acceptance
  insert into quotes (customer_id, status, subtotal_cents, total_cents, valid_until, notes, created_at)
    values (v_david, 'sent', 534000, 534000, now() + interval '28 days', 'Includes white-glove delivery to Columbus.', now() - interval '1 day') returning id into q2;
  insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (q2, v_lancaster, 'The Lancaster Chair', v_walnut, v_natural, 'Standard', 6, 89000);

  -- ---------- orders (various statuses) ----------
  -- Sarah: in production
  insert into orders (customer_id, status, subtotal_cents, total_cents, est_delivery_date, created_at)
    values (v_sarah, 'in_production', 364000, 364000, (now() + interval '5 weeks')::date, now() - interval '10 days') returning id into o1;
  insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (o1, v_homestead, 'The Homestead Table', v_oak, v_natural, '84", seats 8', 1, 364000);
  insert into order_status_history (order_id, status, note, created_at) values
    (o1, 'confirmed', 'Order confirmed from accepted quote', now() - interval '10 days'),
    (o1, 'in_production', 'In the shop, joinery underway', now() - interval '4 days');

  -- David: just confirmed
  insert into orders (customer_id, status, subtotal_cents, total_cents, created_at)
    values (v_david, 'confirmed', 178000, 178000, now() - interval '2 days') returning id into o2;
  insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (o2, v_lancaster, 'The Lancaster Chair', v_walnut, v_natural, 'Standard', 2, 89000);
  insert into order_status_history (order_id, status, note, created_at)
    values (o2, 'confirmed', 'Order confirmed', now() - interval '2 days');

  -- Anna: shipping
  insert into orders (customer_id, status, subtotal_cents, total_cents, est_delivery_date, created_at)
    values (v_anna, 'shipping', 480000, 480000, (now() + interval '1 week')::date, now() - interval '6 weeks') returning id into o3;
  insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (o3, v_riverbend, 'The Riverbend', v_walnut, v_chestnut, '96"', 1, 480000);
  insert into order_status_history (order_id, status, created_at) values
    (o3, 'confirmed', now() - interval '6 weeks'),
    (o3, 'in_production', now() - interval '4 weeks'),
    (o3, 'shipping', now() - interval '2 days');

  -- Sarah: a delivered past order
  insert into orders (customer_id, status, subtotal_cents, total_cents, created_at)
    values (v_sarah, 'delivered', 245000, 245000, now() - interval '5 months') returning id into o4;
  insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (o4, v_garden, 'The Garden Round', v_oak, v_natural, '48" round', 1, 245000);
  insert into order_status_history (order_id, status, created_at) values
    (o4, 'confirmed', now() - interval '5 months'),
    (o4, 'in_production', now() - interval '4 months'),
    (o4, 'shipping', now() - interval '3 months'),
    (o4, 'delivered', now() - interval '85 days');

  -- ---------- messages ----------
  insert into messages (customer_id, sender, body, read_at, created_at) values
    (v_sarah, 'customer', 'Hi, any update on when the Homestead table will ship?', now() - interval '3 days', now() - interval '3 days'),
    (v_sarah, 'staff', 'It is in the shop now, on track to ship in about 5 weeks. We will send tracking.', null, now() - interval '3 days'),
    (v_david, 'customer', 'Could we move the chair delivery to the 24th?', null, now() - interval '6 hours');
end $$;
