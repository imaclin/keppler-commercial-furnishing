# HW Phase 0: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the HW platform shell: a Next.js 16 app in the warm HW design system, backed by local Postgres, with open customer registration, staff accounts, role-gated areas (public storefront, customer `/account`, staff `/admin`), and a themed header and footer.

**Architecture:** Next.js 16 App Router (TypeScript) + Tailwind on local PostgreSQL via `pg`. Custom email/password session auth (the artshop/middlebass pattern): `users` + `sessions` + `profiles` with a `role`. Access control in app-layer route helpers and a `proxy.ts` cookie gate. Schema is standard Postgres, portable to the production Supabase project later.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, `pg`, `bcryptjs`, vitest, Cormorant Garamond + Inter (next/font).

**Spec:** `docs/superpowers/specs/2026-06-16-hw-design.md`

**Infra note:** dev runs on the local `hw` Postgres database (Postgres 16 already installed). Production provisions a dedicated Supabase project; the data layer (`pg` + raw SQL) and schema are written to port cleanly.

---

## File Structure

```
hw/
  package.json, tsconfig.json, next.config.ts, vitest.config.ts
  .env.local / .env.example
  db/
    reset.sql
    migrations/0001_auth.sql          # users, sessions, profiles(role)
    migrations/0002_seed.sql          # one staff/admin account
  src/
    proxy.ts                          # cookie gate: /account -> customer, /admin -> staff
    app/
      layout.tsx                      # fonts + design tokens applied
      globals.css                     # warm HW design tokens
      page.tsx                        # themed home placeholder
      (auth)/login/page.tsx
      (auth)/register/page.tsx
      account/page.tsx                # customer-gated stub
      admin/page.tsx                  # staff-gated stub
      auth/signout/route.ts
      actions/auth.ts                 # register, login server actions
    lib/
      db.ts                           # pg pool + query/queryOne/transaction
      auth.ts                         # session + getProfile/requireCustomer/requireStaff
      format.ts                       # slugify, formatPriceCents (pure, tested)
      types.ts                        # row types
    components/
      Header.tsx                      # HW wordmark + storefront nav
      Footer.tsx                      # footer IA from spec
      ui/                             # shadcn primitives
  test/
    format.test.ts
```

---

## Task 1: Scaffold the Next.js app

**Files:** Create via generator into `~/github/hw` (already contains `.git/` and `docs/`).

- [ ] **Step 1: Run the generator**

```bash
cd ~/github/hw
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm --yes
```
When warned the directory is not empty, continue (only `docs/` and `.git/` exist).

- [ ] **Step 2: Verify dev server boots**

```bash
npm run dev
```
Expected: starts on `http://localhost:3000`. Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 16 app (TypeScript, Tailwind, App Router)"
```

---

## Task 2: Design tokens + fonts

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`.

- [ ] **Step 1: Add HW tokens to `src/app/globals.css`**

Append below the existing `@import "tailwindcss";` line:

```css
:root {
  --bone: #f7f4ef;
  --cream: #faf8f5;
  --paper: #fffdfa;
  --espresso: #2b2622;
  --ink: #3a322b;
  --walnut: #6b4f3a;
  --stone: #8c8175;
  --line: #e6ded2;
}
body {
  background: var(--cream);
  color: var(--espresso);
  font-family: var(--font-inter), sans-serif;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
}
.serif { font-family: var(--font-cormorant), Georgia, serif; }
.eyebrow {
  font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
  font-weight: 500; color: var(--stone);
}
```

- [ ] **Step 2: Wire fonts in `src/app/layout.tsx`**

Replace the file with:

```tsx
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "HW | Heirloom Woodwork",
  description: "Handcrafted American solid-wood furniture, built to be handed down.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```
Expected: "Compiled successfully".

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: HW warm design tokens and fonts (Cormorant + Inter)"
```

---

## Task 3: shadcn primitives + vitest

**Files:** Create `components.json`, `src/components/ui/*`, `vitest.config.ts`; modify `package.json`.

- [ ] **Step 1: Init shadcn and add primitives**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card
```

- [ ] **Step 2: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    env: { DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://expando@localhost:5432/hw' },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: Add scripts to `package.json`** (inside `"scripts"`)

```json
"test": "vitest run",
"test:watch": "vitest",
"db:reset": "psql -d hw -v ON_ERROR_STOP=1 -f db/reset.sql -f db/migrations/0001_auth.sql -f db/migrations/0002_seed.sql"
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
git add -A && git commit -m "chore: add shadcn primitives and vitest"
```

---

## Task 4: Local database + pg client

**Files:** Create `.env.local`, `.env.example`, `src/lib/db.ts`.

- [ ] **Step 1: Create the database**

```bash
createdb hw
```
Expected: a new empty `hw` database (Postgres 16 running locally).

- [ ] **Step 2: Install pg + bcryptjs**

```bash
npm install pg bcryptjs
npm install -D @types/pg @types/bcryptjs
```

- [ ] **Step 3: Write env files**

`.env.local`:
```
DATABASE_URL=postgresql://expando@localhost:5432/hw
```
`.env.example`:
```
DATABASE_URL=postgresql://USER@localhost:5432/hw
```
Confirm `.gitignore` contains `.env*.local` (create-next-app adds it).

- [ ] **Step 4: Create `src/lib/db.ts`**

```ts
import { Pool, type QueryResultRow, type PoolClient } from 'pg';

const globalForPg = globalThis as unknown as { pgPool?: Pool };
export const pool = globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: local Postgres pool and query helpers"
```

---

## Task 5: Pure helpers (TDD)

**Files:** Create `src/lib/format.ts`, `test/format.test.ts`.

- [ ] **Step 1: Write the failing tests** in `test/format.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { slugify, formatPriceCents } from '@/lib/format';

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  The Homestead Table ')).toBe('the-homestead-table');
  });
  it('strips punctuation and collapses spaces', () => {
    expect(slugify('Lancaster Chair (Walnut)!')).toBe('lancaster-chair-walnut');
  });
});

describe('formatPriceCents', () => {
  it('formats whole dollars without cents', () => {
    expect(formatPriceCents(320000)).toBe('$3,200');
  });
  it('formats partial dollars with cents', () => {
    expect(formatPriceCents(89950)).toBe('$899.50');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run test/format.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/format'".

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatPriceCents(cents: number): string {
  const dollars = cents / 100;
  const whole = dollars % 1 === 0;
  return `$${dollars.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npx vitest run test/format.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: slugify and formatPriceCents helpers"
```

---

## Task 6: Auth schema + seed

**Files:** Create `db/migrations/0001_auth.sql`, `db/migrations/0002_seed.sql`, `db/reset.sql`, `src/lib/types.ts`.

- [ ] **Step 1: Write `db/reset.sql`**

```sql
drop schema public cascade;
create schema public;
```

- [ ] **Step 2: Write `db/migrations/0001_auth.sql`**

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on sessions(user_id);

create table profiles (
  id uuid primary key references users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Write `db/migrations/0002_seed.sql`**

This seeds one staff/admin login. The password hash below is bcrypt for `hwadmin123` (rotate after first login).

```sql
-- bcrypt hash of 'hwadmin123'
insert into users (id, email, password_hash)
values ('00000000-0000-0000-0000-000000000001', 'admin@hw.test',
        '$2b$10$N9qo8uLOickgx2ZMRZoMy.MQDqYh0Y1xQ6kqH1m1nLZ8u3lQ0e2W')
on conflict (email) do nothing;

insert into profiles (id, email, name, role)
values ('00000000-0000-0000-0000-000000000001', 'admin@hw.test', 'HW Staff', 'admin')
on conflict (id) do nothing;
```

- [ ] **Step 4: Apply and verify**

```bash
npm run db:reset
psql -d hw -tAc "select email, role from profiles;"
```
Expected: one row, `admin@hw.test | admin`.

Note: if the seeded hash does not verify at login time (Task 9 test), regenerate it:
```bash
node -e "console.log(require('bcryptjs').hashSync('hwadmin123',10))"
```
and replace the hash in `0002_seed.sql`, then `npm run db:reset`.

- [ ] **Step 5: Write `src/lib/types.ts`**

```ts
export type Role = 'customer' | 'staff' | 'admin';

export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: auth schema (users/sessions/profiles+role) and staff seed"
```

---

## Task 7: Auth helpers

**Files:** Create `src/lib/auth.ts`.

- [ ] **Step 1: Implement `src/lib/auth.ts`**

```ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import type { Profile } from '@/lib/types';

const COOKIE = 'hw_session';
const SESSION_DAYS = 30;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('insert into sessions (token, user_id, expires_at) values ($1, $2, $3)', [
    token, userId, expires.toISOString(),
  ]);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await query('delete from sessions where token = $1', [token]);
    store.delete(COOKIE);
  }
}

export async function getProfile(): Promise<Profile | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return queryOne<Profile>(
    `select p.* from sessions s join profiles p on p.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token],
  );
}

export async function requireCustomer(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'staff' && profile.role !== 'admin') redirect('/');
  return profile;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: session auth helpers (getProfile, requireCustomer, requireStaff)"
```

---

## Task 8: Auth server actions + signout

**Files:** Create `src/app/actions/auth.ts`, `src/app/auth/signout/route.ts`.

- [ ] **Step 1: Implement `src/app/actions/auth.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { transaction, queryOne } from '@/lib/db';
import { createSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export type ActionState = { error: string } | null;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!email || !password || !name) return { error: 'All fields are required.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  let userId = '';
  try {
    userId = await transaction(async (client) => {
      const { rows: existing } = await client.query('select 1 from users where email = $1', [email]);
      if (existing.length > 0) throw new Error('email_taken');
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await client.query(
        'insert into users (email, password_hash) values ($1, $2) returning id', [email, hash],
      );
      const uid = rows[0].id as string;
      await client.query(
        "insert into profiles (id, email, name, role) values ($1, $2, $3, 'customer')",
        [uid, email, name],
      );
      return uid;
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'email_taken') {
      return { error: 'An account with that email already exists.' };
    }
    return { error: 'Could not create your account. Please try again.' };
  }
  await createSession(userId);
  redirect('/account');
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Email and password are required.' };
  const user = await queryOne<User>('select * from users where email = $1', [email]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: 'Invalid email or password.' };
  }
  await createSession(user.id);
  redirect('/account');
}
```

- [ ] **Step 2: Implement `src/app/auth/signout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/login', request.url));
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat: register/login server actions and signout route"
```

---

## Task 9: Login and Register pages

**Files:** Create `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`.

- [ ] **Step 1: Build `src/app/(auth)/login/page.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, null);
  return (
    <main className="mx-auto max-w-md p-10">
      <Card className="p-8">
        <h1 className="serif text-3xl">Sign in</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--stone)]">New here? <Link href="/register" className="underline">Create an account</Link>.</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Build `src/app/(auth)/register/page.tsx`**

```tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, null);
  return (
    <main className="mx-auto max-w-md p-10">
      <Card className="p-8">
        <h1 className="serif text-3xl">Create an account</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} /></div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Creating...' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--stone)]">Have an account? <Link href="/login" className="underline">Sign in</Link>.</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Verify build and the seeded login**

```bash
npm run build
```
Expected: "Compiled successfully". Then (Task 12 covers the end-to-end check).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: login and register pages"
```

---

## Task 10: Proxy route gate

**Files:** Create `src/proxy.ts`.

> **Next.js 16:** the former `middleware.ts` is now `proxy.ts` with a `proxy` function. Verified in `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

- [ ] **Step 1: Implement `src/proxy.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';

// Optimistic gate only. Storefront is fully public. /account and /admin require a
// session cookie; the page-level helpers (requireCustomer/requireStaff) do the
// real validation and role checks. /api self-authenticates.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const gated = path.startsWith('/account') || path.startsWith('/admin');
  if (gated && !request.cookies.has('hw_session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 2: Verify build and commit**

```bash
npm run build
git add -A && git commit -m "feat: proxy gate for /account and /admin"
```

---

## Task 11: Header, Footer, themed home

**Files:** Create `src/components/Header.tsx`, `src/components/Footer.tsx`; modify `src/app/page.tsx`.

- [ ] **Step 1: Create `src/components/Header.tsx`**

```tsx
import Link from 'next/link';

const NAV = [
  { href: '/tables', label: 'Tables' },
  { href: '/chairs', label: 'Chairs' },
  { href: '/collections', label: 'Collections' },
  { href: '/our-craft', label: 'Our Craft' },
];

export function Header() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-14 h-[86px]">
        <nav className="flex gap-7 text-xs uppercase tracking-[0.13em]">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-[var(--ink)]">{n.label}</Link>)}
        </nav>
        <Link href="/" className="text-center">
          <span className="serif block text-4xl font-semibold tracking-[0.18em] text-[var(--espresso)] leading-none">HW</span>
          <span className="block text-[8.5px] uppercase tracking-[0.42em] text-[var(--stone)] mt-1">Heirloom Woodwork</span>
        </Link>
        <nav className="flex justify-end gap-6 text-xs uppercase tracking-[0.13em]">
          <Link href="/search" className="text-[var(--ink)]">Search</Link>
          <Link href="/consultation" className="text-[var(--ink)]">Consultation</Link>
          <Link href="/account" className="text-[var(--ink)]">Account</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create `src/components/Footer.tsx`**

```tsx
import Link from 'next/link';

const COLS = [
  { h: 'Our Company', links: ['About HW', 'Our Builders', 'Craftsmanship', 'Sustainability', 'Contact'] },
  { h: 'Customer Care', links: ['Order Status', 'Care Guide', 'Warranty', 'Returns & Exchanges', 'Delivery'] },
  { h: 'Resources', links: ['FAQ', 'Design Consultation', 'Order a Sample', 'Trade & Business', 'Financing'] },
];

export function Footer() {
  return (
    <footer className="bg-[var(--espresso)] px-14 py-16 text-[#c3b8a6]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="serif text-3xl tracking-[0.18em] text-[#fffdfa]">HW</div>
          <p className="mt-4 max-w-[280px] text-[12.5px] leading-relaxed text-[#b4a895]">
            Heirloom Woodwork. Solid-wood tables and chairs, handcrafted to order in America and built to be handed down.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[#fffdfa]">{c.h}</h4>
            {c.links.map((l) => <Link key={l} href="#" className="block text-[13px] leading-[2.3] text-[#c3b8a6]">{l}</Link>)}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-[1320px] border-t border-white/10 pt-6 text-[11px] tracking-[0.06em] text-[#9a8e7c]">
        &copy; 2026 HW, Heirloom Woodwork, LLC
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Replace `src/app/page.tsx`**

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-24 text-center">
        <div className="eyebrow">Handcrafted in America</div>
        <h1 className="serif mx-auto mt-5 max-w-[640px] text-6xl font-medium leading-[1.05] text-[var(--ink)]">
          Built once. Kept for generations.
        </h1>
        <p className="mx-auto mt-6 max-w-[420px] text-[var(--stone)]">
          The storefront, catalog, and portal arrive in the next phases. This is the foundation.
        </p>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify build and commit**

```bash
npm run build
git add -A && git commit -m "feat: themed header, footer, and home placeholder"
```

---

## Task 12: Gated stubs + end-to-end verification

**Files:** Create `src/app/account/page.tsx`, `src/app/admin/page.tsx`.

- [ ] **Step 1: Create `src/app/account/page.tsx`**

```tsx
import { requireCustomer } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default async function AccountPage() {
  const profile = await requireCustomer();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1040px] px-14 py-16">
        <h1 className="serif text-4xl">Welcome, {profile.name}.</h1>
        <p className="mt-3 text-[var(--stone)]">Your orders, quotes, and favorites will live here.</p>
        <form action="/auth/signout" method="post" className="mt-8">
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/page.tsx`**

```tsx
import { requireStaff } from '@/lib/auth';

export default async function AdminPage() {
  const profile = await requireStaff();
  return (
    <main className="mx-auto max-w-[1040px] px-14 py-16">
      <h1 className="serif text-4xl">HW Admin</h1>
      <p className="mt-3 text-[var(--stone)]">Signed in as {profile.email} ({profile.role}). Catalog and order tools arrive in Phase 1.</p>
      <form action="/auth/signout" method="post" className="mt-8">
        <button type="submit" className="text-sm underline">Sign out</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Full reset, typecheck, build, tests**

```bash
npm run db:reset
npx tsc --noEmit
npm run build
npx vitest run
```
Expected: schema seeded, no type errors, "Compiled successfully", format tests pass.

- [ ] **Step 4: Manual end-to-end check**

```bash
npm run dev
```
Then verify with the running server:
- `GET /` returns 200 and shows the themed home.
- `GET /account` with no cookie redirects to `/login` (307).
- `GET /admin` with no cookie redirects to `/login` (307).
- Register a new account at `/register` → lands on `/account` showing the name.
- Sign out, then sign in at `/login` with `admin@hw.test` / `hwadmin123` → `/account`; visiting `/admin` loads (role is admin).

Quick scripted gate check (run while `npm run dev` is up):
```bash
echo "home: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"        # 200
echo "account: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/account)" # 307
echo "admin: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin)"     # 307
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: gated account/admin stubs; Phase 0 foundation complete"
```

---

## Done criteria

Phase 0 is complete when: the themed HW shell builds and runs, a visitor can register and land in `/account`, the seeded staff account can reach `/admin`, both gated areas redirect anonymous users to `/login`, and `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass. The next plan covers Phase 1: catalog data model and admin catalog management.
