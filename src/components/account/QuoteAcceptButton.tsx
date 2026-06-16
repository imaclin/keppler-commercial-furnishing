'use client';
import { useState } from 'react';
import { acceptQuoteAction } from '@/app/actions/quotes';
import { Button } from '@/components/ui/button';

export function QuoteAcceptButton({ quoteId }: { quoteId: string }) {
  const [busy, setBusy] = useState(false);
  return <Button disabled={busy} onClick={async () => { setBusy(true); await acceptQuoteAction(quoteId); }}>{busy ? 'Accepting...' : 'Accept quote'}</Button>;
}
