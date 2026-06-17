import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomer } from '@/lib/customers';
import { formatPriceCents } from '@/lib/format';
import { CustomerActivityTabs } from '@/components/admin/CustomerActivityTabs';

type SaleRow = { id: string; status: string; total_cents: number; created_at: string };
type SampleRow = { id: string; status: string; wood: string | null; finish: string | null; created_at: string };

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

      <CustomerActivityTabs
        orders={orders as SaleRow[]}
        quotes={quotes as SaleRow[]}
        samples={samples as SampleRow[]}
      />
    </main>
  );
}
