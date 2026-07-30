'use server';

import { listPublished } from '@/lib/catalog';
import type { ProductCategory, StorefrontCard } from '@/lib/types';

export async function getCategoryProductsAction(
  category: ProductCategory, woodId: string | undefined,
  sort: 'featured' | 'price_asc' | 'price_desc' | 'newest',
): Promise<StorefrontCard[]> {
  return listPublished(category, { woodId, sort });
}
