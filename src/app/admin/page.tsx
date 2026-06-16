import { requireStaff } from '@/lib/auth';

export default async function AdminPage() {
  const profile = await requireStaff();
  return (
    <main className="mx-auto max-w-[1040px] px-14 py-16">
      <h1 className="serif text-4xl">HW Admin</h1>
      <p className="mt-3 text-[var(--stone)]">Signed in as {profile.email} ({profile.role}). Catalog and order tools arrive in Phase 1.</p>
      <form action="/auth/signout" method="post" className="mt-8">
        <button type="submit" className="text-sm underline">Sign out</button>
      </form>
    </main>
  );
}
