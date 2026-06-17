import { notFound } from 'next/navigation';
import { listMessages, markRead, listMessageThreadsRich } from '@/lib/messages';
import { AdminMessageThread } from '@/components/admin/AdminMessageThread';
import { MessagesInbox } from '@/components/admin/MessagesInbox';

export default async function AdminMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;

  // Mark customer messages as read by staff before fetching
  await markRead(customerId, 'staff');

  const [threads, messages] = await Promise.all([
    listMessageThreadsRich(),
    listMessages(customerId),
  ]);

  const thread = threads.find((t) => t.customer_id === customerId);
  if (!thread) notFound();

  const customerName = thread.customer_name;

  return (
    <MessagesInbox threads={threads} activeId={customerId}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Thread header */}
        <div className="shrink-0 border-b border-[var(--line)] bg-[var(--paper)] px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--walnut)] text-sm font-semibold text-[#fffdfa] float-left mr-3">
            {customerName.charAt(0).toUpperCase()}
          </div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Conversation</div>
          <h2 className="serif text-xl text-[var(--ink)]">{customerName}</h2>
        </div>

        {/* Thread body + composer fill the rest of the pane */}
        <div className="min-h-0 flex-1">
          <AdminMessageThread customerId={customerId} messages={messages} />
        </div>
      </div>
    </MessagesInbox>
  );
}
