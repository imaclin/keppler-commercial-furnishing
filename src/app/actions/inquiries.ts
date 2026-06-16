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
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email.' };
  await createInquiry({ productId, name, email, message: data.message.trim() || null, configuration: data.configuration });
  return { ok: true };
}
