-- Rebrand: GS Chairs -> Keppler Commercial Furnishing.
--
-- Branding lives in two places: source code (renamed in the same commit that
-- adds this file) and the site_settings row that the admin edits from Web
-- Details. This migration moves the row and the column default. It only
-- rewrites values that still carry the old branding, so a title or email the
-- admin has customized since is left alone.
--
-- Earlier migrations still read "GS Chairs" because they are history that
-- already ran; on a fresh install this file runs after them and lands the
-- database in the same state as production.

alter table site_settings alter column site_title set default 'Keppler Commercial Furnishing';

update site_settings
set site_title = 'Keppler Commercial Furnishing', updated_at = now()
where id = 1 and site_title = 'GS Chairs';

update site_settings
set company_name = 'Keppler Commercial Furnishing', updated_at = now()
where id = 1 and company_name = 'GS Chairs';

update site_settings
set contact_email = 'hello@keppler.test', updated_at = now()
where id = 1 and contact_email = 'hello@gschairs.test';
