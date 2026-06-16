# HW Phase 4: Quotes, Orders, Tracker, Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the sales loop. A logged-in customer requests a quote from a product, staff price and send it, the customer accepts and it becomes an order, and the order moves through a production-status tracker (confirmed, in production, shipping, delivered) visible to the customer. Plus a two-way customer-admin message thread. Email notifications are best-effort and env-gated.

**Architecture:** Extends Phases 0-3 (Next.js 16, local Postgres via `pg`, custom session auth, staff admin, customer portal, storefront PDP configurator). Adds `quotes`/`quote_items`/`orders`/`order_items`/`order_status_history`/`messages` tables, data layers (`quotes.ts`, `orders.ts`, `messages.ts`), customer + staff server actions, a gated email helper (`notify.ts`), customer portal pages (quotes, orders + tracker, messages), admin pages (quotes pricing/send, orders status management, messages), and a logged-in "request a quote" path on the PDP. Item rows snapshot the configured selection (the artshop snapshot pattern) so historical records never drift.

**Tech Stack:** Next.js 16 App Router, TypeScript, `pg`, Tailwind + shadcn, vitest, Resend (optional/gated).

**Spec:** `docs/superpowers/specs/2026-06-16-hw-design.md`. Customer tracker mockup: `docs/mockups/hw_customer.png` (5-step tracker). Admin orders mockup: `docs/mockups/hw_admin.png`.

**Builds on:** `src/lib/db.ts` (query/queryOne/transaction), `src/lib/auth.ts` (getProfile/requireCustomer/requireStaff), `src/lib/format.ts` (formatPriceCents), `src/lib/catalog.ts` (getStorefrontProduct), the portal layout/`PortalSidebar`, the admin layout/`AdminSidebar`, `ProductConfigurator` (has woodId/finishId/sizeId/price state), shadcn primitives.

---

## File Structure

```
hw/
  db/migrations/0008_orders.sql         # NEW: quotes, quote_items, orders, order_items, order_status_history, messages
  db/reset.sql / package.json           # MODIFY: db:reset chain adds 0008
  src/lib/
    types.ts                            # MODIFY: quote/order/message types
    quotes.ts                           # NEW
    orders.ts                           # NEW
    messages.ts                         # NEW
    notify.ts                           # NEW: gated email (Resend), best-effort
    order-status.ts                     # NEW: pure status-step helpers (tested)
  src/app/actions/
    quotes.ts                           # NEW: customer requestQuote/acceptQuote; staff sendQuote
    orders.ts                           # NEW: staff advanceOrder/setEstDelivery
    messages.ts                         # NEW: send (customer + staff)
  src/app/account/
    page.tsx                            # MODIFY: active-order tracker preview
    quotes/page.tsx, quotes/[id]/page.tsx        # NEW
    orders/page.tsx, orders/[id]/page.tsx        # NEW
    messages/page.tsx                            # NEW
  src/app/admin/
    page.tsx                            # MODIFY: order/quote counts + attention queue
    quotes/page.tsx, quotes/[id]/page.tsx        # NEW
    orders/page.tsx, orders/[id]/page.tsx        # NEW
    messages/page.tsx, messages/[id]/page.tsx    # NEW
  src/components/
    account/PortalSidebar.tsx           # MODIFY: add Orders, Quotes, Messages
    admin/AdminSidebar.tsx              # MODIFY: add Orders, Quotes, Messages
    OrderTracker.tsx                    # NEW: 5-step production tracker (shared, server)
    account/QuoteAcceptButton.tsx       # NEW (client)
    account/MessageThread.tsx           # NEW (client; customer)
    admin/QuotePricingForm.tsx          # NEW (client)
    admin/OrderStatusForm.tsx           # NEW (client)
    admin/AdminMessageThread.tsx        # NEW (client; staff)
    storefront/QuoteRequestForm.tsx     # MODIFY: logged-in path creates a real quote
  test/order-status.test.ts            # NEW
```

---

## Task 1: Schema + types

**Files:** Create `db/migrations/0008_orders.sql`; modify `package.json`, `src/lib/types.ts`.

- [ ] **Step 1: Write `db/migrations/0008_orders.sql`**

```sql
create table quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','sent','accepted','declined','expired')),
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  valid_until timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index quotes_customer_idx on quotes(customer_id, created_at desc);
create index quotes_status_idx on quotes(status, created_at desc);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title_snapshot text not null,
  wood_name text, finish_name text, size_label text,
  quantity int not null default 1,
  unit_price_cents int not null default 0,
  configuration_json jsonb
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed','in_production','shipping','delivered','cancelled')),
  subtotal_cents int not null default 0,
  total_cents int not null default 0,
  est_delivery_date date,
  created_at timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id, created_at desc);
create index orders_status_idx on orders(status, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title_snapshot text not null,
  wood_name text, finish_name text, size_label text,
  quantity int not null default 1,
  unit_price_cents int not null default 0,
  configuration_json jsonb
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  sender text not null check (sender in ('customer','staff')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_customer_idx on messages(customer_id, created_at);
```

- [ ] **Step 2: Add 0008 to the db:reset chain in `package.json`** (after 0007).

- [ ] **Step 3: Add types to `src/lib/types.ts`** (append)

```ts
export type QuoteStatus = 'requested' | 'sent' | 'accepted' | 'declined' | 'expired';
export type OrderStatus = 'confirmed' | 'in_production' | 'shipping' | 'delivered' | 'cancelled';

export type QuoteItem = {
  id: string; quote_id: string; product_id: string | null; title_snapshot: string;
  wood_name: string | null; finish_name: string | null; size_label: string | null;
  quantity: number; unit_price_cents: number; configuration_json: Record<string, unknown> | null;
};
export type Quote = {
  id: string; customer_id: string; status: QuoteStatus; subtotal_cents: number; total_cents: number;
  valid_until: string | null; notes: string | null; created_at: string;
};
export type OrderItem = Omit<QuoteItem, 'quote_id'> & { order_id: string };
export type Order = {
  id: string; customer_id: string; quote_id: string | null; status: OrderStatus;
  subtotal_cents: number; total_cents: number; est_delivery_date: string | null; created_at: string;
};
export type OrderStatusEvent = { id: string; order_id: string; status: string; note: string | null; created_at: string };
export type Message = { id: string; customer_id: string; sender: 'customer' | 'staff'; body: string; read_at: string | null; created_at: string };
```

- [ ] **Step 4: Apply and verify**

```bash
npm run db:reset
psql -d hw -tAc "select to_regclass('public.quotes'), to_regclass('public.orders'), to_regclass('public.messages');"
```
Expected: three non-null names.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(orders): quotes, orders, status history, messages schema"`

---

## Task 2: Order-status helper (TDD)

**Files:** Create `src/lib/order-status.ts`, `test/order-status.test.ts`.

- [ ] **Step 1: Write the failing test `test/order-status.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { ORDER_STEPS, stepIndex, isStepComplete } from '@/lib/order-status';

describe('order status steps', () => {
  it('has the production steps in order', () => {
    expect(ORDER_STEPS).toEqual(['confirmed', 'in_production', 'shipping', 'delivered']);
  });
  it('stepIndex returns position', () => {
    expect(stepIndex('in_production')).toBe(1);
    expect(stepIndex('delivered')).toBe(3);
  });
  it('isStepComplete is true for steps at or before the current status', () => {
    expect(isStepComplete('confirmed', 'shipping')).toBe(true);   // confirmed is done when at shipping
    expect(isStepComplete('delivered', 'shipping')).toBe(false);  // delivered not yet reached at shipping
    expect(isStepComplete('shipping', 'shipping')).toBe(true);    // current step counts as reached
  });
});
```

- [ ] **Step 2: Run to verify fail** `npx vitest run test/order-status.test.ts` (FAIL, module missing).

- [ ] **Step 3: Implement `src/lib/order-status.ts`**

```ts
import type { OrderStatus } from '@/lib/types';

// The forward production path shown on the customer tracker. 'cancelled' is a
// terminal off-path state and is not a step.
export const ORDER_STEPS = ['confirmed', 'in_production', 'shipping', 'delivered'] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

export function stepIndex(step: OrderStep): number {
  return ORDER_STEPS.indexOf(step);
}

// Is `step` reached when the order is at `current`? (current step counts as reached)
export function isStepComplete(step: OrderStep, current: OrderStatus): boolean {
  if (current === 'cancelled') return false;
  const ci = ORDER_STEPS.indexOf(current as OrderStep);
  if (ci < 0) return false;
  return stepIndex(step) <= ci;
}
```

- [ ] **Step 4: Run to verify pass** `npx vitest run test/order-status.test.ts`.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(orders): order-status step helper (TDD)"`

---

## Task 3: Quotes + orders + messages data layers

**Files:** Create `src/lib/quotes.ts`, `src/lib/orders.ts`, `src/lib/messages.ts`.

- [ ] **Step 1: `src/lib/quotes.ts`**

```ts
import { query, queryOne, transaction } from '@/lib/db';
import type { Quote, QuoteItem, OrderStatus } from '@/lib/types';

export async function createQuoteFromConfig(customerId: string, item: {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; configuration: Record<string, unknown> | null;
}): Promise<string> {
  return transaction(async (client) => {
    const { rows } = await client.query(
      `insert into quotes (customer_id, status, subtotal_cents, total_cents)
       values ($1, 'requested', $2, $2) returning id`,
      [customerId, item.unitPriceCents],
    );
    const id = rows[0].id as string;
    await client.query(
      `insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
       values ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
      [id, item.productId, item.title, item.woodName, item.finishName, item.sizeLabel, item.unitPriceCents,
       item.configuration ? JSON.stringify(item.configuration) : null],
    );
    return id;
  });
}

export async function listQuotesForCustomer(customerId: string): Promise<Quote[]> {
  return query<Quote>('select * from quotes where customer_id = $1 order by created_at desc', [customerId]);
}

export async function getQuoteForCustomer(id: string, customerId: string): Promise<(Quote & { items: QuoteItem[] }) | null> {
  const quote = await queryOne<Quote>('select * from quotes where id = $1 and customer_id = $2', [id, customerId]);
  if (!quote) return null;
  const items = await query<QuoteItem>('select * from quote_items where quote_id = $1', [id]);
  return { ...quote, items };
}

export async function listQuotesForAdmin(): Promise<(Quote & { customer_name: string; item_count: number })[]> {
  return query(
    `select q.*, pr.name as customer_name, (select count(*)::int from quote_items qi where qi.quote_id = q.id) as item_count
       from quotes q join profiles pr on pr.id = q.customer_id
      order by case q.status when 'requested' then 0 else 1 end, q.created_at desc`,
  );
}

export async function getQuoteForAdmin(id: string): Promise<(Quote & { customer_name: string; items: QuoteItem[] }) | null> {
  const quote = await queryOne<Quote & { customer_name: string }>(
    'select q.*, pr.name as customer_name from quotes q join profiles pr on pr.id = q.customer_id where q.id = $1', [id],
  );
  if (!quote) return null;
  const items = await query<QuoteItem>('select * from quote_items where quote_id = $1', [id]);
  return { ...quote, items };
}

// Staff: set per-item prices, valid-until, notes, mark sent. prices keyed by quote_item id.
export async function priceAndSendQuote(quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null): Promise<void> {
  await transaction(async (client) => {
    let subtotal = 0;
    const { rows: items } = await client.query('select id, quantity from quote_items where quote_id = $1', [quoteId]);
    for (const it of items) {
      const unit = prices[it.id as string] ?? 0;
      subtotal += unit * (it.quantity as number);
      await client.query('update quote_items set unit_price_cents = $2 where id = $1', [it.id, unit]);
    }
    await client.query(
      `update quotes set subtotal_cents = $2, total_cents = $2, valid_until = $3, notes = $4, status = 'sent' where id = $1`,
      [quoteId, subtotal, validUntil, notes],
    );
  });
}

// Customer accepts a sent quote -> creates a confirmed order (snapshotting items) and marks the quote accepted.
export async function acceptQuote(quoteId: string, customerId: string): Promise<string | null> {
  return transaction(async (client) => {
    const { rows: qrows } = await client.query(
      "select * from quotes where id = $1 and customer_id = $2 and status = 'sent' for update", [quoteId, customerId],
    );
    const quote = qrows[0];
    if (!quote) return null;
    const { rows: orows } = await client.query(
      `insert into orders (customer_id, quote_id, status, subtotal_cents, total_cents)
       values ($1, $2, 'confirmed', $3, $4) returning id`,
      [customerId, quoteId, quote.subtotal_cents, quote.total_cents],
    );
    const orderId = orows[0].id as string;
    await client.query(
      `insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
       select $1, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json
         from quote_items where quote_id = $2`,
      [orderId, quoteId],
    );
    await client.query("insert into order_status_history (order_id, status, note) values ($1, 'confirmed', 'Order confirmed from accepted quote')", [orderId]);
    await client.query("update quotes set status = 'accepted' where id = $1", [quoteId]);
    return orderId;
  });
}
```

- [ ] **Step 2: `src/lib/orders.ts`**

```ts
import { query, queryOne, transaction } from '@/lib/db';
import type { Order, OrderItem, OrderStatusEvent, OrderStatus } from '@/lib/types';

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  return query<Order>('select * from orders where customer_id = $1 order by created_at desc', [customerId]);
}

export async function getOrderForCustomer(id: string, customerId: string): Promise<(Order & { items: OrderItem[]; history: OrderStatusEvent[] }) | null> {
  const order = await queryOne<Order>('select * from orders where id = $1 and customer_id = $2', [id, customerId]);
  if (!order) return null;
  const [items, history] = await Promise.all([
    query<OrderItem>('select * from order_items where order_id = $1', [id]),
    query<OrderStatusEvent>('select * from order_status_history where order_id = $1 order by created_at', [id]),
  ]);
  return { ...order, items, history };
}

export async function activeOrderForCustomer(customerId: string): Promise<Order | null> {
  return queryOne<Order>(
    "select * from orders where customer_id = $1 and status <> 'delivered' and status <> 'cancelled' order by created_at desc limit 1",
    [customerId],
  );
}

export async function listOrdersForAdmin(): Promise<(Order & { customer_name: string })[]> {
  return query(
    `select o.*, pr.name as customer_name from orders o join profiles pr on pr.id = o.customer_id order by o.created_at desc`,
  );
}

export async function getOrderForAdmin(id: string): Promise<(Order & { customer_name: string; items: OrderItem[]; history: OrderStatusEvent[] }) | null> {
  const order = await queryOne<Order & { customer_name: string }>(
    'select o.*, pr.name as customer_name from orders o join profiles pr on pr.id = o.customer_id where o.id = $1', [id],
  );
  if (!order) return null;
  const [items, history] = await Promise.all([
    query<OrderItem>('select * from order_items where order_id = $1', [id]),
    query<OrderStatusEvent>('select * from order_status_history where order_id = $1 order by created_at', [id]),
  ]);
  return { ...order, items, history };
}

export async function advanceOrderStatus(orderId: string, status: OrderStatus, note: string | null): Promise<void> {
  await transaction(async (client) => {
    await client.query('update orders set status = $2 where id = $1', [orderId, status]);
    await client.query('insert into order_status_history (order_id, status, note) values ($1, $2, $3)', [orderId, status, note]);
  });
}

export async function setEstDelivery(orderId: string, date: string | null): Promise<void> {
  await query('update orders set est_delivery_date = $2 where id = $1', [orderId, date]);
}

export async function orderCounts(): Promise<{ open: number; quotesPending: number; inProduction: number }> {
  const row = await queryOne<{ open: string; pending: string; prod: string }>(
    `select (select count(*) from orders where status not in ('delivered','cancelled'))::text as open,
            (select count(*) from quotes where status = 'requested')::text as pending,
            (select count(*) from orders where status = 'in_production')::text as prod`,
  );
  return { open: Number(row?.open ?? 0), quotesPending: Number(row?.pending ?? 0), inProduction: Number(row?.prod ?? 0) };
}
```

- [ ] **Step 3: `src/lib/messages.ts`**

```ts
import { query } from '@/lib/db';
import type { Message } from '@/lib/types';

export async function listMessages(customerId: string): Promise<Message[]> {
  return query<Message>('select * from messages where customer_id = $1 order by created_at', [customerId]);
}

export async function sendMessage(customerId: string, sender: 'customer' | 'staff', body: string): Promise<void> {
  await query('insert into messages (customer_id, sender, body) values ($1, $2, $3)', [customerId, sender, body]);
}

export async function markRead(customerId: string, reader: 'customer' | 'staff'): Promise<void> {
  // mark the OTHER party's messages as read
  const other = reader === 'customer' ? 'staff' : 'customer';
  await query('update messages set read_at = now() where customer_id = $1 and sender = $2 and read_at is null', [customerId, other]);
}

export async function listMessageThreads(): Promise<{ customer_id: string; customer_name: string; last_at: string; unread: number }[]> {
  return query(
    `select m.customer_id, pr.name as customer_name, max(m.created_at) as last_at,
       count(*) filter (where m.sender = 'customer' and m.read_at is null)::int as unread
     from messages m join profiles pr on pr.id = m.customer_id
     group by m.customer_id, pr.name order by max(m.created_at) desc`,
  );
}
```

- [ ] **Step 4: Typecheck and commit** `npx tsc --noEmit` then `git add -A && git commit -m "feat(orders): quotes, orders, and messages data layers"`

---

## Task 4: Gated email + server actions

**Files:** Create `src/lib/notify.ts`, `src/app/actions/quotes.ts`, `src/app/actions/orders.ts`, `src/app/actions/messages.ts`.

- [ ] **Step 1: `src/lib/notify.ts`** (gated, best-effort; never throws)

```ts
import { Resend } from 'resend';

const FROM = process.env.HW_EMAIL_FROM ?? 'HW <noreply@heirloomwoodwork.test>';

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Best-effort transactional email. No-op (logs) when RESEND_API_KEY is unset.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!emailEnabled()) {
    console.log(`[email disabled] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, text });
  } catch (e) {
    console.error('sendEmail failed', e);
  }
}
```

- [ ] **Step 2: `src/app/actions/quotes.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { getProfile, requireCustomer, requireStaff } from '@/lib/auth';
import { createQuoteFromConfig, acceptQuote, priceAndSendQuote, getQuoteForAdmin } from '@/lib/quotes';
import { sendEmail } from '@/lib/notify';

export type RequestQuoteResult = { quoteId: string } | { needsAuth: true } | { error: string };

export async function requestQuoteForConfigAction(item: {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; configuration: Record<string, unknown> | null;
}): Promise<RequestQuoteResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  try {
    const quoteId = await createQuoteFromConfig(profile.id, item);
    return { quoteId };
  } catch {
    return { error: 'Could not request a quote. Please try again.' };
  }
}

export async function acceptQuoteAction(quoteId: string): Promise<void> {
  const profile = await requireCustomer();
  const orderId = await acceptQuote(quoteId, profile.id);
  if (orderId) redirect(`/account/orders/${orderId}`);
  redirect('/account/quotes');
}

export async function sendQuoteAction(
  quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null,
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  try {
    await priceAndSendQuote(quoteId, prices, validUntil, notes);
    const quote = await getQuoteForAdmin(quoteId);
    // notify the customer their quote is ready (best-effort)
    const email = quote ? (await getProfile())?.email : null; // placeholder; see note
    void email;
  } catch {
    return { error: 'Could not send the quote.' };
  }
  return { ok: true };
}
```
Note on the customer email in `sendQuoteAction`: fetch the customer's email properly via a query rather than `getProfile()` (which returns the STAFF user). Replace the placeholder lines with:
```ts
import { queryOne } from '@/lib/db';
// ...after priceAndSendQuote:
const row = await queryOne<{ email: string }>(
  'select u.email from quotes q join users u on u.id = q.customer_id where q.id = $1', [quoteId]);
if (row) await sendEmail(row.email, 'Your HW quote is ready', 'Your quote has been priced and sent. View it in your account.');
```
Use this corrected version (remove the `getProfile` placeholder).

- [ ] **Step 3: `src/app/actions/orders.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { queryOne } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { advanceOrderStatus, setEstDelivery } from '@/lib/orders';
import { sendEmail } from '@/lib/notify';
import type { OrderStatus } from '@/lib/types';

export async function advanceOrderAction(orderId: string, status: OrderStatus, note: string): Promise<void> {
  await requireStaff();
  await advanceOrderStatus(orderId, status, note.trim() || null);
  const row = await queryOne<{ email: string }>(
    'select u.email from orders o join users u on u.id = o.customer_id where o.id = $1', [orderId]);
  if (row) await sendEmail(row.email, `Your HW order is now ${status.replace('_', ' ')}`, `Your order status changed to ${status}.`);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function setEstDeliveryAction(orderId: string, date: string): Promise<void> {
  await requireStaff();
  await setEstDelivery(orderId, date || null);
  revalidatePath(`/admin/orders/${orderId}`);
}
```

- [ ] **Step 4: `src/app/actions/messages.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { getProfile, requireStaff } from '@/lib/auth';
import { sendMessage, markRead } from '@/lib/messages';

export async function sendCustomerMessageAction(body: string): Promise<{ ok: true } | { error: string }> {
  const profile = await getProfile();
  if (!profile) return { error: 'Please sign in.' };
  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  await sendMessage(profile.id, 'customer', text.slice(0, 4000));
  revalidatePath('/account/messages');
  return { ok: true };
}

export async function sendStaffMessageAction(customerId: string, body: string): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  await sendMessage(customerId, 'staff', text.slice(0, 4000));
  revalidatePath(`/admin/messages/${customerId}`);
  return { ok: true };
}

export async function markCustomerReadAction(): Promise<void> {
  const profile = await getProfile();
  if (profile) await markRead(profile.id, 'customer');
}
```

- [ ] **Step 5: Install resend (if not present), typecheck, commit**

```bash
cd /Users/expando/github/hw && npm ls resend >/dev/null 2>&1 || npm install resend
npx tsc --noEmit
git add -A && git commit -m "feat(orders): gated email helper and quote/order/message server actions"
```

---

## Task 5: Customer portal (quotes, orders + tracker, messages)

**Files:** Create `src/components/OrderTracker.tsx`, `src/components/account/QuoteAcceptButton.tsx`, `src/components/account/MessageThread.tsx`, `src/app/account/quotes/page.tsx`, `quotes/[id]/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `messages/page.tsx`; modify `src/components/account/PortalSidebar.tsx`, `src/app/account/page.tsx`.

- [ ] **Step 1: `src/components/OrderTracker.tsx`** (shared server component; the 5-step tracker, styled to `docs/mockups/hw_customer.png`)

```tsx
import { ORDER_STEPS, isStepComplete } from '@/lib/order-status';
import type { OrderStatus } from '@/lib/types';

const LABELS: Record<string, string> = { confirmed: 'Confirmed', in_production: 'In Production', shipping: 'Shipping', delivered: 'Delivered' };

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return <p className="text-sm text-red-600">This order was cancelled.</p>;
  return (
    <div className="flex">
      {ORDER_STEPS.map((step, i) => {
        const done = isStepComplete(step, status);
        const current = step === status;
        return (
          <div key={step} className="relative flex-1 text-center">
            {i > 0 && <span className={`absolute left-[-50%] top-[6px] -z-0 h-0.5 w-full ${done ? 'bg-[var(--walnut)]' : 'bg-[var(--line)]'}`} />}
            <span className={`relative z-10 mx-auto mb-2 block h-3.5 w-3.5 rounded-full ${done ? 'bg-[var(--walnut)]' : 'bg-[var(--line)]'} ${current ? 'ring-4 ring-[var(--bone)]' : ''}`} />
            <span className={`text-[11px] ${current ? 'font-medium text-[var(--walnut)]' : 'text-[var(--ink)]'}`}>{LABELS[step]}</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/account/QuoteAcceptButton.tsx`** (client; calls acceptQuoteAction which redirects to the new order)

```tsx
'use client';
import { useState } from 'react';
import { acceptQuoteAction } from '@/app/actions/quotes';
import { Button } from '@/components/ui/button';

export function QuoteAcceptButton({ quoteId }: { quoteId: string }) {
  const [busy, setBusy] = useState(false);
  return <Button disabled={busy} onClick={() => { setBusy(true); acceptQuoteAction(quoteId); }}>{busy ? 'Accepting...' : 'Accept quote'}</Button>;
}
```

- [ ] **Step 3: `src/components/account/MessageThread.tsx`** (client; renders messages + a send box, calls sendCustomerMessageAction; on mount calls markCustomerReadAction)

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendCustomerMessageAction, markCustomerReadAction } from '@/app/actions/messages';
import type { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function MessageThread({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { markCustomerReadAction(); }, []);
  async function send() {
    if (!body.trim() || busy) return;
    setBusy(true);
    const res = await sendCustomerMessageAction(body);
    setBusy(false);
    if ('ok' in res) { setBody(''); router.refresh(); }
  }
  return (
    <div className="max-w-2xl">
      <div className="space-y-3">
        {messages.length === 0 && <p className="text-sm text-[var(--stone)]">No messages yet. Reach out with any question about your pieces.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-lg p-3 text-sm ${m.sender === 'customer' ? 'ml-auto bg-[var(--bone)]' : 'bg-[var(--paper)] border border-[var(--line)]'}`}>
            {m.body}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a message..." />
        <Button onClick={send} disabled={busy}>Send</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/account/PortalSidebar.tsx`** NAV to: Dashboard, Orders (`/account/orders`), Quotes (`/account/quotes`), Favorites, Wood Samples, Messages (`/account/messages`), Profile. (Add the three new entries to the existing NAV array, keep the active-link logic.)

- [ ] **Step 5: Create the customer pages**

`src/app/account/quotes/page.tsx`: list `listQuotesForCustomer(profile.id)`, each row showing status pill + total + a link to `/account/quotes/[id]`.

`src/app/account/quotes/[id]/page.tsx`: await params; `getQuoteForCustomer(id, profile.id)`; notFound if null; show items (title, wood/finish/size, unit price), totals, valid-until, notes; if `status === 'sent'` render `<QuoteAcceptButton quoteId={id} />`.

`src/app/account/orders/page.tsx`: list `listOrdersForCustomer`, status pill + total + link.

`src/app/account/orders/[id]/page.tsx`: await params; `getOrderForCustomer(id, profile.id)`; notFound if null; show `<OrderTracker status={order.status} />`, est delivery date, items, and the status history timeline.

`src/app/account/messages/page.tsx`: `listMessages(profile.id)` -> `<MessageThread messages={...} />`.

Use `getProfile()` in these pages (layout already gates). Use `formatPriceCents`, status pills (bone bg, capitalized), and the serif/eyebrow classes.

- [ ] **Step 6: Update `src/app/account/page.tsx`** to show the active order: call `activeOrderForCustomer(profile.id)`; if present, render a card with `<OrderTracker status={...} />` + est delivery, linking to the order; keep the favorites preview below.

- [ ] **Step 7: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(orders): customer portal quotes, orders with tracker, and messages"`

---

## Task 6: Admin (quotes pricing/send, orders status, messages)

**Files:** Create `src/components/admin/QuotePricingForm.tsx`, `src/components/admin/OrderStatusForm.tsx`, `src/components/admin/AdminMessageThread.tsx`, `src/app/admin/quotes/page.tsx`, `quotes/[id]/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `messages/page.tsx`, `messages/[id]/page.tsx`; modify `src/components/admin/AdminSidebar.tsx`, `src/app/admin/page.tsx`.

- [ ] **Step 1: `src/components/admin/QuotePricingForm.tsx`** (client) takes the quote items; a price input per item (dollars), a valid-until date, a notes textarea; on submit builds `prices: Record<itemId, cents>` and calls `sendQuoteAction(quoteId, prices, validUntil, notes)`; shows sent confirmation. Disable when the quote is not `requested`/`sent`.

- [ ] **Step 2: `src/components/admin/OrderStatusForm.tsx`** (client) a status select (the OrderStatus values), an optional note input, a Save button calling `advanceOrderAction(orderId, status, note)`; and an est-delivery date input calling `setEstDeliveryAction(orderId, date)`.

- [ ] **Step 3: `src/components/admin/AdminMessageThread.tsx`** (client) like MessageThread but calls `sendStaffMessageAction(customerId, body)`; takes customerId + messages.

- [ ] **Step 4: Create the admin pages**

`src/app/admin/quotes/page.tsx`: `listQuotesForAdmin()` table (customer, items, status pill, total, link to detail; requested first).

`src/app/admin/quotes/[id]/page.tsx`: await params; `getQuoteForAdmin(id)`; notFound; show customer + items; render `<QuotePricingForm quoteId items quote/>`.

`src/app/admin/orders/page.tsx`: `listOrdersForAdmin()` table (order short id, customer, status pill, total, link).

`src/app/admin/orders/[id]/page.tsx`: await params; `getOrderForAdmin(id)`; notFound; show customer, items, history timeline, `<OrderTracker status/>`, and `<OrderStatusForm orderId currentStatus estDelivery/>`.

`src/app/admin/messages/page.tsx`: `listMessageThreads()` list (customer name, last message time, unread badge, link to `/admin/messages/[id]`).

`src/app/admin/messages/[id]/page.tsx`: await params (customerId); `listMessages(customerId)` + the customer name; `<AdminMessageThread customerId messages/>`; mark staff-read on load (call markRead(customerId,'staff') in the page or via a small effect; simplest: a server-side markRead before fetching is fine, or skip read-tracking for staff in v1).

- [ ] **Step 5: Update `src/components/admin/AdminSidebar.tsx`** to add (in a Sales group or inline): Orders (`/admin/orders`), Quotes (`/admin/quotes`), Messages (`/admin/messages`), alongside the existing Dashboard/Products/Collections/Wood&Finishes.

- [ ] **Step 6: Update `src/app/admin/page.tsx`** dashboard to also show `orderCounts()` (open orders, quotes pending, in production) as stat cards next to the catalog counts, and a short "Needs attention" list linking to `/admin/quotes` (requested quotes).

- [ ] **Step 7: Verify and commit** `npm run build` then `git add -A && git commit -m "feat(orders): admin quotes pricing, order status management, and messages"`

---

## Task 7: PDP logged-in quote request

**Files:** Modify `src/components/storefront/QuoteRequestForm.tsx`, `src/components/storefront/ProductConfigurator.tsx`, `src/app/product/[slug]/page.tsx`.

- [ ] **Step 1: Modify `QuoteRequestForm.tsx`** to take an `isLoggedIn` prop and a `quoteItem` describing the current configuration. If `isLoggedIn`, the primary "Request a Quote" button calls `requestQuoteForConfigAction(quoteItem)`; on `{quoteId}` show "Quote requested. We will price it and send it to your account." with a link to `/account/quotes`; on `{needsAuth}` (should not happen when logged in) or `{error}` show a message. If NOT logged in, keep the existing inquiry form (name/email/message) which creates an inquiry as before.

- [ ] **Step 2: Modify `ProductConfigurator.tsx`** to accept `isLoggedIn: boolean` and build a `quoteItem` from the live selection (`{ productId: product.id, title: product.name, woodName: wood?.name ?? null, finishName: finish?.name ?? null, sizeLabel: size?.label ?? null, unitPriceCents: price, configuration }`), passing both to `QuoteRequestForm`.

- [ ] **Step 3: Modify `src/app/product/[slug]/page.tsx`** to pass `isLoggedIn={profile !== null}` (it already computes `profile`).

- [ ] **Step 4: Verify and commit** `npx tsc --noEmit && npm run build` then `git add -A && git commit -m "feat(orders): logged-in customers request a real quote from the product page"`

---

## Task 8: End-to-end verification

No new files. Prove the full loop.

- [ ] **Step 1: Reset, typecheck, build, test** `npm run db:reset && npx tsc --noEmit && npm run build && npx vitest run` (all pass; order-status tests included).

- [ ] **Step 2: Loop round-trip via SQL** (the actions are exercised by the UI; this proves the data layer transitions). With a customer + product:

```bash
cd /Users/expando/github/hw
psql -d hw -v ON_ERROR_STOP=1 <<'SQL'
insert into users (email,password_hash) values ('loop@test.local','x');
insert into profiles (id,email,name,role) select id,'loop@test.local','Loop Tester','customer' from users where email='loop@test.local';
-- requested quote with one item
with c as (select id from users where email='loop@test.local'), p as (select id,name from products where slug='the-homestead-table')
insert into quotes (customer_id, status, subtotal_cents, total_cents) select c.id,'requested',320000,320000 from c;
SQL
QID=$(psql -d hw -tAc "select q.id from quotes q join users u on u.id=q.customer_id where u.email='loop@test.local'")
psql -d hw -c "insert into quote_items (quote_id, title_snapshot, unit_price_cents) values ('$QID','The Homestead Table',320000);"
# staff sends (price + status sent)
psql -d hw -c "update quotes set status='sent', subtotal_cents=360000, total_cents=360000 where id='$QID';"
echo "quote status: $(psql -d hw -tAc "select status from quotes where id='$QID'")"
# customer accepts -> order (simulate acceptQuote effect)
CID=$(psql -d hw -tAc "select customer_id from quotes where id='$QID'")
psql -d hw -c "insert into orders (customer_id, quote_id, status, subtotal_cents, total_cents) values ('$CID','$QID','confirmed',360000,360000);"
OID=$(psql -d hw -tAc "select id from orders where quote_id='$QID'")
psql -d hw -c "insert into order_status_history (order_id,status,note) values ('$OID','confirmed','from quote');"
psql -d hw -c "update quotes set status='accepted' where id='$QID';"
psql -d hw -c "update orders set status='in_production' where id='$OID'; insert into order_status_history (order_id,status) values ('$OID','in_production');"
echo "order status: $(psql -d hw -tAc "select status from orders where id='$OID'")"
echo "history rows: $(psql -d hw -tAc "select count(*) from order_status_history where order_id='$OID'")"
# message both ways
psql -d hw -c "insert into messages (customer_id,sender,body) values ('$CID','customer','When will it ship?'),('$CID','staff','Two weeks.');"
echo "messages: $(psql -d hw -tAc "select count(*) from messages where customer_id='$CID'")"
psql -d hw -c "delete from users where email='loop@test.local';"
echo "cleaned; orders left: $(psql -d hw -tAc "select count(*) from orders")"
```
Expected: quote status sent then accepted, order in_production, 2 history rows, 2 messages, cascade cleanup leaves 0 orders.

- [ ] **Step 3: Gate check** (dev server up): `/account/orders`, `/account/quotes`, `/account/messages`, `/admin/quotes`, `/admin/orders`, `/admin/messages` all redirect anonymous to `/login` (307). Stop dev server.

- [ ] **Step 4: Final commit (if anything changed)** `git add -A && git commit -m "test(orders): phase 4 verification" || echo "nothing to commit"`

---

## Done criteria

Phase 4 is complete when: a logged-in customer requests a quote from a product page; staff price and send it; the customer accepts and it becomes a confirmed order; staff advance the order through statuses and the customer sees the production tracker update with a status history; customer and staff exchange messages in a thread; email notifications fire when configured (and no-op otherwise); all portal/admin order routes are role-gated; and `npm run db:reset`, `npx tsc --noEmit`, `npm run build`, and `npx vitest run` all pass. This completes the core platform (Phases 0-4); Phase 5 adds consultations and editorial content, Phase 6 adds Stripe payments.
