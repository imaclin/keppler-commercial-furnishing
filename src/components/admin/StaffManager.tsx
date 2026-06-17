'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Link2, Check, X } from 'lucide-react';
import { setStaffRoleAction } from '@/app/actions/settings';
import { createInviteAction, revokeInviteAction } from '@/app/actions/invites';
import type { StaffMember, StaffInvite } from '@/lib/staff';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function inviteLink(token: string): string {
  if (typeof window === 'undefined') return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

export function StaffManager({ staff, invites, currentUserId }: { staff: StaffMember[]; invites: StaffInvite[]; currentUserId: string }) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function sendInvite() {
    if (inviteBusy) return;
    setInviteBusy(true); setError(null); setCreatedLink(null);
    const res = await createInviteAction({ email, role });
    setInviteBusy(false);
    if ('token' in res) {
      setCreatedLink(inviteLink(res.token));
      setEmail('');
      router.refresh();
    } else setError(res.error);
  }

  async function copy(link: string) {
    try { await navigator.clipboard.writeText(link); setCopied(link); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
  }

  async function revoke(id: string) {
    setBusyId(id); setError(null);
    await revokeInviteAction(id);
    setBusyId(null);
    router.refresh();
  }

  async function changeRole(userId: string, next: 'staff' | 'admin') {
    setBusyId(userId); setError(null);
    const res = await setStaffRoleAction(userId, next);
    setBusyId(null);
    if ('error' in res) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--stone)]">{staff.length} {staff.length === 1 ? 'person' : 'people'} with admin access.</p>
          <button onClick={() => { setShowInvite((s) => !s); setCreatedLink(null); }} className="flex items-center gap-1.5 bg-[var(--espresso)] px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-[#fffdfa]">
            <UserPlus className="h-3.5 w-3.5" /> Invite team member
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {showInvite && (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
              <div className="space-y-1.5"><Label>Email <span className="text-[var(--stone)]">(optional)</span></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></div>
              <div className="space-y-1.5"><Label>Role</Label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'admin')} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
                  <option value="staff">Staff</option><option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={sendInvite} disabled={inviteBusy}>{inviteBusy ? 'Creating...' : 'Create invite'}</Button>
            </div>
            <p className="mt-2 text-xs text-[var(--stone)]">Leave the email blank to create a link anyone can use once. Invites expire in 7 days.</p>

            {createdLink && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--walnut)]/40 bg-[var(--bone)] p-3">
                <Link2 className="h-4 w-4 shrink-0 text-[var(--walnut)]" />
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{createdLink}</span>
                <button onClick={() => copy(createdLink)} className="flex shrink-0 items-center gap-1 rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-xs">
                  {copied === createdLink ? <><Check className="h-3 w-3" /> Copied</> : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div>
          <div className="eyebrow mb-2">Pending invites ({invites.length})</div>
          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--ink)]">{inv.email ?? 'Anyone with the link'}</div>
                  <div className="text-xs text-[var(--stone)]">
                    <span className="capitalize">{inv.role}</span>{inv.expires_at && <> · expires {formatDate(inv.expires_at)}</>}
                  </div>
                </div>
                <button onClick={() => copy(inviteLink(inv.token))} className="flex shrink-0 items-center gap-1 rounded border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink)]">
                  {copied === inviteLink(inv.token) ? <><Check className="h-3 w-3" /> Copied</> : <><Link2 className="h-3 w-3" /> Copy link</>}
                </button>
                <button onClick={() => revoke(inv.id)} disabled={busyId === inv.id} className="flex shrink-0 items-center gap-1 rounded border border-[var(--line)] px-2 py-1 text-xs text-red-600 disabled:opacity-50">
                  <X className="h-3 w-3" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="eyebrow mb-2">Team</div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--espresso)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--stone)]">
              <th className="py-3">Name</th><th>Email</th><th>Joined</th><th className="text-right">Role</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-[var(--line)]">
                <td className="py-3 font-medium text-[var(--ink)]">
                  {s.name}{s.id === currentUserId && <span className="ml-2 text-[11px] text-[var(--stone)]">(you)</span>}
                </td>
                <td className="text-[var(--stone)]">{s.email}</td>
                <td className="text-[var(--stone)]">{formatDate(s.created_at)}</td>
                <td className="py-3 text-right">
                  <select
                    value={s.role === 'admin' ? 'admin' : 'staff'}
                    disabled={busyId === s.id}
                    onChange={(e) => changeRole(s.id, e.target.value as 'staff' | 'admin')}
                    className="h-8 border border-[var(--line)] bg-[var(--paper)] px-2 text-xs capitalize disabled:opacity-50"
                  >
                    <option value="staff">Staff</option><option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
