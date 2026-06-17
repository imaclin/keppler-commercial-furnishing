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
