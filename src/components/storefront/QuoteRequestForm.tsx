'use client';

import { useState } from 'react';
import { requestQuoteAction } from '@/app/actions/inquiries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function QuoteRequestForm({ productId, configuration }: { productId: string; configuration: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [message, setMessage] = useState('');

  if (!open) return <Button className="w-full" onClick={() => setOpen(true)}>Request a Quote</Button>;
  if (done) return <p className="text-sm text-[var(--ink)]">Thank you. Our team will be in touch within two business days.</p>;

  async function submit() {
    setBusy(true); setError(null);
    const res = await requestQuoteAction(productId, { name, email, message, configuration });
    setBusy(false);
    if (res && 'error' in res) setError(res.error);
    else setDone(true);
  }
  return (
    <div className="space-y-3 border border-[var(--line)] p-4">
      <p className="text-sm text-[var(--stone)]">Tell us how to reach you and we will send a quote for this configuration.</p>
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Textarea placeholder="Anything we should know? (optional)" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" onClick={submit} disabled={busy}>{busy ? 'Sending...' : 'Send request'}</Button>
    </div>
  );
}
