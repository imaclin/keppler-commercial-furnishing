import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail } from 'lucide-react';
import { getStaffMember } from '@/lib/staff';

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getStaffMember(id);
  if (!member) notFound();

  return (
    <main className="p-10">
      <div className="mb-4 flex items-center gap-3 text-xs">
        <Link href="/admin/staff" className="text-[var(--walnut)] hover:underline">Staff</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-[var(--stone)]">{member.name}</span>
      </div>

      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--walnut)] text-2xl font-semibold text-[#fffdfa]">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="serif text-3xl text-[var(--ink)]">{member.name}</h1>
          <span className="mt-1 inline-block rounded-full bg-[var(--bone)] px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] capitalize text-[var(--walnut)]">{member.role}</span>
        </div>
      </div>

      <div className="mt-8 max-w-md divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Mail className="h-4 w-4 shrink-0 text-[var(--stone)]" />
          <span className="text-sm text-[var(--ink)]">Email</span>
          <span className="ml-auto text-sm text-[var(--stone)]">{member.email}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-sm text-[var(--ink)]">Joined</span>
          <span className="ml-auto text-sm text-[var(--stone)]">
            {new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--stone)]">Manage roles and invites from the <Link href="/admin/staff" className="text-[var(--walnut)] underline">Staff</Link> page.</p>
    </main>
  );
}
