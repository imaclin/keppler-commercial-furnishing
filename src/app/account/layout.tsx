import { requireCustomer } from '@/lib/auth';
import { PortalSidebar } from '@/components/account/PortalSidebar';
import { AccountTopBar } from '@/components/account/AccountTopBar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <PortalSidebar name={profile.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AccountTopBar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
