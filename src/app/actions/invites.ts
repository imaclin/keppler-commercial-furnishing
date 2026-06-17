'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff, createSession } from '@/lib/auth';
import { createInvite, revokeInvite, redeemInvite } from '@/lib/staff';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateInviteResult = { token: string } | { error: string };

export async function createInviteAction(input: { email: string; role: 'staff' | 'admin' }): Promise<CreateInviteResult> {
  const profile = await requireStaff();
  const email = input.email.trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  await createInvite({ token, email: email || null, role: input.role, invitedBy: profile.id, expiresAt });
  revalidatePath('/admin/staff');
  return { token };
}

export async function revokeInviteAction(id: string): Promise<{ ok: true }> {
  await requireStaff();
  await revokeInvite(id);
  revalidatePath('/admin/staff');
  return { ok: true };
}

export type AcceptInviteResult = { error: string }; // success redirects, so only the error shape returns

export async function acceptInviteAction(token: string, input: { name: string; email: string; password: string }): Promise<AcceptInviteResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: 'Name is required.' };
  if (input.password.length < 8) return { error: 'Password must be at least 8 characters.' };

  let userId: string;
  try {
    userId = await redeemInvite(token, { name, email, password: input.password });
  } catch (e) {
    if (e instanceof Error && e.message === 'email_taken') return { error: 'An account with that email already exists. Try signing in instead.' };
    if (e instanceof Error && e.message === 'invalid_invite') return { error: 'This invite is no longer valid. Ask for a new one.' };
    return { error: 'Could not accept the invite. Please try again.' };
  }
  await createSession(userId);
  redirect('/admin');
}
