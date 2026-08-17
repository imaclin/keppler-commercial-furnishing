import Link from 'next/link';
import { getRedeemableInvite } from '@/lib/staff';
import { InviteAcceptForm } from '@/components/InviteAcceptForm';
import { Card } from '@/components/ui/card';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getRedeemableInvite(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="serif text-4xl font-semibold tracking-[0.2em] pl-[0.2em] text-[var(--espresso)] whitespace-nowrap">KEPPLER</span>
        </Link>
        <Card className="p-8">
          {invite ? (
            <>
              <h1 className="serif text-3xl text-[var(--ink)]">Join the team</h1>
              <div className="mt-6">
                <InviteAcceptForm token={token} presetEmail={invite.email} role={invite.role} />
              </div>
            </>
          ) : (
            <>
              <h1 className="serif text-3xl text-[var(--ink)]">Invite unavailable</h1>
              <p className="mt-3 text-sm text-[var(--stone)]">
                This invite link is invalid, has expired, or has already been used. Ask an administrator to send you a new one.
              </p>
              <Link href="/login" className="mt-6 inline-block text-sm text-[var(--walnut)] underline">Go to sign in</Link>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
