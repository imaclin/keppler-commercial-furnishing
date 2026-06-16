'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestSampleAction } from '@/app/actions/account';

export function SampleRequestForm({ productId, woodId, finishId }: { productId: string; woodId: string | null; finishId: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'done'>('idle');
  const [busy, setBusy] = useState(false);

  async function order() {
    if (busy) return;
    setBusy(true);
    const res = await requestSampleAction(productId, woodId, finishId);
    setBusy(false);
    if ('needsAuth' in res) { router.push('/login'); return; }
    if ('error' in res) { return; }
    if ('ok' in res) setState('done');
  }

  if (state === 'done') return <p className="mt-4 text-sm text-[var(--walnut)]">Sample on its way. Track it in your account.</p>;
  return (
    <button type="button" onClick={order} disabled={busy} className="mt-4 text-sm text-[var(--walnut)] underline disabled:opacity-50">
      Order a wood and finish sample . $5, credited to your order
    </button>
  );
}
