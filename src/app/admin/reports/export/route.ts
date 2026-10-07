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
      `select pr.name, u.email, cast((select count(*) from orders o where o.customer_id=pr.id) as text) as orders,
         cast(coalesce((select sum(total_cents) from orders o where o.customer_id=pr.id),0)/100 as text) as ltv
       from profiles pr join users u on u.id=pr.id where pr.role='customer'
       order by coalesce((select sum(total_cents) from orders o where o.customer_id=pr.id),0) desc`);
    header = ['Name', 'Email', 'Orders', 'Lifetime Value'];
    body = rows.map((r) => [r.name, r.email, r.orders, `$${r.ltv}`]);
  } else {
    const rows = await query<{ id: string; created_at: string; name: string; status: string; total: string; eta: string | null }>(
      `select o.id, substr(o.created_at, 1, 10) as created_at, pr.name, o.status, cast(o.total_cents/100 as text) as total, o.est_delivery_date as eta
         from orders o join profiles pr on pr.id=o.customer_id order by o.created_at desc`);
    header = ['Order', 'Date', 'Customer', 'Status', 'Total', 'Est Delivery'];
    body = rows.map((r) => [r.id.slice(0, 8), r.created_at, r.name, r.status, `$${r.total}`, r.eta ?? '']);
  }
  const out = csv([header, ...body]);
  return new NextResponse(out, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="keppler-${type}.csv"` } });
}
