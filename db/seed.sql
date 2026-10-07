-- Local development seed (never run against production: it contains a known
-- password). Staff login: admin@gschairs.test / hwadmin123.

insert into users (id, email, password_hash)
values ('00000000-0000-0000-0000-000000000001', 'admin@gschairs.test',
        '$2b$10$36nFUXz6lEsvYm9V.4/IZuBbEbCglHpfgHNYjfMdoCLgN6BVj3gwe')
on conflict (email) do nothing;

insert into profiles (id, email, name, role)
values ('00000000-0000-0000-0000-000000000001', 'admin@gschairs.test', 'Keppler Staff', 'admin')
on conflict (id) do nothing;

insert into wood_species (name, swatch_color, sort_order) values
  ('Oak', '#caa472', 1), ('Walnut', '#6b4f3a', 2), ('Cherry', '#8a4b34', 3), ('Maple', '#d8c19a', 4)
on conflict (name) do nothing;

insert into finishes (name, swatch_color, sort_order) values
  ('Natural Oil', '#caa472', 1), ('Honey', '#b8956a', 2), ('Chestnut', '#7a5230', 3), ('Espresso', '#3a2e24', 4)
on conflict (name) do nothing;

insert into site_settings (id, site_title, meta_description, company_name, contact_email, contact_phone, address)
values (1,
  'Keppler Commercial Furnishing',
  'Handcrafted American solid-wood furniture, built to be handed down.',
  'Keppler Commercial Furnishing',
  'hello@kepplercf.test',
  '(330) 555-0142',
  'Holmes County, Ohio')
on conflict (id) do nothing;
