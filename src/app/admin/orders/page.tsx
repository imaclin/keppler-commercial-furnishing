import { listOrdersForAdminRich } from '@/lib/orders';
import { OrdersTable } from '@/components/admin/OrdersTable';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const rows = await listOrdersForAdminRich({ status, q });

  return (
    <main className="p-8">
      <h1 className="serif text-3xl text-[var(--ink)]">Orders</h1>
      <div className="mt-6">
        <OrdersTable rows={rows} status={status} q={q} />
      </div>
    </main>
  );
}
