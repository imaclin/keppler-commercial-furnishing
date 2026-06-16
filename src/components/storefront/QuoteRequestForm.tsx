'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestQuoteAction } from '@/app/actions/inquiries';
import { requestQuoteForConfigAction } from '@/app/actions/quotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type QuoteItem = {
  productId: string | null;
  title: string;
  woodName: string | null;
  finishName: string | null;
  sizeLabel: string | null;
  unitPriceCents: number;
  configuration: Record<string, unknown> | null;
};

export function QuoteRequestForm({
  productId,
  configuration,
  isLoggedIn = false,
  quoteItem,
}: {
  productId: string;
  configuration: Record<string, unknown>;
  isLoggedIn?: boolean;
  quoteItem?: QuoteItem;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  if (!open) return <Button className="w-full" onClick={() => setOpen(true)}>Request a Quote</Button>;

  // Logged-in path: one-click real quote request
  if (isLoggedIn && quoteItem) {
    if (quoteId) {
      return (
        <div className="border border-[var(--line)] p-4">
          <p className="text-sm text-[var(--ink)]">Quote requested. We will price it and send it to your account.</p>
          <Link href="/account/quotes" className="mt-2 block text-sm text-[var(--walnut)] underline">View your quotes</Link>
        </div>
      );
    }
    async function requestLoggedIn() {
      if (busy || !quoteItem) return;
      setBusy(true);
      setError(null);
      const res = await requestQuoteForConfigAction(quoteItem);
      setBusy(false);
      if ('quoteId' in res) {
        setQuoteId(res.quoteId);
      } else if ('needsAuth' in res) {
        setError('Please sign in to request a quote.');
      } else {
        setError(res.error);
      }
    }
    return (
      <div className="space-y-3 border border-[var(--line)] p-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" onClick={requestLoggedIn} disabled={busy}>{busy ? 'Requesting...' : 'Send quote request'}</Button>
      </div>
    );
  }

  // Guest path: inquiry form (name/email/message)
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
