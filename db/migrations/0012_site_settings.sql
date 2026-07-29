-- Singleton row of site-wide settings: SEO metadata + company information,
-- edited from the admin "Web Details" page. Enforced single row via id = 1.
create table if not exists site_settings (
  id               int primary key default 1,
  site_title       text not null default 'GS Chairs',
  meta_description text,
  company_name     text,
  contact_email    text,
  contact_phone    text,
  address          text,
  og_image_url     text,
  updated_at       timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into site_settings (id, site_title, meta_description, company_name, contact_email, contact_phone, address)
values (1,
  'GS Chairs',
  'Handcrafted American solid-wood furniture, built to be handed down.',
  'GS Chairs',
  'hello@gschairs.test',
  '(330) 555-0142',
  'Holmes County, Ohio')
on conflict (id) do nothing;
