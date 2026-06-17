'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { addStaffAction, setStaffRoleAction } from '@/app/actions/settings';
import type { StaffMember } from '@/lib/staff';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function StaffManager({ staff, currentUserId }: { staff: StaffMember[]; currentUserId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [addBusy, setAddBusy] = useState(false);

  async function changeRole(userId: string, next: 'staff' | 'admin') {
    setBusyId(userId); setError(null);
    const res = await setStaffRoleAction(userId, next);
    setBusyId(null);
    if ('error' in res) setError(res.error);
    else router.refresh();
  }

  async function addMember() {
    if (addBusy) return;
    setAddBusy(true); setError(null);
    const res = await addStaffAction({ name, email, password, role });
    setAddBusy(false);
    if ('ok' in res) {
      setName(''); setEmail(''); setPassword(''); setRole('staff'); setShowAdd(false);
      router.refresh();
    } else setError(res.error);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--stone)]">{staff.length} {staff.length === 1 ? 'person' : 'people'} with admin access.</p>
        <button onClick={() => setShowAdd((s) => !s)} className="flex items-center gap-1.5 bg-[var(--espresso)] px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-[#fffdfa]">
          <UserPlus className="h-3.5 w-3.5" /> Add staff
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showAdd && (
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Temp password</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 chars" /></div>
          <div className="space-y-1.5"><Label>Role</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'admin')} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
              <option value="staff">Staff</option><option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button onClick={addMember} disabled={addBusy || !name.trim() || !email.trim() || password.length < 8}>{addBusy ? 'Adding...' : 'Create staff member'}</Button>
          </div>
        </div>
      )}

      <table className="mt-6 w-full border-collapse text-sm">
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
  );
}
