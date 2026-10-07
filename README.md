# Keppler Commercial Furnishing

Online catalog and quoting platform for Keppler Commercial Furnishing (Grand
Slabs, LLC): handcrafted American solid-wood chairs, made to order.

Built with Next.js 16 (App Router, React 19), Tailwind, shadcn/ui, and Postgres
accessed directly through the `pg` driver. Authentication is a custom
email/password session scheme, not a third-party provider.

> Note for contributors and agents: see `AGENTS.md`. This is Next.js 16, which
> differs from earlier versions in meaningful ways. Check
> `node_modules/next/dist/docs/` before relying on remembered APIs.
>
> `CLAUDE.md` is written for Rudy (the owner, non-technical) and his Claude
> agent. It documents the branch-and-preview workflow, not the full setup.

## Local development

Requires Node 24 and a local Postgres server.

```bash
npm install
createdb gs_chairs        # once
npm run db:reset          # builds schema and seeds demo data
npm run dev               # http://localhost:3000
```

The local database is still named `gs_chairs`. It was deliberately left alone
during the rebrand so existing checkouts keep working; renaming it would break
every developer's `.env.local` for no benefit.

`npm run db:reset` runs `db/reset.sql` followed by every migration in
`db/migrations/` in order. It drops and recreates the `public` schema, so only
ever point it at a local database.

Seeded local accounts (these exist only in the local database, and every
`db:reset` restores them). The addresses still carry the old branding because
they live in already-applied migrations, which are history and are not rewritten:

| Account | Email | Password |
| --- | --- | --- |
| Staff admin | `admin@gschairs.test` | `hwadmin123` |
| Customers | `sarah`, `david`, `anna` `@gschairs-demo.test` | `customer123` |

Production uses different, rotated credentials. They are not stored in this
repository.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `KEPPLER_EMAIL_FROM` | no | Sender for transactional email. Falls back to `GS_EMAIL_FROM`, then a placeholder. |
| `RESEND_API_KEY` | no | Enables outbound email. Unset means email is a no-op. |

`GS_EMAIL_FROM` is the pre-rebrand name and is still read as a fallback so email
does not break if only one of the two is set. Neither is set on the Worker, so
production email is a no-op today.

Keep `.env.local` pointed at your local database. Pointing it at production
means local development writes to live client data.

## Tests

```bash
npm test
```

Vitest, including integration tests that hit a real local Postgres. Note that
`vitest.config.ts` contains a hardcoded `DATABASE_URL` fallback which must stay
in sync with the local database name.

## Deployment

Hosted on Cloudflare Workers (Worker `kepplercf`, built with `@opennextjs/cloudflare`;
config in `wrangler.jsonc`) with Postgres on Neon reached through Hyperdrive. Files
live in two R2 buckets: `keppler-media` (public, served by the app at `/media/<key>`)
and `keppler-private` (customer attachments, served at `/uploads/<name>` to signed-in
users only). The Worker reaches both through bindings, so no storage credentials exist.

GitHub Actions (`.github/workflows/deploy.yml`) deploys `main` to production and gives
every pull request a preview URL (`https://pr-<n>-kepplercf.<subdomain>.workers.dev`),
posted as a comment on the PR. The workflow needs the repo secrets
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `DATABASE_URL` (the build
prerenders a few pages that read site settings). To deploy manually instead:

```bash
npm run deploy:cf
```

`npm run preview:cf` runs the built Worker locally (`.dev.vars` holds `DATABASE_URL`).
Next is pinned to 16.3.x until the Cloudflare adapter supports 16.4.

Migrations do not run automatically on deploy. Apply them to production
explicitly, using the unpooled connection string:

```bash
psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -f db/migrations/00NN_name.sql
```

Do not run `db/reset.sql` against production. It drops the schema.

## Branding

The name lives in two places, and both have to move together:

- Source code, which supplies the wordmark and the metadata fallbacks.
- The `site_settings` row in the database, which the admin edits from
  **Admin > Web Details**. `src/app/layout.tsx` reads `site_title` from there,
  so that row, not the code, controls the browser tab and the OpenGraph title.

`db/migrations/0017_keppler_rebrand.sql` moves that row. Migrations `0001`
through `0016` still read "GS Chairs" or "HW" because they are history that
already ran.

## Layout

| Path | Contents |
| --- | --- |
| `src/app/` | Routes. Storefront at the root, `admin/`, `account/`, `(auth)/`. |
| `src/app/actions/` | Server actions (auth, cart, quotes, settings). |
| `src/lib/` | Data access and domain logic (`catalog`, `auth`, `db`, `analytics`, `notify`). |
| `src/components/` | UI, including `admin/` and `account/` shells. |
| `db/migrations/` | Numbered, append-only SQL migrations. |
| `docs/` | Design specs, plans, and mockups. Written pre-rebrand, so they say "HW". |
| `src/proxy.ts` | Middleware. Next.js 16 renamed this from `middleware.ts`. |

## House style

No em dashes in user-facing copy or code comments. Use commas, colons,
parentheses, or rewrite the sentence.
