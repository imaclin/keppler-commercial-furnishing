'use server';

import { createInquiry } from '@/lib/inquiries';

export type InquiryState = { ok: true } | { error: string } | null;

export async function requestQuoteAction(
  productId: string | null,
  data: { name: string; email: string; message: string; configuration: Record<string, unknown> | null },
): Promise<InquiryState> {
  const name = data.name.trim();
  const email = data.email.trim();
  if (!name || !email) return { error: 'Name and email are required.' };
  if (name.length > 200) return { error: 'That name is too long.' };
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email.' };
  const message = data.message.trim().slice(0, 4000) || null;
  try {
    await createInquiry({ productId, name, email, message, configuration: data.configuration });
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
  return { ok: true };
}
