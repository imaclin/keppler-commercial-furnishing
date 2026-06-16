'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendCustomerMessageAction, markCustomerReadAction } from '@/app/actions/messages';
import type { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function MessageThread({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { markCustomerReadAction(); }, []);
  async function send() {
    if (!body.trim() || busy) return;
    setError(null);
    setBusy(true);
    const res = await sendCustomerMessageAction(body);
    setBusy(false);
    if ('ok' in res) { setBody(''); router.refresh(); }
    else if ('error' in res) { setError(res.error); }
  }
  return (
    <div className="max-w-2xl">
      <div className="space-y-3">
        {messages.length === 0 && <p className="text-sm text-[var(--stone)]">No messages yet. Reach out with any question about your pieces.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-lg p-3 text-sm ${m.sender === 'customer' ? 'ml-auto bg-[var(--bone)]' : 'bg-[var(--paper)] border border-[var(--line)]'}`}>
            {m.body}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a message..." />
        <Button onClick={send} disabled={busy}>Send</Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
