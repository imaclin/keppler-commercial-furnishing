import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { EmailForm } from '@/components/admin/settings/EmailForm';

export default async function SettingsEmailPage() {
  const profile = await requireStaff();
  return (
    <main className="p-5 md:p-10">
      <div className="mb-4 flex items-center gap-3 text-xs">
        <Link href="/admin/settings" className="text-[var(--walnut)] hover:underline">Settings</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-[var(--stone)]">Email</span>
      </div>
      <h1 className="serif mb-1 text-3xl text-[var(--ink)]">Email</h1>
      <p className="mb-8 text-sm text-[var(--stone)]">Your sign-in email. Confirm changes with your current password.</p>
      <EmailForm email={profile.email} />
    </main>
  );
}
