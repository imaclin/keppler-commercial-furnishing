import { requireStaff } from '@/lib/auth';
import { listStaff, listPendingInvites } from '@/lib/staff';
import { StaffManager } from '@/components/admin/StaffManager';

export default async function StaffPage() {
  const [profile, staff, invites] = await Promise.all([requireStaff(), listStaff(), listPendingInvites()]);
  return (
    <main className="p-5 md:p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Staff</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--stone)]">Everyone with access to the GS Chairs admin, their role, and details.</p>
      <StaffManager staff={staff} invites={invites} currentUserId={profile.id} />
    </main>
  );
}
