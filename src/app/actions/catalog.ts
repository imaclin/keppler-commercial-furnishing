'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { createWood, createFinish, createCollection, createProduct, updateProduct, setProductCollection, type ProductInput } from '@/lib/catalog';
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
  const heroImageUrl = String(formData.get('hero_image_url') ?? '').trim() || null;
  if (name) await createCollection({ slug: slugify(name), name, description, heroImageUrl });
  revalidatePath('/admin/collections');
}

export async function setProductCollectionAction(productId: string, collectionId: string | null): Promise<void> {
  await requireStaff();
  await setProductCollection(productId, collectionId);
  revalidatePath('/admin/collections');
  if (collectionId) revalidatePath(`/admin/collections/${collectionId}`);
}

export type SaveProductState = { error: string } | null;

export async function saveProductAction(
  productId: string | null,
  input: ProductInput,
): Promise<SaveProductState> {
  await requireStaff();
  if (!input.name.trim()) return { error: 'Name is required.' };
  if (!input.slug.trim()) return { error: 'Slug is required.' };
  try {
    if (productId) await updateProduct(productId, input);
    else await createProduct(input);
  } catch (e) {
    // products.slug is unique; surface a friendly error instead of a 500.
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === '23505') {
      return { error: 'A product with that slug already exists. Choose a different name or slug.' };
    }
    throw e;
  }
  redirect('/admin/products');
}
