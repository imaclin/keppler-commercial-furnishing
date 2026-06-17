# HW Admin Suite v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the basic HW admin into an operations suite that could run a high-volume furniture business: a collapsible grouped workspace shell, an operator command-center dashboard (KPIs + charts + attention queue + activity), rich orders management (detailed rows, filters, overdue flags), an inbox-style messages experience, a reports surface (revenue/conversion/top products/pipeline with CSV export), and a customers CRM-lite. No schema changes; all read-side aggregation over existing tables.

**Architecture:** Extends the HW admin (Next.js 16, local Postgres via `pg`, custom session auth, `requireStaff` via the admin layout). Adds `src/lib/analytics.ts` (aggregation queries), lightweight on-brand chart components (custom SVG/CSS, no chart dependency), a collapsible sidebar + top bar shell, and upgraded/new admin pages. Design stays warm and quiet (espresso/walnut/bone tokens, Cormorant + Inter); the admin leans cleaner and data-dense while keeping the premium restraint.

**Tech Stack:** Next.js 16 App Router, TypeScript, `pg`, Tailwind, shadcn, lucide-react (icons, already a dep), vitest.

**Spec/design refs:** `docs/superpowers/specs/2026-06-16-hw-design.md`, the admin mockup `docs/mockups/hw_admin.png`. Builds on `src/lib/orders.ts`, `src/lib/quotes.ts`, `src/lib/messages.ts`, `src/lib/catalog.ts`, `src/lib/format.ts`.

---

## Design decisions (the "deep thinking")

- **Shell:** a single collapsible sidebar (full ~248px expanded; ~64px icon rail collapsed), grouped nav (Overview / Catalog / Sales / People / Insights), state persisted in a cookie so it survives navigation and reloads. A top bar holds the page title, a global search field (wired to product/customer/order lookup), a quick "+ New product" action, and the staff identity.
- **Charts without a dependency:** small reusable SVG/CSS components (`AreaChart` for the revenue trend, `BarList` for ranked breakdowns, `Sparkline` for KPI deltas, `StatusBar` for the order funnel). Keeps the warm minimal aesthetic and avoids recharts' visual weight and bundle.
- **Money/time:** all money is integer cents through `formatPriceCents`; "overdue" = an order past its `est_delivery_date` still in a non-delivered status; "time in status" from the latest `order_status_history` row.
- **Aggregation is read-only:** no new tables. `analytics.ts` does the SQL; pages render it. CSV export is a route handler that streams the same query results.
- **Scope honesty:** orders/quotes/customers lists get filters + sort + a sane row cap (200) with a note; full pagination is a follow-up. No payments yet (Phase 6).

---

## File Structure

```
hw/
  src/lib/
    analytics.ts                         # NEW: KPIs, revenue series, breakdowns, activity, pipeline
    analytics-format.ts                  # NEW: pure helpers (month buckets, deltas) - tested
  src/components/admin/
    AdminShell.tsx                       # NEW: collapsible sidebar + top bar (client)
    charts/AreaChart.tsx                 # NEW (SVG)
    charts/BarList.tsx                   # NEW
    charts/Sparkline.tsx                 # NEW
    charts/StatusBar.tsx                 # NEW
    KpiCard.tsx                          # NEW
    OrdersTable.tsx                      # NEW (client: filter/sort/search)
    MessagesInbox.tsx                    # NEW (client: two-pane)
  src/app/admin/
    layout.tsx                           # MODIFY: use AdminShell
    page.tsx                             # MODIFY: command-center dashboard
    orders/page.tsx                      # MODIFY: rich table
    orders/[id]/page.tsx                 # MODIFY: richer detail
    messages/page.tsx                    # MODIFY: inbox (list + empty state)
    messages/[id]/page.tsx               # MODIFY: inbox with active thread
    customers/page.tsx                   # NEW
    customers/[id]/page.tsx              # NEW
    reports/page.tsx                     # NEW
    reports/export/route.ts              # NEW: CSV export
  src/components/admin/AdminSidebar.tsx  # REMOVE (replaced by AdminShell)
  test/analytics-format.test.ts          # NEW
```

---

## Task 1: Analytics format helpers (TDD)

**Files:** Create `src/lib/analytics-format.ts`, `test/analytics-format.test.ts`.

- [ ] **Step 1: Write the failing test** `test/analytics-format.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { lastNMonths, pctDelta } from '@/lib/analytics-format';

describe('lastNMonths', () => {
  it('returns N month keys ending at the given date, oldest first', () => {
    const months = lastNMonths(3, new Date('2026-03-15T00:00:00Z'));
    expect(months).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});

describe('pctDelta', () => {
  it('computes percent change', () => {
    expect(pctDelta(120, 100)).toBe(20);
    expect(pctDelta(80, 100)).toBe(-20);
  });
  it('is null when the prior value is zero', () => {
    expect(pctDelta(50, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail** `npx vitest run test/analytics-format.test.ts`

- [ ] **Step 3: Implement `src/lib/analytics-format.ts`**

```ts
// 'YYYY-MM' keys for the last n months ending at `end` (UTC), oldest first.
export function lastNMonths(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  const y = end.getUTCFullYear();
  const m = end.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

// Percent change from `prior` to `current`; null if prior is 0.
export function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}
```

- [ ] **Step 4: Run to verify pass; commit** `git add -A && git commit -m "feat(admin): analytics format helpers (TDD)"`

---

## Task 2: Analytics data layer

**Files:** Create `src/lib/analytics.ts`.

- [ ] **Step 1: Implement `src/lib/analytics.ts`** (read-only aggregation; all money in cents)

```ts
import { query, queryOne } from '@/lib/db';
import { lastNMonths, pctDelta } from '@/lib/analytics-format';

export type Kpis = {
  revenueMtdCents: number; revenueDeltaPct: number | null;
  openOrders: number; inProduction: number; overdue: number;
  quotesPending: number; quoteWinRatePct: number | null;
  avgOrderValueCents: number; newCustomers30d: number; samplesOutstanding: number;
};

export async function getKpis(): Promise<Kpis> {
  const row = await queryOne<Record<string, string | null>>(`
    select
      coalesce((select sum(total_cents) from orders where date_trunc('month', created_at) = date_trunc('month', now())),0)::text as rev_mtd,
      coalesce((select sum(total_cents) from orders where date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')),0)::text as rev_prev,
      (select count(*) from orders where status not in ('delivered','cancelled'))::text as open_orders,
      (select count(*) from orders where status = 'in_production')::text as in_production,
      (select count(*) from orders where status not in ('delivered','cancelled') and est_delivery_date is not null and est_delivery_date < now()::date)::text as overdue,
      (select count(*) from quotes where status = 'requested')::text as quotes_pending,
      (select count(*) from quotes where status = 'accepted')::text as quotes_accepted,
      (select count(*) from quotes where status in ('accepted','declined','expired'))::text as quotes_closed,
      coalesce((select avg(total_cents) from orders),0)::text as aov,
      (select count(*) from profiles where role='customer' and created_at >= now() - interval '30 days')::text as new_cust,
      (select count(*) from sample_requests where status = 'requested')::text as samples_out
  `);
  const n = (k: string) => Number(row?.[k] ?? 0);
  const closed = n('quotes_closed');
  return {
    revenueMtdCents: n('rev_mtd'),
    revenueDeltaPct: pctDelta(n('rev_mtd'), n('rev_prev')),
    openOrders: n('open_orders'), inProduction: n('in_production'), overdue: n('overdue'),
    quotesPending: n('quotes_pending'),
    quoteWinRatePct: closed > 0 ? Math.round((n('quotes_accepted') / closed) * 100) : null,
    avgOrderValueCents: Math.round(n('aov')), newCustomers30d: n('new_cust'), samplesOutstanding: n('samples_out'),
  };
}

export async function revenueByMonth(months = 12): Promise<{ label: string; cents: number }[]> {
  const rows = await query<{ ym: string; cents: string }>(`
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as ym, sum(total_cents)::text as cents
    from orders where created_at >= date_trunc('month', now()) - interval '${months - 1} months'
    group by 1`);
  const map = new Map(rows.map((r) => [r.ym, Number(r.cents)]));
  return lastNMonths(months).map((ym) => ({ label: ym, cents: map.get(ym) ?? 0 }));
}

export async function ordersByStatus(): Promise<{ status: string; count: number }[]> {
  return (await query<{ status: string; count: string }>(
    `select status, count(*)::text as count from orders group by status`,
  )).map((r) => ({ status: r.status, count: Number(r.count) }));
}

export async function topProducts(limit = 6): Promise<{ name: string; units: number; cents: number }[]> {
  return (await query<{ name: string; units: string; cents: string }>(`
    select title_snapshot as name, sum(quantity)::text as units, sum(quantity*unit_price_cents)::text as cents
    from order_items group by title_snapshot order by sum(quantity*unit_price_cents) desc limit ${limit}`))
    .map((r) => ({ name: r.name, units: Number(r.units), cents: Number(r.cents) }));
}

export type ActivityItem = { kind: 'order' | 'quote' | 'message'; label: string; sub: string; href: string; at: string };

export async function recentActivity(limit = 12): Promise<ActivityItem[]> {
  return query<ActivityItem>(`
    (select 'order' as kind, pr.name as label, 'Order ' || o.status as sub, '/admin/orders/' || o.id as href, o.created_at as at
       from orders o join profiles pr on pr.id = o.customer_id)
    union all
    (select 'quote', pr.name, 'Quote ' || q.status, '/admin/quotes/' || q.id, q.created_at
       from quotes q join profiles pr on pr.id = q.customer_id)
    union all
    (select 'message', pr.name, left(m.body, 60), '/admin/messages/' || m.customer_id, m.created_at
       from messages m join profiles pr on pr.id = m.customer_id where m.sender = 'customer')
    order by at desc limit ${limit}`);
}

export type AttentionCounts = { quotesToPrice: number; unreadMessages: number; overdueOrders: number; samplesToShip: number };

export async function attentionCounts(): Promise<AttentionCounts> {
  const row = await queryOne<Record<string, string>>(`
    select
      (select count(*) from quotes where status='requested')::text as q,
      (select count(distinct customer_id) from messages where sender='customer' and read_at is null)::text as m,
      (select count(*) from orders where status not in ('delivered','cancelled') and est_delivery_date is not null and est_delivery_date < now()::date)::text as o,
      (select count(*) from sample_requests where status='requested')::text as s`);
  return { quotesToPrice: Number(row?.q ?? 0), unreadMessages: Number(row?.m ?? 0), overdueOrders: Number(row?.o ?? 0), samplesToShip: Number(row?.s ?? 0) };
}

// Quote pipeline funnel counts.
export async function quotePipeline(): Promise<{ requested: number; sent: number; accepted: number; declinedExpired: number }> {
  const rows = await query<{ status: string; count: string }>(`select status, count(*)::text as count from quotes group by status`);
  const m = new Map(rows.map((r) => [r.status, Number(r.count)]));
  return { requested: m.get('requested') ?? 0, sent: m.get('sent') ?? 0, accepted: m.get('accepted') ?? 0, declinedExpired: (m.get('declined') ?? 0) + (m.get('expired') ?? 0) };
}
```

- [ ] **Step 2: Typecheck and commit** `npx tsc --noEmit` then `git add -A && git commit -m "feat(admin): analytics data layer (KPIs, revenue series, breakdowns, activity, pipeline)"`

---

## Task 3: Chart + KPI components (on-brand, no dependency)

**Files:** Create `src/components/admin/charts/AreaChart.tsx`, `BarList.tsx`, `Sparkline.tsx`, `StatusBar.tsx`, `src/components/admin/KpiCard.tsx`.

- [ ] **Step 1: `charts/AreaChart.tsx`** (server component; SVG line+area for a revenue series)

```tsx
export function AreaChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const w = 720;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((d, i) => [i * stepX, height - (d.value / max) * (height - 24) - 4] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Revenue trend">
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--walnut)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--walnut)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#rev)" />
      <path d={line} fill="none" stroke="var(--walnut)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

- [ ] **Step 2: `charts/BarList.tsx`** (ranked horizontal bars)

```tsx
export function BarList({ items }: { items: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between text-sm"><span className="text-[var(--ink)]">{it.label}</span><span className="text-[var(--stone)]">{it.display}</span></div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--bone)]"><div className="h-1.5 rounded-full bg-[var(--walnut)]" style={{ width: `${(it.value / max) * 100}%` }} /></div>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-[var(--stone)]">No data yet.</li>}
    </ul>
  );
}
```

- [ ] **Step 3: `charts/Sparkline.tsx`** (tiny inline trend for KPI cards)

```tsx
export function Sparkline({ data, width = 96, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data); const min = Math.min(...data);
  const span = max - min || 1; const stepX = width / (data.length - 1);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`).join(' ');
  return <svg width={width} height={height} className="overflow-visible"><path d={line} fill="none" stroke="var(--walnut)" strokeWidth="1.5" /></svg>;
}
```

- [ ] **Step 4: `charts/StatusBar.tsx`** (segmented bar for order/quote status mix)

```tsx
const COLORS: Record<string, string> = {
  confirmed: '#5b7355', in_production: '#9a6b3a', shipping: '#4a6076', delivered: '#6b4f3a', cancelled: '#9a8e7c',
  requested: '#8c8175', sent: '#4a6076', accepted: '#5b7355', declined: '#9a8e7c', expired: '#9a8e7c',
};
export function StatusBar({ segments }: { segments: { status: string; count: number }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.count, 0));
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {segments.map((s) => <div key={s.status} title={`${s.status}: ${s.count}`} style={{ width: `${(s.count / total) * 100}%`, background: COLORS[s.status] ?? '#ccc' }} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--stone)]">
        {segments.map((s) => <span key={s.status} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[s.status] ?? '#ccc' }} />{s.status.replaceAll('_', ' ')} {s.count}</span>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: `KpiCard.tsx`** (value + delta + optional sparkline)

```tsx
import { Sparkline } from '@/components/admin/charts/Sparkline';

export function KpiCard({ label, value, delta, spark, tone = 'default' }: {
  label: string; value: string; delta?: number | null; spark?: number[]; tone?: 'default' | 'warn';
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">{label}</div>
        {spark && spark.length > 1 && <Sparkline data={spark} />}
      </div>
      <div className={`serif mt-2 text-3xl ${tone === 'warn' ? 'text-[#9a6b3a]' : 'text-[var(--ink)]'}`}>{value}</div>
      {delta !== undefined && delta !== null && (
        <div className={`mt-1 text-xs ${delta >= 0 ? 'text-[#5b7355]' : 'text-red-600'}`}>{delta >= 0 ? '+' : ''}{delta}% vs last month</div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Typecheck and commit** `npx tsc --noEmit` then `git add -A && git commit -m "feat(admin): on-brand chart and KPI components (no chart dependency)"`

---

## Task 4: Collapsible workspace shell

**Files:** Create `src/components/admin/AdminShell.tsx`; modify `src/app/admin/layout.tsx`; remove `src/components/admin/AdminSidebar.tsx`.

- [ ] **Step 1: `AdminShell.tsx`** (client; collapsible grouped sidebar + top bar). Persist collapsed state in a cookie (`hw_admin_nav`). Use lucide icons. Groups: Overview (Dashboard), Catalog (Products, Collections, Wood & Finishes), Sales (Orders, Quotes), People (Customers, Messages), Insights (Reports). Active link via `usePathname`. Collapsed = icon rail (~64px) with tooltips; expanded = ~248px with labels and group headers. Top bar: page-title slot (children pass nothing; the bar shows a global search input that submits to `/admin/orders?q=` or a search route, a "+ New Product" link, and the staff email). The shell takes `email` and renders `children`.

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Layers, Trees, ShoppingBag, FileText, Users, MessageSquare, BarChart3,
  PanelLeftClose, PanelLeft, Search, Plus,
} from 'lucide-react';

const GROUPS = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Catalog', items: [
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/collections', label: 'Collections', icon: Layers },
    { href: '/admin/woods', label: 'Wood & Finishes', icon: Trees },
  ] },
  { title: 'Sales', items: [
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/quotes', label: 'Quotes', icon: FileText },
  ] },
  { title: 'People', items: [
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  ] },
  { title: 'Insights', items: [{ href: '/admin/reports', label: 'Reports', icon: BarChart3 }] },
];

export function AdminShell({ email, initialCollapsed, children }: { email: string; initialCollapsed: boolean; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `hw_admin_nav=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000`;
  }
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <aside className={`${collapsed ? 'w-[64px]' : 'w-[248px]'} shrink-0 bg-[var(--espresso)] text-[#cdbfaf] transition-[width] duration-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-6'} h-[64px]`}>
          {!collapsed && <span className="serif text-2xl tracking-[0.2em] text-[#fffdfa]">HW</span>}
          <button onClick={toggle} aria-label="Toggle sidebar" className="text-[#cdbfaf] hover:text-white">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="mt-2">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              {!collapsed && <div className="px-6 pb-1 text-[9.5px] uppercase tracking-[0.2em] text-[#7d7160]">{g.title}</div>}
              {g.items.map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} title={collapsed ? it.label : undefined}
                    className={`flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-6'} py-2.5 text-sm ${active ? 'bg-white/6 text-[#fffdfa] border-l-2 border-[var(--walnut)]' : 'text-[#c9bca9] hover:text-[#fffdfa]'}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{it.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-6">
          <form action="/admin/orders" className="flex items-center gap-2 text-[var(--stone)]">
            <Search className="h-4 w-4" />
            <input name="q" placeholder="Search orders, customers..." className="w-64 max-w-[40vw] bg-transparent text-sm outline-none placeholder:text-[var(--stone)]" />
          </form>
          <div className="flex items-center gap-4">
            <Link href="/admin/products/new" className="flex items-center gap-1 bg-[var(--espresso)] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#fffdfa]"><Plus className="h-3.5 w-3.5" /> New Product</Link>
            <span className="text-xs text-[var(--stone)]">{email}</span>
            <form action="/auth/signout" method="post"><button className="text-xs uppercase tracking-[0.12em] text-[var(--ink)]">Sign out</button></form>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Modify `src/app/admin/layout.tsx`** to read the cookie and render the shell

```tsx
import { cookies } from 'next/headers';
import { requireStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const collapsed = (await cookies()).get('hw_admin_nav')?.value === 'collapsed';
  return <AdminShell email={profile.email} initialCollapsed={collapsed}>{children}</AdminShell>;
}
```

- [ ] **Step 3: Delete `src/components/admin/AdminSidebar.tsx`** (no longer used). Confirm nothing imports it: `grep -rn AdminSidebar src/` returns nothing.

- [ ] **Step 4: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(admin): collapsible grouped workspace shell with top bar"`

---

## Task 5: Command-center dashboard

**Files:** Modify `src/app/admin/page.tsx`.

- [ ] **Step 1: Rebuild the dashboard** using the analytics layer + components. Layout: a header row ("Overview" + the period), a KPI grid (Revenue MTD with delta, Open Orders, In Production, Overdue [warn tone if > 0], Quotes Pending, Quote Win Rate, Avg Order Value, Samples Outstanding), a two-column section with the **revenue AreaChart** (12 months, with the latest month value + label) beside the **order status StatusBar** and **quote pipeline**, a **Top Products** BarList, an **Attention** panel (quotes to price -> /admin/quotes, unread messages -> /admin/messages, overdue orders -> /admin/orders?status=overdue, samples to ship -> /admin/orders) each linking out, and a **Recent Activity** feed (icon per kind, label, sub, relative time, link). Use `formatPriceCents`, `timeAgo`. All server-rendered from `getKpis`, `revenueByMonth`, `ordersByStatus`, `quotePipeline`, `topProducts`, `attentionCounts`, `recentActivity`. Wrap content in `<main className="p-8">`.

The dashboard composes the Task 2/3 pieces; build the JSX to present them cleanly in the warm style (KPI grid `grid-cols-2 md:grid-cols-4`, cards from `KpiCard`, panels are `border border-[var(--line)] bg-[var(--paper)] p-5` with a small uppercase eyebrow heading). The Revenue card passes the monthly series to `KpiCard`'s `spark`. The AreaChart panel shows `formatPriceCents` of the trailing 12-month total.

- [ ] **Step 2: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(admin): operator command-center dashboard (KPIs, charts, attention, activity)"`

---

## Task 6: Orders table + richer detail

**Files:** Create `src/components/admin/OrdersTable.tsx`; modify `src/lib/orders.ts` (richer list query), `src/app/admin/orders/page.tsx`, `src/app/admin/orders/[id]/page.tsx`.

- [ ] **Step 1: Add a richer admin list query to `src/lib/orders.ts`**

```ts
export type AdminOrderRow = Order & {
  customer_name: string; item_count: number; first_item: string | null; first_image: string | null; overdue: boolean;
};
export async function listOrdersForAdminRich(opts: { status?: string; q?: string } = {}): Promise<AdminOrderRow[]> {
  const params: unknown[] = [];
  let where = "where 1=1";
  if (opts.status && opts.status !== 'all') {
    if (opts.status === 'overdue') {
      where += " and o.status not in ('delivered','cancelled') and o.est_delivery_date is not null and o.est_delivery_date < now()::date";
    } else { params.push(opts.status); where += ` and o.status = $${params.length}`; }
  }
  if (opts.q) { params.push(`%${opts.q}%`); where += ` and pr.name ilike $${params.length}`; }
  return query<AdminOrderRow>(`
    select o.*, pr.name as customer_name,
      (select count(*)::int from order_items i where i.order_id = o.id) as item_count,
      (select title_snapshot from order_items i where i.order_id = o.id limit 1) as first_item,
      (select pi.url from order_items i join product_images pi on pi.product_id = i.product_id where i.order_id = o.id order by pi.sort_order limit 1) as first_image,
      (o.status not in ('delivered','cancelled') and o.est_delivery_date is not null and o.est_delivery_date < now()::date) as overdue
    from orders o join profiles pr on pr.id = o.customer_id
    ${where} order by o.created_at desc limit 200`, params);
}
```

- [ ] **Step 2: `src/components/admin/OrdersTable.tsx`** (client; status filter tabs, search box that updates the URL `?status=&q=`, and the rich rows). Columns: thumbnail + item summary ("Homestead Table +2 more"), customer (name), status pill, total, ordered (relative), est delivery (with a red "overdue" chip when `overdue`), and a chevron link to the detail. Status filter tabs: All / Confirmed / In Production / Shipping / Delivered / Overdue. The component takes `rows`, `status`, `q` and uses a small form + Links to drive server-side filtering (no client fetching needed; the page reads searchParams).

- [ ] **Step 3: Modify `src/app/admin/orders/page.tsx`** to read `searchParams` (`status`, `q`), call `listOrdersForAdminRich`, and render `<OrdersTable rows status q />`. (await searchParams; Next 16.)

- [ ] **Step 4: Modify `src/app/admin/orders/[id]/page.tsx`** to a richer detail: a header (order short id, customer name + email, ordered date), a left column with item rows (thumbnail, title, wood/finish/size, qty, unit + line total) and the order total, a right column with the `OrderTracker`, est-delivery, the `OrderStatusForm`, and the status-history timeline. Pull customer email via the existing `getOrderForAdmin` (extend it to also select the customer email if not present). Keep it server-rendered.

- [ ] **Step 5: Verify and commit** `npx tsc --noEmit && npm run build` then `git add -A && git commit -m "feat(admin): rich orders table (filters, overdue flags, item detail) and detailed order view"`

---

## Task 7: Messages inbox

**Files:** Create `src/components/admin/MessagesInbox.tsx`; modify `src/lib/messages.ts` (thread preview query), `src/app/admin/messages/page.tsx`, `src/app/admin/messages/[id]/page.tsx`.

- [ ] **Step 1: Enrich `listMessageThreads` in `src/lib/messages.ts`** to also return the last message body + sender:

```ts
export async function listMessageThreadsRich(): Promise<{ customer_id: string; customer_name: string; last_body: string; last_sender: string; last_at: string; unread: number }[]> {
  return query(`
    select distinct on (m.customer_id) m.customer_id, pr.name as customer_name, m.body as last_body, m.sender as last_sender, m.created_at as last_at,
      (select count(*) from messages mm where mm.customer_id = m.customer_id and mm.sender='customer' and mm.read_at is null)::int as unread
    from messages m join profiles pr on pr.id = m.customer_id
    order by m.customer_id, m.created_at desc`);
}
```
(Then re-sort by last_at desc in JS, since distinct on requires that order by.)

- [ ] **Step 2: `src/components/admin/MessagesInbox.tsx`** (server component; two-pane). Left pane: the conversation list (each: initial-circle avatar, customer name, last message preview truncated with a "You: " prefix when last_sender is staff, relative time, an unread dot/badge; the active one highlighted). Right pane: either an empty state ("Select a conversation") or the active `AdminMessageThread` (passed as children) with the customer name header. Takes `threads`, `activeId`, and `children` (the thread). Make the list a column of `Link`s to `/admin/messages/[customerId]`.

- [ ] **Step 3: Modify `src/app/admin/messages/page.tsx`** to render `<MessagesInbox threads={...} activeId={null}>` with an empty-state right pane (no thread selected).

- [ ] **Step 4: Modify `src/app/admin/messages/[id]/page.tsx`** to render `<MessagesInbox threads activeId={customerId}>` wrapping the existing `AdminMessageThread` (with a header showing the customer name). Keep the `markRead` on load.

- [ ] **Step 5: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(admin): inbox-style messages (conversation list + thread pane)"`

---

## Task 8: Customers (CRM-lite)

**Files:** Create `src/lib/customers.ts`, `src/app/admin/customers/page.tsx`, `src/app/admin/customers/[id]/page.tsx`.

- [ ] **Step 1: `src/lib/customers.ts`**

```ts
import { query, queryOne } from '@/lib/db';

export type CustomerRow = { id: string; name: string; email: string; orders: number; ltv_cents: number; last_at: string | null };
export async function listCustomers(q?: string): Promise<CustomerRow[]> {
  const params: unknown[] = [];
  let where = "where pr.role = 'customer'";
  if (q) { params.push(`%${q}%`); where += ` and (pr.name ilike $${params.length} or u.email ilike $${params.length})`; }
  return query<CustomerRow>(`
    select pr.id, pr.name, u.email,
      (select count(*)::int from orders o where o.customer_id = pr.id) as orders,
      coalesce((select sum(total_cents) from orders o where o.customer_id = pr.id),0)::int as ltv_cents,
      (select max(created_at) from orders o where o.customer_id = pr.id) as last_at
    from profiles pr join users u on u.id = pr.id
    ${where} order by ltv_cents desc limit 200`, params);
}

export async function getCustomer(id: string) {
  const profile = await queryOne<{ id: string; name: string; email: string; created_at: string }>(
    'select pr.id, pr.name, u.email, pr.created_at from profiles pr join users u on u.id = pr.id where pr.id = $1', [id]);
  if (!profile) return null;
  const [orders, quotes, samples, ltv] = await Promise.all([
    query('select id, status, total_cents, created_at from orders where customer_id = $1 order by created_at desc', [id]),
    query('select id, status, total_cents, created_at from quotes where customer_id = $1 order by created_at desc', [id]),
    query("select s.id, s.status, w.name as wood, f.name as finish, s.created_at from sample_requests s left join wood_species w on w.id=s.wood_id left join finishes f on f.id=s.finish_id where s.user_id = $1 order by s.created_at desc", [id]),
    queryOne<{ c: string }>('select coalesce(sum(total_cents),0)::text as c from orders where customer_id = $1', [id]),
  ]);
  return { profile, orders, quotes, samples, ltvCents: Number(ltv?.c ?? 0) };
}
```

- [ ] **Step 2: `src/app/admin/customers/page.tsx`** read `searchParams.q`, `listCustomers(q)`, render a table (name, email, orders, lifetime value via formatPriceCents, last order relative) with a search box; rows link to detail.

- [ ] **Step 3: `src/app/admin/customers/[id]/page.tsx`** await params, `getCustomer(id)`, notFound if null; header (name, email, member-since, LTV); sections for Orders, Quotes, Samples (compact lists with status pills + links to the order/quote), and a link to message them.

- [ ] **Step 4: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(admin): customers CRM-lite (list with lifetime value, customer detail)"`

---

## Task 9: Reports + CSV export

**Files:** Create `src/app/admin/reports/page.tsx`, `src/app/admin/reports/export/route.ts`.

- [ ] **Step 1: `src/app/admin/reports/page.tsx`** A reporting surface using the analytics layer + charts: a revenue section (12-month AreaChart + the trailing-12 total and MTD), a quote-conversion funnel (requested -> sent -> accepted with the win rate), top products BarList (by revenue), top customers BarList (by LTV via `listCustomers` top 6), an order-status StatusBar (production pipeline), and outstanding sample-request count. Each panel `border border-[var(--line)] bg-[var(--paper)] p-5` with an eyebrow heading. Include a "Export orders (CSV)" link to `/admin/reports/export?type=orders`.

- [ ] **Step 2: `src/app/admin/reports/export/route.ts`** (staff-gated GET) streams a CSV. Support `?type=orders` (order id, date, customer, status, total dollars, est delivery) and `?type=customers` (name, email, orders, LTV dollars). Use `requireStaff()`, build the CSV string from a query, return with `Content-Type: text/csv` and a `Content-Disposition: attachment; filename="hw-<type>-<date>.csv"`.

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function csv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
}

export async function GET(request: NextRequest) {
  await requireStaff();
  const type = request.nextUrl.searchParams.get('type') ?? 'orders';
  let header: string[]; let body: string[][];
  if (type === 'customers') {
    const rows = await query<{ name: string; email: string; orders: string; ltv: string }>(
      `select pr.name, u.email, (select count(*) from orders o where o.customer_id=pr.id)::text as orders,
         (coalesce((select sum(total_cents) from orders o where o.customer_id=pr.id),0)/100)::text as ltv
       from profiles pr join users u on u.id=pr.id where pr.role='customer' order by 4 desc`);
    header = ['Name', 'Email', 'Orders', 'Lifetime Value'];
    body = rows.map((r) => [r.name, r.email, r.orders, `$${r.ltv}`]);
  } else {
    const rows = await query<{ id: string; created_at: string; name: string; status: string; total: string; eta: string | null }>(
      `select o.id, to_char(o.created_at,'YYYY-MM-DD') as created_at, pr.name, o.status, (o.total_cents/100)::text as total, to_char(o.est_delivery_date,'YYYY-MM-DD') as eta
         from orders o join profiles pr on pr.id=o.customer_id order by o.created_at desc`);
    header = ['Order', 'Date', 'Customer', 'Status', 'Total', 'Est Delivery'];
    body = rows.map((r) => [r.id.slice(0, 8), r.created_at, r.name, r.status, `$${r.total}`, r.eta ?? '']);
  }
  const out = csv([header, ...body]);
  return new NextResponse(out, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="hw-${type}.csv"` } });
}
```

- [ ] **Step 3: Verify and commit** `npx tsc --noEmit && npm run build` then `git add -A && git commit -m "feat(admin): reports surface and CSV export"`

---

## Task 10: End-to-end verification

- [ ] **Step 1:** `npm run db:reset && npx tsc --noEmit && npm run build && npx vitest run` (all pass; analytics-format tests included).
- [ ] **Step 2:** With a staff session (dev server), confirm 200 + content on `/admin` (KPIs render with the seeded demo numbers), `/admin/orders` (rich rows, status filter, overdue chip on the past-ETA order), `/admin/orders?status=in_production` (filters), `/admin/messages` (inbox list) and `/admin/messages/<customerId>` (thread pane), `/admin/customers` (LTV sorted) and a customer detail, `/admin/reports` (charts) and `/admin/reports/export?type=orders` (CSV downloads). Confirm the sidebar collapse toggle sets the `hw_admin_nav` cookie. Confirm anonymous `/admin/*` still redirects to `/login`.
- [ ] **Step 3:** Commit any fixes.

---

## Done criteria

The admin is a workspace, not a list: a collapsible grouped shell with a top bar; a command-center dashboard with revenue trend, KPIs with deltas, order/quote status, top products, an attention queue, and recent activity; an orders table with item detail, filters, search, and overdue flags plus a detailed order view; an inbox-style messages experience; a customers CRM-lite with lifetime value; and a reports surface with CSV export. `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass, verified against the seeded demo data. (Full pagination and payments remain follow-ups.)
