import { requireCustomer } from '@/lib/auth';
import { PortalSidebar } from '@/components/account/PortalSidebar';
import { AccountTopBar } from '@/components/account/AccountTopBar';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--cream)]">
      <PortalSidebar name={profile.name} />
      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <AccountTopBar />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
