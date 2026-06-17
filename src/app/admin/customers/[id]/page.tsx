import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomer } from '@/lib/customers';
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

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const { profile, orders, quotes, samples, ltvCents } = customer;

  return (
    <main className="p-8">
      <div className="mb-6">
        <Link href="/admin/customers" className="text-xs uppercase tracking-[0.12em] text-[var(--stone)] hover:text-[var(--ink)]">
          Customers
        </Link>
        <span className="mx-2 text-[var(--stone)]">/</span>
        <span className="text-xs uppercase tracking-[0.12em] text-[var(--ink)]">{profile.name}</span>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="serif text-3xl text-[var(--ink)]">{profile.name}</h1>
          <p className="mt-1 text-sm text-[var(--stone)]">{profile.email}</p>
          <p className="mt-0.5 text-xs text-[var(--stone)]">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">Lifetime Value</div>
          <div className="serif mt-1 text-2xl text-[var(--ink)]">{formatPriceCents(ltvCents)}</div>
          <Link
            href={`/admin/messages/${profile.id}`}
            className="mt-2 inline-block border border-[var(--line)] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--cream)]"
          >
            Message
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 lg:col-span-1">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">
            Orders ({(orders as { id: string }[]).length})
          </div>
          {(orders as { id: string; status: string; total_cents: number; created_at: string }[]).length === 0 ? (
            <p className="text-sm text-[var(--stone)]">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {(orders as { id: string; status: string; total_cents: number; created_at: string }[]).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-sm font-medium text-[var(--ink)] hover:underline"
                    >
                      #{o.id.slice(0, 8)}
                    </Link>
                    <div className="text-xs text-[var(--stone)]">{timeAgo(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <StatusPill status={o.status} />
                    <div className="mt-0.5 text-xs text-[var(--stone)]">{formatPriceCents(o.total_cents)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quotes */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 lg:col-span-1">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">
            Quotes ({(quotes as { id: string }[]).length})
          </div>
          {(quotes as { id: string; status: string; total_cents: number; created_at: string }[]).length === 0 ? (
            <p className="text-sm text-[var(--stone)]">No quotes yet.</p>
          ) : (
            <ul className="space-y-3">
              {(quotes as { id: string; status: string; total_cents: number; created_at: string }[]).map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/quotes/${q.id}`}
                      className="text-sm font-medium text-[var(--ink)] hover:underline"
                    >
                      #{q.id.slice(0, 8)}
                    </Link>
                    <div className="text-xs text-[var(--stone)]">{timeAgo(q.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <StatusPill status={q.status} />
                    {q.total_cents > 0 && (
                      <div className="mt-0.5 text-xs text-[var(--stone)]">{formatPriceCents(q.total_cents)}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Samples */}
        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 lg:col-span-1">
          <div className="mb-4 text-[10px] uppercase tracking-[0.12em] text-[var(--stone)]">
            Sample Requests ({(samples as { id: string }[]).length})
          </div>
          {(samples as { id: string; status: string; wood: string | null; finish: string | null; created_at: string }[]).length === 0 ? (
            <p className="text-sm text-[var(--stone)]">No sample requests.</p>
          ) : (
            <ul className="space-y-3">
              {(samples as { id: string; status: string; wood: string | null; finish: string | null; created_at: string }[]).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm text-[var(--ink)]">
                      {[s.wood, s.finish].filter(Boolean).join(' / ') || 'Sample'}
                    </div>
                    <div className="text-xs text-[var(--stone)]">{timeAgo(s.created_at)}</div>
                  </div>
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
