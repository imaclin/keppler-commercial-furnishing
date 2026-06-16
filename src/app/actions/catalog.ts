'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { createWood, createFinish, createCollection, listCollections } from '@/lib/catalog';
import { slugify } from '@/lib/format';

export async function addWoodAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const color = String(formData.get('swatch_color') ?? '').trim() || '#6b4f3a';
  if (name) await createWood(name, color);
  revalidatePath('/admin/woods');
}

export async function addFinishAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const color = String(formData.get('swatch_color') ?? '').trim() || '#6b4f3a';
  if (name) await createFinish(name, color);
  revalidatePath('/admin/woods');
}

export async function addCollectionAction(formData: FormData): Promise<void> {
  await requireStaff();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (name) await createCollection({ slug: slugify(name), name, description });
  revalidatePath('/admin/collections');
}
