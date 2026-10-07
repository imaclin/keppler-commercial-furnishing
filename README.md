# Keppler Commercial Furnishing

Online catalog and quoting platform for Keppler Commercial Furnishing (Grand
Slabs, LLC): handcrafted American solid-wood chairs, made to order.

Built with Next.js 16 (App Router, React 19), Tailwind, shadcn/ui, and Cloudflare D1 (SQLite)
accessed directly through the `pg` driver. Authentication is a custom
email/password session scheme, not a third-party provider.

> Note for contributors and agents: see `AGENTS.md`. This is Next.js 16, which
> differs from earlier versions in meaningful ways. Check
> `node_modules/next/dist/docs/` before relying on remembered APIs.
>
> `CLAUDE.md` is written for Rudy (the owner, non-technical) and his Claude
> agent. It documents the branch-and-preview workflow, not the full setup.

## Local development

Requires Node 24 (its built-in SQLite runs the tests).

```bash
npm install
npm run db:reset          # creates the local database from db/schema.sql + db/seed.sql
npm run dev               # http://localhost:3000
```

`next dev` talks to a local Cloudflare D1 (a SQLite file under `.wrangler/`),
supplied by the Cloudflare adapter's dev shim. `npm run db:reset` rebuilds it; it
never touches the live database. Production is a D1 database on Cloudflare,
reached only through the Worker's `DB` binding, so there is no connection string
anywhere.

`db/schema.sql` is the whole schema. `db/migrations/` holds the old Postgres
migrations and is history only; schema changes edit `schema.sql` and are applied
to production by hand with `wrangler d1 execute kepplercf --remote`.

Seeded local account (local only; every `db:reset` restores it):

| Account | Email | Password |
| --- | --- | --- |
| Staff admin | `admin@gschairs.test` | `hwadmin123` |

Production uses different, rotated credentials. They are not stored in this
repository.

## Environment

Secrets live on the Worker (`wrangler secret put`); `.dev.vars` holds local values
for `wrangler dev`. Nothing is required today.

| Variable | Required | Purpose |
| --- | --- | --- |
| `KEPPLER_EMAIL_FROM` | no | Sender for transactional email. Falls back to `GS_EMAIL_FROM`, then a placeholder. |
| `RESEND_API_KEY` | no | Enables outbound email. Unset means email is a no-op. |

`GS_EMAIL_FROM` is the pre-rebrand name and is still read as a fallback so email
does not break if only one of the two is set. Neither is set on the Worker, so
production email is a no-op today.

## Tests

```bash
npm test
```

Vitest, including an integration test that runs the real data layer against an
in-memory SQLite built from `db/schema.sql` and `db/seed.sql`.

## Deployment

Hosted on Cloudflare Workers (Worker `kepplercf`, built with `@opennextjs/cloudflare`;
config in `wrangler.jsonc`) with the database on Cloudflare D1. Files
live in two R2 buckets: `keppler-media` (public, served by the app at `/media/<key>`)
and `keppler-private` (customer attachments, served at `/uploads/<name>` to signed-in
users only). The Worker reaches both through bindings, so no storage credentials exist.

GitHub Actions (`.github/workflows/deploy.yml`) deploys `main` to production and gives
every pull request a preview URL (`https://pr-<n>-kepplercf.<subdomain>.workers.dev`),
posted as a comment on the PR. The workflow needs the repo secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. To deploy manually instead:

```bash
npm run deploy:cf
```

`npm run preview:cf` runs the built Worker locally against the local D1.
Next is pinned to 16.3.x until the Cloudflare adapter supports 16.4.

Schema changes are applied to production by hand, from `db/schema.sql` (new
tables and indexes use `if not exists`, so it is safe to re-run):

```bash
npx wrangler d1 execute kepplercf --remote --file db/schema.sql
```

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
