import { query, queryOne, nowPlus } from '@/lib/db';
import { lastNMonths, pctDelta } from '@/lib/analytics-format';

export type Kpis = {
  revenueMtdCents: number; revenueDeltaPct: number | null;
  openOrders: number; inProduction: number; overdue: number;
  quotesPending: number; quoteWinRatePct: number | null;
  avgOrderValueCents: number; newCustomers30d: number; samplesOutstanding: number;
};

// Timestamps are ISO text, so "same month" is a comparison of their YYYY-MM
// prefix, and est_delivery_date (YYYY-MM-DD) compares directly with date('now').
const OVERDUE = "status not in ('delivered','cancelled') and est_delivery_date is not null and est_delivery_date < date('now')";

export async function getKpis(): Promise<Kpis> {
  const row = await queryOne<Record<string, number | null>>(`
    select
      coalesce((select sum(total_cents) from orders where strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')), 0) as rev_mtd,
      coalesce((select sum(total_cents) from orders where strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'start of month', '-1 month')), 0) as rev_prev,
      (select count(*) from orders where status not in ('delivered','cancelled')) as open_orders,
      (select count(*) from orders where status = 'in_production') as in_production,
      (select count(*) from orders where ${OVERDUE}) as overdue,
      (select count(*) from quotes where status = 'requested') as quotes_pending,
      (select count(*) from quotes where status = 'accepted') as quotes_accepted,
      (select count(*) from quotes where status in ('accepted','declined','expired')) as quotes_closed,
      coalesce((select avg(total_cents) from orders), 0) as aov,
      (select count(*) from profiles where role='customer' and created_at >= ${nowPlus('-30 days')}) as new_cust,
      (select count(*) from sample_requests where status = 'requested') as samples_out
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
  const rows = await query<{ ym: string; cents: number }>(`
    select strftime('%Y-%m', created_at) as ym, sum(total_cents) as cents
    from orders where created_at >= date('now', 'start of month', '-${months - 1} months')
    group by 1`);
  const map = new Map(rows.map((r) => [r.ym, Number(r.cents)]));
  return lastNMonths(months).map((ym) => ({ label: ym, cents: map.get(ym) ?? 0 }));
}

export async function ordersByStatus(): Promise<{ status: string; count: number }[]> {
  return (await query<{ status: string; count: number }>(
    `select status, count(*) as count from orders group by status`,
  )).map((r) => ({ status: r.status, count: Number(r.count) }));
}

export async function topProducts(limit = 6): Promise<{ name: string; units: number; cents: number }[]> {
  return (await query<{ name: string; units: number; cents: number }>(`
    select title_snapshot as name, sum(quantity) as units, sum(quantity*unit_price_cents) as cents
    from order_items group by title_snapshot order by sum(quantity*unit_price_cents) desc limit ${limit}`))
    .map((r) => ({ name: r.name, units: Number(r.units), cents: Number(r.cents) }));
}

export type ActivityItem = { kind: 'order' | 'quote' | 'message'; label: string; sub: string; href: string; at: string };

export async function recentActivity(limit = 12): Promise<ActivityItem[]> {
  return query<ActivityItem>(`
    select 'order' as kind, pr.name as label, 'Order ' || o.status as sub, '/admin/orders/' || o.id as href, o.created_at as at
       from orders o join profiles pr on pr.id = o.customer_id
    union all
    select 'quote', pr.name, 'Quote ' || q.status, '/admin/quotes/' || q.id, q.created_at
       from quotes q join profiles pr on pr.id = q.customer_id
    union all
    select 'message', pr.name, substr(m.body, 1, 60), '/admin/messages/' || m.customer_id, m.created_at
       from messages m join profiles pr on pr.id = m.customer_id where m.sender = 'customer'
    order by at desc limit ${limit}`);
}

export type AttentionCounts = { quotesToPrice: number; unreadMessages: number; overdueOrders: number; samplesToShip: number };

export async function attentionCounts(): Promise<AttentionCounts> {
  const row = await queryOne<Record<string, number>>(`
    select
      (select count(*) from quotes where status='requested') as q,
      (select count(distinct customer_id) from messages where sender='customer' and read_at is null) as m,
      (select count(*) from orders where ${OVERDUE}) as o,
      (select count(*) from sample_requests where status='requested') as s`);
  return { quotesToPrice: Number(row?.q ?? 0), unreadMessages: Number(row?.m ?? 0), overdueOrders: Number(row?.o ?? 0), samplesToShip: Number(row?.s ?? 0) };
}

// Quote pipeline funnel counts.
export async function quotePipeline(): Promise<{ requested: number; sent: number; accepted: number; declinedExpired: number }> {
  const rows = await query<{ status: string; count: number }>(`select status, count(*) as count from quotes group by status`);
  const m = new Map(rows.map((r) => [r.status, Number(r.count)]));
  return { requested: m.get('requested') ?? 0, sent: m.get('sent') ?? 0, accepted: m.get('accepted') ?? 0, declinedExpired: (m.get('declined') ?? 0) + (m.get('expired') ?? 0) };
}
