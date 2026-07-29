'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendCustomerMessageAction, markCustomerReadAction } from '@/app/actions/messages';
import type { Message, Attachment } from '@/lib/types';
import { MessageComposer } from '@/components/messages/MessageComposer';
import { MessageAttachments } from '@/components/messages/MessageAttachments';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function MessageThread({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { markCustomerReadAction(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  async function handleSend(body: string, attachments: Attachment[]) {
    const res = await sendCustomerMessageAction(body, attachments);
    if ('ok' in res) router.refresh();
    return res;
  }

  return (
    <div className="flex h-[calc(100vh-300px)] min-h-[420px] max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--stone)]">No messages yet. Reach out with any question about your pieces.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender === 'customer';
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine
                    ? 'rounded-br-md bg-[var(--walnut)] text-[#fffdfa]'
                    : 'rounded-bl-md border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)]'
                }`}
              >
                {m.body && <div className="whitespace-pre-line">{m.body}</div>}
                <MessageAttachments attachments={m.attachments} onLight={!mine} />
              </div>
              <span className="mt-1 px-1 text-[10px] text-[var(--stone)]">
                {mine ? 'You' : 'GS Chairs'} · {formatTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--line)] px-4 py-3">
        <MessageComposer onSend={handleSend} accentClass="bg-[var(--walnut)] hover:bg-[var(--espresso)]" placeholder="Write a message...  (Enter to send)" />
      </div>
    </div>
  );
}
