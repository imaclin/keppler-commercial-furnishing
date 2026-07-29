-- Demo/dev data owned by the seeded admin account so that signing in as
-- admin@gschairs.test and visiting the customer portal (/account) shows a populated
-- experience: favorites, sample requests, a sent quote, an in-production order
-- with a tracker, and a message thread. Idempotent: skips if already seeded.
do $$
declare
  v_admin uuid;
  v_homestead uuid; v_garden uuid; v_lancaster uuid; v_riverbend uuid;
  q uuid; o uuid;
begin
  select id into v_admin from users where email = 'admin@gschairs.test';
  if v_admin is null then return; end if;
  if exists (select 1 from favorites where user_id = v_admin) then return; end if;

  select id into v_homestead from products where slug = 'the-homestead-table';
  select id into v_garden from products where slug = 'the-garden-round';
  select id into v_lancaster from products where slug = 'the-lancaster-chair';
  select id into v_riverbend from products where slug = 'the-riverbend';

  -- favorites
  insert into favorites (user_id, product_id) values
    (v_admin, v_homestead), (v_admin, v_lancaster), (v_admin, v_riverbend)
  on conflict do nothing;

  -- sample requests (one shipped, one requested)
  insert into sample_requests (user_id, product_id, wood_id, finish_id, status, created_at) values
    (v_admin, v_homestead, (select id from wood_species where name='Walnut'), (select id from finishes where name='Natural Oil'), 'shipped', now() - interval '6 days'),
    (v_admin, v_garden, (select id from wood_species where name='Oak'), (select id from finishes where name='Chestnut'), 'requested', now() - interval '1 day');

  -- a sent quote awaiting the account holder's acceptance
  insert into quotes (customer_id, status, subtotal_cents, total_cents, valid_until, notes, created_at)
    values (v_admin, 'sent', 412000, 412000, now() + interval '21 days', 'White-glove delivery included.', now() - interval '3 days') returning id into q;
  insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (q, v_riverbend, 'The Riverbend', 'Walnut', 'Natural Oil', '96"', 1, 412000);

  -- an in-production order with status history (drives the /account dashboard tracker)
  insert into orders (customer_id, status, subtotal_cents, total_cents, est_delivery_date, created_at)
    values (v_admin, 'in_production', 364000, 364000, (now() + interval '4 weeks')::date, now() - interval '12 days') returning id into o;
  insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents)
    values (o, v_homestead, 'The Homestead Table', 'Oak', 'Natural Oil', '84", seats 8', 1, 364000);
  insert into order_status_history (order_id, status, note, created_at) values
    (o, 'confirmed', 'Order confirmed', now() - interval '12 days'),
    (o, 'in_production', 'Joinery underway in the shop', now() - interval '5 days');

  -- a message thread
  insert into messages (customer_id, sender, body, read_at, created_at) values
    (v_admin, 'customer', 'Excited about the table. Any way to add a matching bench later?', now() - interval '2 days', now() - interval '2 days'),
    (v_admin, 'staff', 'Absolutely, we can build a matching bench in the same oak and finish. I will send options.', null, now() - interval '2 days');
end $$;
