import Link from 'next/link';
import type { MessageThreadRich } from '@/lib/messages';
import { timeAgo } from '@/lib/format';

interface Props {
  threads: MessageThreadRich[];
  activeId: string | null;
  children?: React.ReactNode;
}

export function MessagesInbox({ threads, activeId, children }: Props) {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left pane: conversation list */}
      <aside className="w-[320px] shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--paper)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Conversations</div>
        </div>
        {threads.length === 0 && (
          <p className="p-5 text-sm text-[var(--stone)]">No message threads yet.</p>
        )}
        {threads.map((t) => {
          const isActive = t.customer_id === activeId;
          const initial = t.customer_name.charAt(0).toUpperCase();
          const preview =
            t.last_sender === 'staff'
              ? `You: ${t.last_body}`
              : t.last_body;

          return (
            <Link
              key={t.customer_id}
              href={`/admin/messages/${t.customer_id}`}
              className={`flex items-start gap-3 border-b border-[var(--line)] px-5 py-4 transition-colors hover:bg-[var(--cream)] ${
                isActive ? 'bg-[var(--cream)] border-l-2 border-l-[var(--walnut)]' : ''
              }`}
            >
              {/* Initial circle avatar */}
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--walnut)] text-sm font-semibold text-[#fffdfa]">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm font-medium ${isActive ? 'text-[var(--espresso)]' : 'text-[var(--ink)]'}`}>
                    {t.customer_name}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--stone)]">{timeAgo(t.last_at)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-[var(--stone)]">{preview}</p>
                  {t.unread > 0 && (
                    <span className="ml-1 shrink-0 rounded-full bg-[var(--walnut)] px-1.5 py-0.5 text-[10px] font-semibold text-[#fffdfa]">
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </aside>

      {/* Right pane: active thread or empty state */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--cream)]">
        {children ?? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[var(--stone)]">Select a conversation to reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
