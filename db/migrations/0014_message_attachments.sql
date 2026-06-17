-- File/photo attachments on messages. Stored as a JSON array of
-- { url, name, type, size } objects. Body may be empty when attachments exist.
alter table messages add column if not exists attachments jsonb not null default '[]'::jsonb;
