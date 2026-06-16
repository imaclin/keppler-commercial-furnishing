import { requireCustomer } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default async function AccountPage() {
  const profile = await requireCustomer();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1040px] px-14 py-16">
        <h1 className="serif text-4xl">Welcome, {profile.name}.</h1>
        <p className="mt-3 text-[var(--stone)]">Your orders, quotes, and favorites will live here.</p>
        <form action="/auth/signout" method="post" className="mt-8">
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </main>
    </>
  );
}
