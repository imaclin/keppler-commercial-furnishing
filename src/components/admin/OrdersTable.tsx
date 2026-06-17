'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { AdminOrderRow } from '@/lib/orders';
import { formatPriceCents, timeAgo } from '@/lib/format';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Production', value: 'in_production' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Overdue', value: 'overdue' },
] as const;

const STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-[#e8efe4] text-[#5b7355]',
  in_production: 'bg-[#f3e8da] text-[#9a6b3a]',
  shipping: 'bg-[#e4ebf0] text-[#4a6076]',
  delivered: 'bg-[var(--bone)] text-[var(--stone)]',
  cancelled: 'bg-red-50 text-red-700',
};

interface Props {
  rows: AdminOrderRow[];
  status?: string;
  q?: string;
}

export function OrdersTable({ rows, status = 'all', q = '' }: Props) {
  const activeTab = status || 'all';

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--line)] pb-0">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const params = new URLSearchParams();
          if (tab.value !== 'all') params.set('status', tab.value);
          if (q) params.set('q', q);
          const href = `/admin/orders${params.toString() ? `?${params.toString()}` : ''}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] border-b-2 transition-colors ${
                isActive
                  ? 'border-[var(--walnut)] text-[var(--walnut)]'
                  : 'border-transparent text-[var(--stone)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search box */}
      <form method="GET" action="/admin/orders" className="mt-4 flex items-center gap-3">
        {status && status !== 'all' && (
          <input type="hidden" name="status" value={status} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by customer name..."
          className="w-64 border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--stone)] focus:border-[var(--walnut)] focus:outline-none"
        />
        <button
          type="submit"
          className="bg-[var(--espresso)] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#fffdfa] hover:bg-[var(--walnut)]"
        >
          Search
        </button>
        {q && (
          <Link
            href={`/admin/orders${status && status !== 'all' ? `?status=${status}` : ''}`}
            className="text-xs text-[var(--stone)] hover:text-[var(--ink)]"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
              <th className="py-3 pr-4">Item</th>
              <th className="py-3 pr-4">Customer</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Ordered</th>
              <th className="py-3 pr-4">Est. Delivery</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group border-b border-[var(--line)] hover:bg-[var(--bone)]/30 transition-colors">
                {/* Thumbnail + item summary */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {row.first_image ? (
                      <img
                        src={row.first_image}
                        alt={row.first_item ?? 'Item'}
                        className="h-10 w-10 shrink-0 rounded object-cover bg-[var(--bone)]"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded bg-[var(--bone)]" />
                    )}
                    <div>
                      <div className="font-medium text-[var(--ink)] leading-tight">
                        {row.first_item ?? 'Unknown item'}
                      </div>
                      {row.item_count > 1 && (
                        <div className="text-xs text-[var(--stone)]">+{row.item_count - 1} more</div>
                      )}
                      <div className="text-[10px] font-mono text-[var(--stone)] mt-0.5">{row.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                {/* Customer */}
                <td className="py-3 pr-4 font-medium text-[var(--ink)]">{row.customer_name}</td>
                {/* Status pill */}
                <td className="py-3 pr-4">
                  <span className={`rounded px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] ${STATUS_PILL[row.status] ?? 'bg-[var(--bone)] text-[var(--ink)]'}`}>
                    {row.status.replaceAll('_', ' ')}
                  </span>
                </td>
                {/* Total */}
                <td className="py-3 pr-4 text-[var(--ink)]">{formatPriceCents(row.total_cents)}</td>
                {/* Ordered */}
                <td className="py-3 pr-4 text-[var(--stone)]">{timeAgo(row.created_at)}</td>
                {/* Est delivery + overdue chip */}
                <td className="py-3 pr-4">
                  {row.est_delivery_date ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[var(--stone)] text-sm">
                        {new Date(row.est_delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {row.overdue && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-red-600 font-medium">
                          Overdue
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--stone)] text-xs">Not set</span>
                  )}
                </td>
                {/* Chevron link */}
                <td className="py-3">
                  <Link
                    href={`/admin/orders/${row.id}`}
                    className="flex items-center text-[var(--walnut)] opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`View order ${row.id.slice(0, 8)}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[var(--stone)]">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length === 200 && (
        <p className="mt-3 text-xs text-[var(--stone)]">Showing first 200 results. Use filters to narrow down.</p>
      )}
    </div>
  );
}
