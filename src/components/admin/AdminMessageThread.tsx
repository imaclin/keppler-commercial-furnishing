'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendStaffMessageAction } from '@/app/actions/messages';
import type { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  customerId: string;
  messages: Message[];
}

export function AdminMessageThread({ customerId, messages }: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl">
      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--stone)]">No messages yet in this thread.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-lg p-3 text-sm ${
              m.sender === 'staff'
                ? 'ml-auto bg-[var(--espresso)] text-[#fffdfa]'
                : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)]'
            }`}
          >
            <div className="mb-1 text-[10px] uppercase tracking-[0.1em] opacity-60">
              {m.sender === 'staff' ? 'You' : 'Customer'}
            </div>
            {m.body}
            <div className="mt-1 text-[10px] opacity-50">
              {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Reply to customer..."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          onClick={send}
          disabled={busy || !body.trim()}
          className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]"
        >
          {busy ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </div>
  );
}
