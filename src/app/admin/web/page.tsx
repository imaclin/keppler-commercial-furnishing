import { requireStaff } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { WebDetailsForm } from '@/components/admin/WebDetailsForm';

export default async function WebDetailsPage() {
  await requireStaff();
  const settings = await getSiteSettings();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Web Details</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--stone)]">SEO metadata and company information for the public site.</p>
      <WebDetailsForm settings={settings} />
    </main>
  );
}
