import Link from 'next/link';
import { ChevronRight, UserCircle, Mail, Lock } from 'lucide-react';
import { requireStaff } from '@/lib/auth';

export default async function AdminSettingsPage() {
  const profile = await requireStaff();

  const accountRows = [
    { icon: UserCircle, label: 'Name', value: profile.name, href: '/admin/settings/name' },
    { icon: Mail, label: 'Email', value: profile.email, href: '/admin/settings/email' },
  ];
  const securityRows = [
    { icon: Lock, label: 'Password', value: '••••••••', href: '/admin/settings/password' },
  ];

  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Settings</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--stone)]">Manage your account and sign-in details.</p>

      <div className="max-w-2xl space-y-8">
        <Section title="Account" rows={accountRows} />
        <Section title="Security" rows={securityRows} />
      </div>
    </main>
  );
}

function Section({
  title, rows,
}: {
  title: string;
  rows: { icon: React.ElementType; label: string; value: string; href: string }[];
}) {
  return (
    <section className="space-y-2">
      <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-[var(--stone)]">{title}</p>
      <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--bone)]/60">
            <Icon className="h-4 w-4 shrink-0 text-[var(--stone)]" />
            <span className="text-sm text-[var(--ink)]">{label}</span>
            <span className="ml-auto max-w-[200px] truncate text-sm text-[var(--stone)]">{value}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--stone)]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
