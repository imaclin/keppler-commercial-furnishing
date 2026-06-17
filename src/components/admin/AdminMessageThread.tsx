'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { sendStaffMessageAction } from '@/app/actions/messages';
import type { Message } from '@/lib/types';

interface Props {
  customerId: string;
  messages: Message[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminMessageThread({ customerId, messages }: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function send() {
    if (!body.trim() || busy) return;
    setError(null);
    setBusy(true);
    const result = await sendStaffMessageAction(customerId, body);
    setBusy(false);
    if ('ok' in result) {
      setBody('');
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--stone)]">No messages yet in this thread.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender === 'staff';
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine
                    ? 'rounded-br-md bg-[var(--espresso)] text-[#fffdfa]'
                    : 'rounded-bl-md border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]'
                }`}
              >
                {m.body}
              </div>
              <span className="mt-1 px-1 text-[10px] text-[var(--stone)]">
                {mine ? 'You' : 'Customer'} · {formatTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--line)] bg-[var(--paper)] px-6 py-4">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex items-end gap-3 rounded-2xl border border-[var(--line)] bg-[var(--cream)] px-3 py-2 focus-within:border-[var(--stone)]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Write a reply...  (Enter to send, Shift+Enter for a new line)"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--stone)]"
          />
          <button
            onClick={send}
            disabled={busy || !body.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--espresso)] text-[#fffdfa] transition-colors hover:bg-[var(--walnut)] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
