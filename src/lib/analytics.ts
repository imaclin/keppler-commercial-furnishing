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
