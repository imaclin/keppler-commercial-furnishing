'use client';

import { useState } from 'react';
import { changePasswordAction } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  async function save() {
    if (busy) return;
    setMsg({});
    if (newPassword.length < 8) { setMsg({ err: 'New password must be at least 8 characters.' }); return; }
    if (newPassword !== confirm) { setMsg({ err: 'New passwords do not match.' }); return; }
    setBusy(true);
    const res = await changePasswordAction(currentPassword, newPassword);
    setBusy(false);
    if ('ok' in res) { setMsg({ ok: 'Password changed.' }); setCurrentPassword(''); setNewPassword(''); setConfirm(''); }
    else setMsg({ err: res.error });
  }

  return (
    <div className="max-w-md space-y-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <div className="space-y-1.5"><Label htmlFor="cur-pw">Current password</Label><Input id="cur-pw" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setMsg({}); }} /></div>
      <div className="space-y-1.5"><Label htmlFor="new-pw">New password</Label><Input id="new-pw" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setMsg({}); }} /></div>
      <div className="space-y-1.5"><Label htmlFor="confirm-pw">Confirm new password</Label><Input id="confirm-pw" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setMsg({}); }} /></div>
      {msg.err && <p className="text-sm text-red-600">{msg.err}</p>}
      {msg.ok && <p className="text-sm text-[var(--walnut)]">{msg.ok}</p>}
      <Button onClick={save} disabled={busy || !currentPassword || !newPassword || !confirm}>{busy ? 'Saving...' : 'Update password'}</Button>
    </div>
  );
}
