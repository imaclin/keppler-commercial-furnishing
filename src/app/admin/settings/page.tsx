import { requireStaff } from '@/lib/auth';
import { AccountSettings } from '@/components/admin/AccountSettings';

export default async function AdminSettingsPage() {
  const profile = await requireStaff();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Settings</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--stone)]">Manage your account and sign-in details.</p>
      <AccountSettings name={profile.name} email={profile.email} />
    </main>
  );
}
