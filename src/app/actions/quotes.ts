'use server';

import { redirect } from 'next/navigation';
import { getProfile, requireCustomer, requireStaff } from '@/lib/auth';
import { createQuoteFromConfig, createQuoteFromItems, acceptQuote, priceAndSendQuote, type CartQuoteItem } from '@/lib/quotes';
import { queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/notify';

export type SubmitCartResult = { quoteId: string } | { needsAuth: true } | { error: string };

// Submit a cart of configured items as a single quote request (no payment).
export async function submitQuoteRequestAction(items: CartQuoteItem[]): Promise<SubmitCartResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  if (!Array.isArray(items) || items.length === 0) return { error: 'Your cart is empty.' };
  const clean: CartQuoteItem[] = items.slice(0, 50).map((it) => ({
    productId: typeof it.productId === 'string' ? it.productId : null,
    title: String(it.title ?? 'Custom piece').slice(0, 200),
    woodName: it.woodName ? String(it.woodName).slice(0, 80) : null,
    finishName: it.finishName ? String(it.finishName).slice(0, 80) : null,
    sizeLabel: it.sizeLabel ? String(it.sizeLabel).slice(0, 80) : null,
    unitPriceCents: Number.isFinite(it.unitPriceCents) && it.unitPriceCents >= 0 ? Math.round(it.unitPriceCents) : 0,
    quantity: Number.isFinite(it.quantity) && it.quantity > 0 ? Math.min(99, Math.floor(it.quantity)) : 1,
    configuration: it.configuration ?? null,
  }));
  try {
    const quoteId = await createQuoteFromItems(profile.id, clean);
    return { quoteId };
  } catch {
    return { error: 'Could not submit your request. Please try again.' };
  }
}

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
  quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null, paymentLinkUrl: string | null = null,
): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  const link = paymentLinkUrl?.trim() || null;
  if (link && !/^https?:\/\//i.test(link)) return { error: 'Payment link must be a valid URL.' };
  try {
    await priceAndSendQuote(quoteId, prices, validUntil, notes, link);
    const row = await queryOne<{ email: string }>(
      'select u.email from quotes q join users u on u.id = q.customer_id where q.id = $1', [quoteId]);
    if (row) {
      const body = link
        ? `Your GS Chairs invoice is ready. View it and pay securely from your account: pay link ${link}`
        : 'Your GS Chairs invoice is ready. View it in your account.';
      await sendEmail(row.email, 'Your GS Chairs invoice is ready', body);
    }
  } catch {
    return { error: 'Could not send the invoice.' };
  }
  return { ok: true };
}
