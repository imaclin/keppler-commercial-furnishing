'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPriceCents, timeAgo } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-[#eef3eb] text-[#5b7355]',
  in_production: 'bg-[#f7f0e6] text-[#9a6b3a]',
  shipping: 'bg-[#e8eef4] text-[#4a6076]',
  delivered: 'bg-[#ede9e4] text-[#6b4f3a]',
  cancelled: 'bg-[#f0ede8] text-[#9a8e7c]',
  requested: 'bg-[#f0ede8] text-[#8c8175]',
  sent: 'bg-[#e8eef4] text-[#4a6076]',
  accepted: 'bg-[#eef3eb] text-[#5b7355]',
  declined: 'bg-[#f0ede8] text-[#9a8e7c]',
  expired: 'bg-[#f0ede8] text-[#9a8e7c]',
  pending: 'bg-[#f7f0e6] text-[#9a6b3a]',
  shipped: 'bg-[#e8eef4] text-[#4a6076]',
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-[var(--bone)] text-[var(--stone)]';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

type SaleRow = { id: string; status: string; total_cents: number; created_at: string };
type SampleRow = { id: string; status: string; wood: string | null; finish: string | null; created_at: string };

export function CustomerActivityTabs({
  orders, quotes, samples,
}: {
  orders: SaleRow[];
  quotes: SaleRow[];
  samples: SampleRow[];
}) {
  const tabs = [
    { key: 'orders' as const, label: 'Orders', count: orders.length },
    { key: 'quotes' as const, label: 'Quotes', count: quotes.length },
    { key: 'samples' as const, label: 'Sample Requests', count: samples.length },
  ];
  const [active, setActive] = useState<'orders' | 'quotes' | 'samples'>('orders');

  return (
    <div>
      <div className="flex gap-6 border-b border-[var(--line)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm transition-colors ${
              active === t.key
                ? 'border-[var(--walnut)] font-medium text-[var(--ink)]'
                : 'border-transparent text-[var(--stone)] hover:text-[var(--ink)]'
            }`}
          >
            {t.label} <span className="text-[var(--stone)]">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === 'orders' && (
          <SaleList rows={orders} hrefBase="/admin/orders" empty="No orders yet." />
        )}
        {active === 'quotes' && (
          <SaleList rows={quotes} hrefBase="/admin/quotes" empty="No quotes yet." hideZeroTotal />
        )}
        {active === 'samples' && (
          samples.length === 0 ? (
            <p className="text-sm text-[var(--stone)]">No sample requests.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
              {samples.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <div className="text-sm text-[var(--ink)]">{[s.wood, s.finish].filter(Boolean).join(' / ') || 'Sample'}</div>
                    <div className="text-xs text-[var(--stone)]">{timeAgo(s.created_at)}</div>
                  </div>
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function SaleList({ rows, hrefBase, empty, hideZeroTotal }: { rows: SaleRow[]; hrefBase: string; empty: string; hideZeroTotal?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--stone)]">{empty}</p>;
  return (
    <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-[var(--bone)]/50">
          <div>
            <Link href={`${hrefBase}/${r.id}`} className="text-sm font-medium text-[var(--ink)] hover:underline">#{r.id.slice(0, 8)}</Link>
            <div className="text-xs text-[var(--stone)]">{timeAgo(r.created_at)}</div>
          </div>
          <div className="text-right">
            <StatusPill status={r.status} />
            {!(hideZeroTotal && r.total_cents === 0) && (
              <div className="mt-0.5 text-xs text-[var(--stone)]">{formatPriceCents(r.total_cents)}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
