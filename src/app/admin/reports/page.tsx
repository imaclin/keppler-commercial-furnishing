import Link from 'next/link';
import { revenueByMonth, ordersByStatus, topProducts, quotePipeline, getKpis } from '@/lib/analytics';
import { listCustomers } from '@/lib/customers';
import { AreaChart } from '@/components/admin/charts/AreaChart';
import { BarList } from '@/components/admin/charts/BarList';
import { StatusBar } from '@/components/admin/charts/StatusBar';
import { formatPriceCents } from '@/lib/format';

export default async function AdminReportsPage() {
  const [revenue, statuses, products, funnel, kpis, topCustomers] = await Promise.all([
    revenueByMonth(12),
    ordersByStatus(),
    topProducts(6),
    quotePipeline(),
    getKpis(),
    listCustomers(undefined),
  ]);

  const trailing12Total = revenue.reduce((sum, m) => sum + m.cents, 0);
  const topCustomerItems = topCustomers.slice(0, 6).map((c) => ({
    label: c.name,
    value: c.ltv_cents,
    display: formatPriceCents(c.ltv_cents),
  }));
  const topProductItems = products.map((p) => ({
    label: p.name,
    value: p.cents,
    display: formatPriceCents(p.cents),
  }));
  const winRate = funnel.requested + funnel.sent + funnel.accepted + funnel.declinedExpired > 0
    ? Math.round((funnel.accepted / (funnel.accepted + funnel.declinedExpired || 1)) * 100)
    : null;

  return (
    <main className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="serif text-3xl text-[var(--ink)]">Reports</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reports/export?type=orders"
            className="border border-[var(--line)] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--cream)]"
          >
            Export orders (CSV)
          </Link>
          <Link
            href="/admin/reports/export?type=customers"
            className="border border-[var(--line)] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--cream)]"
          >
            Export customers (CSV)
          </Link>
        </div>
      </div>

      {/* Revenue section */}
      <div className="mb-6 border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Revenue (12 months)</div>
        <div className="mb-4 flex items-baseline gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--stone)]">Trailing 12 months</div>
            <div className="serif mt-0.5 text-2xl text-[var(--ink)]">{formatPriceCents(trailing12Total)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--stone)]">MTD</div>
            <div className="serif mt-0.5 text-2xl text-[var(--ink)]">{formatPriceCents(kpis.revenueMtdCents)}</div>
          </div>
        </div>
        <AreaChart data={revenue.map((m) => ({ label: m.label, value: m.cents }))} height={160} />
        <div className="mt-2 flex justify-between text-[10px] text-[var(--stone)]">
          <span>{revenue[0]?.label}</span>
          <span>{revenue[revenue.length - 1]?.label}</span>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Quote conversion funnel */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Quote Conversion Funnel</div>
          <div className="space-y-3">
            {[
              { label: 'Requested', value: funnel.requested },
              { label: 'Sent', value: funnel.sent },
              { label: 'Accepted', value: funnel.accepted },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink)]">{step.label}</span>
                  <span className="text-[var(--stone)]">{step.value}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--bone)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--walnut)]"
                    style={{ width: `${funnel.requested > 0 ? (step.value / funnel.requested) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2">
              {winRate !== null ? (
                <span className="text-sm text-[var(--stone)]">
                  Win rate: <span className="font-medium text-[var(--ink)]">{winRate}%</span> of closed quotes
                </span>
              ) : (
                <span className="text-sm text-[var(--stone)]">No closed quotes yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Order status pipeline */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Order Status Pipeline</div>
          {statuses.length > 0 ? (
            <StatusBar segments={statuses} />
          ) : (
            <p className="text-sm text-[var(--stone)]">No orders yet.</p>
          )}
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--stone)]">Outstanding samples</div>
            <div className="serif mt-0.5 text-2xl text-[var(--ink)]">{kpis.samplesOutstanding}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Top Products by Revenue</div>
          <BarList items={topProductItems} />
        </div>

        {/* Top customers */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Top Customers by Lifetime Value</div>
          <BarList items={topCustomerItems} />
        </div>
      </div>
    </main>
  );
}
