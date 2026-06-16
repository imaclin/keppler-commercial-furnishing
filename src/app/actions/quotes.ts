'use server';

import { redirect } from 'next/navigation';
import { getProfile, requireCustomer, requireStaff } from '@/lib/auth';
import { createQuoteFromConfig, acceptQuote, priceAndSendQuote } from '@/lib/quotes';
import { queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/notify';

export type RequestQuoteResult = { quoteId: string } | { needsAuth: true } | { error: string };

export async function requestQuoteForConfigAction(item: {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; configuration: Record<string, unknown> | null;
}): Promise<RequestQuoteResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  try {
    const quoteId = await createQuoteFromConfig(profile.id, item);
    return { quoteId };
  } catch {
    return { error: 'Could not request a quote. Please try again.' };
  }
}

export async function acceptQuoteAction(quoteId: string): Promise<void> {
  const profile = await requireCustomer();
  const orderId = await acceptQuote(quoteId, profile.id);
  if (orderId) redirect(`/account/orders/${orderId}`);
  redirect('/account/quotes');
}

export async function sendQuoteAction(
  quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null,
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  try {
    await priceAndSendQuote(quoteId, prices, validUntil, notes);
    const row = await queryOne<{ email: string }>(
      'select u.email from quotes q join users u on u.id = q.customer_id where q.id = $1', [quoteId]);
    if (row) await sendEmail(row.email, 'Your HW quote is ready', 'Your quote has been priced and sent. View it in your account.');
  } catch {
    return { error: 'Could not send the quote.' };
  }
  return { ok: true };
}
