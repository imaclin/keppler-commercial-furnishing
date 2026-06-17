import { query, queryOne } from '@/lib/db';

export type SiteSettings = {
  id: number;
  site_title: string;
  meta_description: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  og_image_url: string | null;
  updated_at: string;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await queryOne<SiteSettings>('select * from site_settings where id = 1');
  if (row) return row;
  // Self-heal: ensure the singleton row exists.
  return (await queryOne<SiteSettings>(
    "insert into site_settings (id) values (1) on conflict (id) do update set id = 1 returning *",
  ))!;
}

export type SiteSettingsInput = {
  site_title: string;
  meta_description: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  og_image_url: string | null;
};

export async function updateSiteSettings(input: SiteSettingsInput): Promise<void> {
  await query(
    `update site_settings set site_title=$1, meta_description=$2, company_name=$3,
       contact_email=$4, contact_phone=$5, address=$6, og_image_url=$7, updated_at=now()
     where id = 1`,
    [input.site_title, input.meta_description, input.company_name, input.contact_email,
     input.contact_phone, input.address, input.og_image_url],
  );
}
