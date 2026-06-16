'use server';

import { revalidatePath } from 'next/cache';
import { getProfile, requireStaff } from '@/lib/auth';
import { sendMessage, markRead } from '@/lib/messages';

export async function sendCustomerMessageAction(body: string): Promise<{ ok: true } | { error: string }> {
  const profile = await getProfile();
  if (!profile) return { error: 'Please sign in.' };
  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  await sendMessage(profile.id, 'customer', text.slice(0, 4000));
  revalidatePath('/account/messages');
  return { ok: true };
}

export async function sendStaffMessageAction(customerId: string, body: string): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  await sendMessage(customerId, 'staff', text.slice(0, 4000));
  revalidatePath(`/admin/messages/${customerId}`);
  return { ok: true };
}

export async function markCustomerReadAction(): Promise<void> {
  const profile = await getProfile();
  if (profile) await markRead(profile.id, 'customer');
}
