import { cookies } from 'next/headers';
import { requireStaff } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminCommandItems } from '@/lib/search';
import { attentionCounts } from '@/lib/analytics';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const [collapsedCookie, commandItems, attention] = await Promise.all([
    cookies(),
    adminCommandItems(),
    attentionCounts(),
  ]);
  const collapsed = collapsedCookie.get('hw_admin_nav')?.value === 'collapsed';
  return (
    <AdminShell email={profile.email} initialCollapsed={collapsed} commandItems={commandItems} attention={attention}>
      {children}
    </AdminShell>
  );
}
