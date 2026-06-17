import { requireCustomer } from '@/lib/auth';
import { AccountShell } from '@/components/account/AccountShell';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  return <AccountShell name={profile.name}>{children}</AccountShell>;
}
