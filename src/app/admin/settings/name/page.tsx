import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { NameForm } from '@/components/admin/settings/NameForm';

export default async function SettingsNamePage() {
  const profile = await requireStaff();
  return (
    <main className="p-10">
      <div className="mb-4 flex items-center gap-3 text-xs">
        <Link href="/admin/settings" className="text-[var(--walnut)] hover:underline">Settings</Link>
        <span className="text-[var(--stone)]">/</span>
        <span className="text-[var(--stone)]">Name</span>
      </div>
      <h1 className="serif mb-1 text-3xl text-[var(--ink)]">Name</h1>
      <p className="mb-8 text-sm text-[var(--stone)]">Your name as it appears across the admin.</p>
      <NameForm name={profile.name} />
    </main>
  );
}
