'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, null);
  return (
    <main className="mx-auto max-w-md p-10">
      <Card className="p-8">
        <h1 className="serif text-3xl">Create an account</h1>
        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} /></div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Creating...' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--stone)]">Have an account? <Link href="/login" className="underline">Sign in</Link>.</p>
      </Card>
    </main>
  );
}
