import Link from 'next/link';
import { listMessageThreads } from '@/lib/messages';

export default async function AdminMessagesPage() {
  const threads = await listMessageThreads();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Messages</h1>
      <div className="mt-8 max-w-2xl space-y-2">
        {threads.length === 0 && (
          <p className="text-sm text-[var(--stone)]">No message threads yet.</p>
        )}
        {threads.map((t) => (
          <Link
            key={t.customer_id}
            href={`/admin/messages/${t.customer_id}`}
            className="flex items-center justify-between border border-[var(--line)] bg-[var(--paper)] p-4 hover:border-[var(--walnut)]"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-[var(--ink)] text-sm">{t.customer_name}</span>
              {t.unread > 0 && (
                <span className="rounded-full bg-[var(--walnut)] px-2 py-0.5 text-[10px] text-[#fffdfa]">
                  {t.unread} unread
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--stone)]">
              {new Date(t.last_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
