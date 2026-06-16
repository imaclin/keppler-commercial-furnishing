import { requireCustomer } from '@/lib/auth';
import { PortalSidebar } from '@/components/account/PortalSidebar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <PortalSidebar name={profile.name} />
      <div className="flex-1">
        <div className="flex items-center justify-end border-b border-[var(--line)] bg-[var(--paper)] px-10 py-4">
          <form action="/auth/signout" method="post"><button type="submit" className="text-xs uppercase tracking-[0.12em] text-[var(--ink)]">Sign out</button></form>
        </div>
        {children}
      </div>
    </div>
  );
}
