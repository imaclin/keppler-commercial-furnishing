import { cookies } from 'next/headers';
import { requireStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const collapsed = (await cookies()).get('hw_admin_nav')?.value === 'collapsed';
  return <AdminShell email={profile.email} initialCollapsed={collapsed}>{children}</AdminShell>;
}
