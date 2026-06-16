'use server';

import { revalidatePath } from 'next/cache';
import { getProfile, requireCustomer } from '@/lib/auth';
import { toggleFavorite, createSampleRequest, updateProfileName } from '@/lib/account';

export type FavoriteResult = { favorited: boolean } | { needsAuth: true } | { error: string };

export async function toggleFavoriteAction(productId: string): Promise<FavoriteResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  try {
    const favorited = await toggleFavorite(profile.id, productId);
    return { favorited };
  } catch {
    return { error: 'Could not update favorites. Please try again.' };
  }
}

export type SampleResult = { ok: true } | { needsAuth: true } | { error: string };

export async function requestSampleAction(
  productId: string | null, woodId: string | null, finishId: string | null,
): Promise<SampleResult> {
  const profile = await getProfile();
  if (!profile) return { needsAuth: true };
  try {
    await createSampleRequest({ userId: profile.id, productId, woodId, finishId });
  } catch {
    return { error: 'Could not place the sample request. Please try again.' };
  }
  return { ok: true };
}

export async function updateProfileNameAction(formData: FormData): Promise<void> {
  const profile = await requireCustomer();
  const name = String(formData.get('name') ?? '').trim();
  if (name) {
    await updateProfileName(profile.id, name);
    revalidatePath('/account', 'layout');
  }
}
