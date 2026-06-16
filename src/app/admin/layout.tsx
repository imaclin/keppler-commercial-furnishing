import { requireStaff } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <AdminSidebar email={profile.email} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
