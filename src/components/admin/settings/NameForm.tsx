'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAccountNameAction } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function NameForm({ name: initial }: { name: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  async function save() {
    if (busy) return;
    setBusy(true); setMsg({});
    const res = await updateAccountNameAction(name);
    setBusy(false);
    if ('ok' in res) { setMsg({ ok: 'Saved.' }); router.refresh(); }
    else setMsg({ err: res.error });
  }

  return (
    <div className="max-w-md space-y-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setMsg({}); }} /></div>
      {msg.err && <p className="text-sm text-red-600">{msg.err}</p>}
      {msg.ok && <p className="text-sm text-[var(--walnut)]">{msg.ok}</p>}
      <Button onClick={save} disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save'}</Button>
    </div>
  );
}
