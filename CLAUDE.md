@AGENTS.md

# Keppler Commercial Furnishing — Claude Context

## Who you are working with
This is Rudy's copy of the project. Rudy owns Keppler Commercial Furnishing and is
not a programmer, so:

- Explain things in plain language. No jargon without a one-line explanation.
- Do the technical work for him. He describes what he wants; you make the change.
- Before anything risky or hard to undo, stop and tell him what would happen first.
- If something looks broken or confusing, say so plainly and suggest the next step.

The site was built by Mac at MIND (mac@maclin.io). For anything involving the
database, payments, email sending, environment variables, or deployment settings,
the right move is "ask Mac" rather than guessing.

## What this is
The Keppler Commercial Furnishing website: an e-commerce site for handcrafted
solid-wood furniture, with a public storefront, a customer account portal, and an
admin panel.

| Layer | What it is |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Database | Cloudflare D1 (hosted SQLite). `npm run dev` uses a private local copy, so nothing you do locally touches real data. |
| Files | Cloudflare R2 (product photos, customer attachments) |
| Email | Not switched on yet (will be Cloudflare email once the site has its domain) |
| Hosting | Cloudflare Workers. Pushing code to `main` on GitHub deploys automatically. Live at https://kepplercf.mb-9d2.workers.dev |

## Where things live
| You want to change... | Look in... |
|---|---|
| A page's text or layout (About, FAQ, Warranty, etc.) | `src/app/<page-name>/page.tsx` |
| The homepage | `src/app/page.tsx` |
| Header, footer, shared pieces | `src/components/` |
| Product pages | `src/app/product/[slug]/page.tsx` (products themselves live in the database, edited from the admin panel) |
| Admin panel screens | `src/app/admin/` |
| Customer account portal | `src/app/account/` and `src/components/account/` |
| Site title, contact info, SEO description | Admin panel > Web Details (stored in the database, not in code) |

## How Rudy makes a change (the only workflow to use)
Never commit directly to `main`. Pushing `main` deploys the live site immediately.
Instead, every change goes on a branch so it gets a private preview first:

1. Start from fresh code:
   `git checkout main && git pull`
2. Make a branch named for the change:
   `git checkout -b rudy/shorter-homepage-headline`
3. Make the edits, then check them locally if the dev server is running
   (`npm run dev`, site appears at http://localhost:3000).
4. Commit and push the branch:
   `git add -A && git commit -m "describe the change" && git push -u origin HEAD`
5. Open a pull request on GitHub for the branch. Within a few minutes a comment
   appears on the pull request with a preview link (it looks like
   `https://pr-12-kepplercf.mb-9d2.workers.dev`). This preview is the full site
   with the change applied, safe to look at and share, and it does not touch the
   live site. Every further push to the branch updates the same preview.
6. When Rudy is happy with the preview, ask Mac to review and merge the pull
   request. Merging to `main` is what puts it live.

If a change went out and something looks wrong on the live site, do not try to
fix-forward under pressure. Tell Mac.

## Hard rules
- Never push or merge to `main`. Previews via branches only; Mac merges.
- Never edit or delete anything in `db/` (the database schema). Schema and data
  changes go through Mac.
- Never run any `wrangler d1` command with `--remote`. That is the live database,
  with real customer and order data. `npm run db:reset` is fine: it only rebuilds
  your local copy.
- Never edit `.dev.vars` or any `.env` file. They contain secrets. Never print
  their contents into the chat either.
- Never install new packages (`npm install <thing>`) without checking with Mac.
- Text, images, styling, and layout changes are all fair game on a branch.

## Everyday commands
| Task | Command |
|---|---|
| Run the site locally | `npm run dev` then open http://localhost:3000 (first time: `npm run db:reset` to create the local database) |
| Run the tests | `npm test` |
| Check nothing is broken before pushing | `npm run build` |
| See what changed | `git status` and `git diff` |
