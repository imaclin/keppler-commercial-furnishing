import Link from 'next/link';
import { ShoppingBag, FileText, MessageSquare } from 'lucide-react';
import {
  getKpis,
  revenueByMonth,
  ordersByStatus,
  topProducts,
  recentActivity,
  attentionCounts,
  quotePipeline,
} from '@/lib/analytics';
import { KpiCard } from '@/components/admin/KpiCard';
import { AreaChart } from '@/components/admin/charts/AreaChart';
import { BarList } from '@/components/admin/charts/BarList';
import { StatusBar } from '@/components/admin/charts/StatusBar';
import { formatPriceCents, timeAgo } from '@/lib/format';

export default async function AdminDashboard() {
  const [kpis, revenue, statuses, products, activity, attention, pipeline] = await Promise.all([
    getKpis(),
    revenueByMonth(12),
    ordersByStatus(),
    topProducts(6),
    recentActivity(12),
    attentionCounts(),
    quotePipeline(),
  ]);

  const revTrailing12 = revenue.reduce((sum, r) => sum + r.cents, 0);
  const revSparkline = revenue.map((r) => r.cents);

  const now = new Date();
  const periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <main className="p-8">
      {/* Header */}
      <div className="flex items-baseline gap-4 mb-8">
        <h1 className="serif text-4xl text-[var(--ink)]">Overview</h1>
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">{periodLabel}</span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Revenue MTD"
          value={formatPriceCents(kpis.revenueMtdCents)}
          delta={kpis.revenueDeltaPct}
          spark={revSparkline}
        />
        <KpiCard
          label="Open Orders"
          value={String(kpis.openOrders)}
        />
        <KpiCard
          label="In Production"
          value={String(kpis.inProduction)}
        />
        <KpiCard
          label="Overdue"
          value={String(kpis.overdue)}
          tone={kpis.overdue > 0 ? 'warn' : 'default'}
        />
        <KpiCard
          label="Quotes Pending"
          value={String(kpis.quotesPending)}
        />
        <KpiCard
          label="Quote Win Rate"
          value={kpis.quoteWinRatePct !== null ? `${kpis.quoteWinRatePct}%` : 'n/a'}
        />
        <KpiCard
          label="Avg Order Value"
          value={formatPriceCents(kpis.avgOrderValueCents)}
        />
        <KpiCard
          label="Samples Outstanding"
          value={String(kpis.samplesOutstanding)}
        />
      </div>

      {/* Revenue chart + Order status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue panel */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)] mb-1">Revenue, last 12 months</div>
          <div className="serif text-2xl text-[var(--ink)] mb-4">{formatPriceCents(revTrailing12)}</div>
          <AreaChart data={revenue.map((r) => ({ label: r.label, value: r.cents }))} />
        </div>

        {/* Order status + quote pipeline */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 flex flex-col gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)] mb-3">Order status</div>
            <StatusBar segments={statuses} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)] mb-3">Quote pipeline</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-[var(--ink)]">
                <span className="text-[var(--stone)] mr-1">Requested</span>{pipeline.requested}
              </span>
              <span className="text-[var(--ink)]">
                <span className="text-[var(--stone)] mr-1">Sent</span>{pipeline.sent}
              </span>
              <span className="text-[var(--ink)]">
                <span className="text-[var(--stone)] mr-1">Accepted</span>{pipeline.accepted}
              </span>
              <span className="text-[var(--ink)]">
                <span className="text-[var(--stone)] mr-1">Declined/Expired</span>{pipeline.declinedExpired}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top products + Needs attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top products */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="serif text-base text-[var(--ink)] mb-4">Top products</div>
          <BarList
            items={products.map((p) => ({
              label: p.name,
              value: p.cents,
              display: formatPriceCents(p.cents),
            }))}
          />
        </div>

        {/* Needs attention */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
          <div className="serif text-base text-[var(--ink)] mb-4">Needs attention</div>
          <div className="space-y-3">
            <AttentionRow
              label="Quotes to price"
              count={attention.quotesToPrice}
              href="/admin/quotes"
            />
            <AttentionRow
              label="Unread messages"
              count={attention.unreadMessages}
              href="/admin/messages"
            />
            <AttentionRow
              label="Overdue orders"
              count={attention.overdueOrders}
              href="/admin/orders?status=overdue"
            />
            <AttentionRow
              label="Samples to ship"
              count={attention.samplesToShip}
              href="/admin/orders"
            />
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="serif text-base text-[var(--ink)] mb-4">Recent activity</div>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--stone)]">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {activity.map((item, i) => {
              const Icon =
                item.kind === 'order'
                  ? ShoppingBag
                  : item.kind === 'quote'
                  ? FileText
                  : MessageSquare;
              return (
                <li key={i} className="py-3">
                  <Link href={item.href} className="flex items-start gap-3 hover:opacity-75 transition-opacity">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-[var(--stone)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[var(--ink)] truncate">{item.label}</div>
                      <div className="text-xs text-[var(--stone)] truncate mt-0.5">{item.sub}</div>
                    </div>
                    <div className="text-xs text-[var(--stone)] shrink-0">{timeAgo(item.at)}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function AttentionRow({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between py-2 px-3 border ${
        active
          ? 'border-[var(--walnut)] bg-[var(--cream)] text-[var(--ink)]'
          : 'border-transparent text-[var(--stone)]'
      } hover:border-[var(--walnut)] transition-colors`}
    >
      <span className="text-sm">{label}</span>
      <span
        className={`serif text-lg font-medium ${
          active ? 'text-[#9a6b3a]' : 'text-[var(--stone)]'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
