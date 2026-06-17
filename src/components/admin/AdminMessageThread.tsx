'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendStaffMessageAction } from '@/app/actions/messages';
import type { Message, Attachment } from '@/lib/types';
import { MessageComposer } from '@/components/messages/MessageComposer';
import { MessageAttachments } from '@/components/messages/MessageAttachments';

interface Props {
  customerId: string;
  messages: Message[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminMessageThread({ customerId, messages }: Props) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend(body: string, attachments: Attachment[]) {
    const result = await sendStaffMessageAction(customerId, body, attachments);
    if ('ok' in result) router.refresh();
    return result;
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
                {m.body && <div className="whitespace-pre-line">{m.body}</div>}
                <MessageAttachments attachments={m.attachments} onLight={!mine} />
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
        <MessageComposer onSend={handleSend} placeholder="Write a reply...  (Enter to send, Shift+Enter for a new line)" />
      </div>
    </div>
  );
}
