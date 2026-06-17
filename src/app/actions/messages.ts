'use server';

import { revalidatePath } from 'next/cache';
import { getProfile, requireStaff } from '@/lib/auth';
import { sendMessage, markRead } from '@/lib/messages';
import type { Attachment } from '@/lib/types';

// Defensively sanitize attachment metadata from the client: URLs must point at
// our own uploads dir; cap count and field lengths.
function cleanAttachments(input: Attachment[] | undefined): Attachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && typeof a.url === 'string' && a.url.startsWith('/uploads/'))
    .slice(0, 10)
    .map((a) => ({
      url: a.url,
      name: String(a.name ?? 'file').slice(0, 200),
      type: String(a.type ?? '').slice(0, 100),
      size: Number.isFinite(a.size) ? a.size : 0,
    }));
}

export async function sendCustomerMessageAction(body: string, attachments?: Attachment[]): Promise<{ ok: true } | { error: string }> {
  const profile = await getProfile();
  if (!profile) return { error: 'Please sign in.' };
  const text = body.trim();
  const files = cleanAttachments(attachments);
  if (!text && files.length === 0) return { error: 'Write a message or attach a file.' };
  await sendMessage(profile.id, 'customer', text.slice(0, 4000), files);
  revalidatePath('/account/messages');
  return { ok: true };
}

export async function sendStaffMessageAction(customerId: string, body: string, attachments?: Attachment[]): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const text = body.trim();
  const files = cleanAttachments(attachments);
  if (!text && files.length === 0) return { error: 'Write a message or attach a file.' };
  await sendMessage(customerId, 'staff', text.slice(0, 4000), files);
  revalidatePath(`/admin/messages/${customerId}`);
  return { ok: true };
}

export async function markCustomerReadAction(): Promise<void> {
  const profile = await getProfile();
  if (profile) await markRead(profile.id, 'customer');
}
