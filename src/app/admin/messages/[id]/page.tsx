import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listMessages, markRead } from '@/lib/messages';
import { queryOne } from '@/lib/db';
import { AdminMessageThread } from '@/components/admin/AdminMessageThread';

export default async function AdminMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;

  const customer = await queryOne<{ name: string }>(
    'select name from profiles where id = $1',
    [customerId],
  );
  if (!customer) notFound();

  // mark customer messages as read by staff
  await markRead(customerId, 'staff');

  const messages = await listMessages(customerId);

  return (
    <main className="p-10">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/messages" className="text-xs text-[var(--walnut)] hover:underline">Messages</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-xs text-[var(--stone)]">{customer.name}</span>
      </div>

      <h1 className="serif mt-4 text-3xl text-[var(--ink)]">{customer.name}</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--stone)]">Message thread</p>

      <AdminMessageThread customerId={customerId} messages={messages} />
    </main>
  );
}
