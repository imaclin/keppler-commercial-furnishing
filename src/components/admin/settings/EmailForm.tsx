'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeEmailAction } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function EmailForm({ email: initial }: { email: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initial);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  async function save() {
    if (busy) return;
    setBusy(true); setMsg({});
    const res = await changeEmailAction(currentPassword, newEmail);
    setBusy(false);
    if ('ok' in res) {
      setEmail(newEmail.trim().toLowerCase());
      setNewEmail(''); setCurrentPassword('');
      setMsg({ ok: 'Email updated.' });
      router.refresh();
    } else setMsg({ err: res.error });
  }

  return (
    <div className="max-w-md space-y-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <p className="text-sm text-[var(--stone)]">Current: <span className="font-medium text-[var(--ink)]">{email}</span></p>
      <div className="space-y-1.5"><Label htmlFor="new-email">New email</Label><Input id="new-email" type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setMsg({}); }} /></div>
      <div className="space-y-1.5"><Label htmlFor="email-pw">Current password</Label><Input id="email-pw" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setMsg({}); }} /></div>
      {msg.err && <p className="text-sm text-red-600">{msg.err}</p>}
      {msg.ok && <p className="text-sm text-[var(--walnut)]">{msg.ok}</p>}
      <Button onClick={save} disabled={busy || !newEmail.trim() || !currentPassword}>{busy ? 'Updating...' : 'Update email'}</Button>
    </div>
  );
}
