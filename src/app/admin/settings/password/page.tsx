import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { PasswordForm } from '@/components/admin/settings/PasswordForm';

export default async function SettingsPasswordPage() {
  await requireStaff();
  return (
    <main className="p-10">
      <div className="mb-4 flex items-center gap-3 text-xs">
        <Link href="/admin/settings" className="text-[var(--walnut)] hover:underline">Settings</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-[var(--stone)]">Password</span>
      </div>
      <h1 className="serif mb-1 text-3xl text-[var(--ink)]">Password</h1>
      <p className="mb-8 text-sm text-[var(--stone)]">Use at least 8 characters.</p>
      <PasswordForm />
    </main>
  );
}
