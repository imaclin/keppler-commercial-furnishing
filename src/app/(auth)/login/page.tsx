'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="serif text-4xl font-semibold tracking-[0.2em] pl-[0.2em] text-[var(--espresso)] whitespace-nowrap">GS CHAIRS</span>
        </Link>
        <Card className="p-8">
          <h1 className="serif text-3xl">Sign in</h1>
          <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</Button>
          </form>
          <p className="mt-4 text-sm text-[var(--stone)]">New here? <Link href="/register" className="underline">Create an account</Link>.</p>
        </Card>
      </div>
    </main>
  );
}
