'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Mail, Lock } from 'lucide-react';
import { updateAccountNameAction, changeEmailAction, changePasswordAction } from '@/app/actions/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bone)] text-[var(--walnut)]">{icon}</span>
        <div>
          <h2 className="font-medium text-[var(--ink)]">{title}</h2>
          <p className="text-xs text-[var(--stone)]">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Note({ msg }: { msg: { ok?: string; err?: string } }) {
  if (msg.err) return <p className="text-sm text-red-600">{msg.err}</p>;
  if (msg.ok) return <p className="text-sm text-[var(--walnut)]">{msg.ok}</p>;
  return null;
}

export function AccountSettings({ name: initialName, email: initialEmail }: { name: string; email: string }) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<{ ok?: string; err?: string }>({});
  const [nameBusy, setNameBusy] = useState(false);

  const [curEmailPw, setCurEmailPw] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ ok?: string; err?: string }>({});
  const [emailBusy, setEmailBusy] = useState(false);
  const [email, setEmail] = useState(initialEmail);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok?: string; err?: string }>({});
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName() {
    if (nameBusy) return;
    setNameBusy(true); setNameMsg({});
    const res = await updateAccountNameAction(name);
    setNameBusy(false);
    if ('ok' in res) { setNameMsg({ ok: 'Saved.' }); router.refresh(); }
    else setNameMsg({ err: res.error });
  }

  async function saveEmail() {
    if (emailBusy) return;
    setEmailBusy(true); setEmailMsg({});
    const res = await changeEmailAction(curEmailPw, newEmail);
    setEmailBusy(false);
    if ('ok' in res) {
      setEmail(newEmail.trim().toLowerCase());
      setEmailMsg({ ok: 'Email updated.' });
      setNewEmail(''); setCurEmailPw('');
      router.refresh();
    } else setEmailMsg({ err: res.error });
  }

  async function savePassword() {
    if (pwBusy) return;
    setPwMsg({});
    if (newPw.length < 8) { setPwMsg({ err: 'New password must be at least 8 characters.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ err: 'New passwords do not match.' }); return; }
    setPwBusy(true);
    const res = await changePasswordAction(curPw, newPw);
    setPwBusy(false);
    if ('ok' in res) { setPwMsg({ ok: 'Password changed.' }); setCurPw(''); setNewPw(''); setConfirmPw(''); }
    else setPwMsg({ err: res.error });
  }

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
      <Section icon={<UserCircle className="h-5 w-5" />} title="Profile" desc="Your name as it appears across the admin.">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setNameMsg({}); }} /></div>
          <Note msg={nameMsg} />
          <Button onClick={saveName} disabled={nameBusy || !name.trim()}>{nameBusy ? 'Saving...' : 'Save profile'}</Button>
        </div>
      </Section>

      <Section icon={<Mail className="h-5 w-5" />} title="Email" desc="Sign-in email. Confirm with your current password.">
        <div className="space-y-3">
          <p className="text-sm text-[var(--stone)]">Current: <span className="font-medium text-[var(--ink)]">{email}</span></p>
          <div className="space-y-1.5"><Label htmlFor="new-email">New email</Label><Input id="new-email" type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailMsg({}); }} /></div>
          <div className="space-y-1.5"><Label htmlFor="email-pw">Current password</Label><Input id="email-pw" type="password" autoComplete="current-password" value={curEmailPw} onChange={(e) => { setCurEmailPw(e.target.value); setEmailMsg({}); }} /></div>
          <Note msg={emailMsg} />
          <Button onClick={saveEmail} disabled={emailBusy || !newEmail.trim() || !curEmailPw}>{emailBusy ? 'Updating...' : 'Update email'}</Button>
        </div>
      </Section>

      <Section icon={<Lock className="h-5 w-5" />} title="Password" desc="Use at least 8 characters.">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="cur-pw">Current password</Label><Input id="cur-pw" type="password" autoComplete="current-password" value={curPw} onChange={(e) => { setCurPw(e.target.value); setPwMsg({}); }} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-pw">New password</Label><Input id="new-pw" type="password" autoComplete="new-password" minLength={8} value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwMsg({}); }} /></div>
          <div className="space-y-1.5"><Label htmlFor="confirm-pw">Confirm new password</Label><Input id="confirm-pw" type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwMsg({}); }} /></div>
          <Note msg={pwMsg} />
          <Button onClick={savePassword} disabled={pwBusy || !curPw || !newPw || !confirmPw}>{pwBusy ? 'Saving...' : 'Update password'}</Button>
        </div>
      </Section>
    </div>
  );
}
