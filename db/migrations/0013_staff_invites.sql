-- Token/link-based staff invitations. An admin creates an invite (optionally
-- pinned to an email), shares the /invite/<token> link, and the recipient
-- redeems it to create a staff/admin account. One-time use.
create table if not exists staff_invites (
  id               uuid primary key default gen_random_uuid(),
  token            text unique not null,
  email            text,
  role             text not null default 'staff' check (role in ('staff','admin')),
  invited_by       uuid references users(id) on delete set null,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz,
  accepted_at      timestamptz,
  accepted_user_id uuid references users(id) on delete set null,
  revoked          boolean not null default false
);
create index if not exists staff_invites_token_idx on staff_invites(token);
