import { cookies } from 'next/headers';
import { requireStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminCommandItems } from '@/lib/search';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const [collapsedCookie, commandItems] = await Promise.all([
    cookies(),
    adminCommandItems(),
  ]);
  const collapsed = collapsedCookie.get('hw_admin_nav')?.value === 'collapsed';
  return (
    <AdminShell email={profile.email} initialCollapsed={collapsed} commandItems={commandItems}>
      {children}
    </AdminShell>
  );
}
