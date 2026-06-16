'use server';

import { revalidatePath } from 'next/cache';
import { queryOne } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { advanceOrderStatus, setEstDelivery } from '@/lib/orders';
import { sendEmail } from '@/lib/notify';
import type { OrderStatus } from '@/lib/types';

export async function advanceOrderAction(orderId: string, status: OrderStatus, note: string): Promise<{ ok: true } | { error: string }> {
  await requireStaff();
  try {
    await advanceOrderStatus(orderId, status, note.trim() || null);
  } catch {
    return { error: 'That status change is not allowed.' };
  }
  const row = await queryOne<{ email: string }>(
    'select u.email from orders o join users u on u.id = o.customer_id where o.id = $1', [orderId]);
  if (row) await sendEmail(row.email, `Your HW order is now ${status.replace('_', ' ')}`, `Your order status changed to ${status}.`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function setEstDeliveryAction(orderId: string, date: string): Promise<void> {
  await requireStaff();
  await setEstDelivery(orderId, date || null);
  revalidatePath(`/admin/orders/${orderId}`);
}
