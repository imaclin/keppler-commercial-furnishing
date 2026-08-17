'use client';

import { useState } from 'react';
import { acceptInviteAction } from '@/app/actions/invites';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function InviteAcceptForm({ token, presetEmail, role }: { token: string; presetEmail: string | null; role: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(presetEmail ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setError(null);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    const res = await acceptInviteAction(token, { name, email, password });
    // Success redirects server-side; only an error returns here.
    setBusy(false);
    if (res && 'error' in res) setError(res.error);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--stone)]">You&rsquo;ve been invited to join the Keppler team as <span className="font-medium capitalize text-[var(--ink)]">{role}</span>. Set up your account to continue.</p>
      <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} /></div>
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} disabled={!!presetEmail} onChange={(e) => { setEmail(e.target.value); setError(null); }} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={submit} disabled={busy || !name.trim() || !email.trim() || password.length < 8} className="w-full">
        {busy ? 'Setting up...' : 'Accept invite'}
      </Button>
    </div>
  );
}
