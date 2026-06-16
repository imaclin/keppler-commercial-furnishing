'use server';

import { listPublished } from '@/lib/catalog';
import type { StorefrontCard } from '@/lib/types';

export async function getCategoryProductsAction(
  category: 'table' | 'chair', woodId: string | undefined,
  sort: 'featured' | 'price_asc' | 'price_desc' | 'newest',
): Promise<StorefrontCard[]> {
  return listPublished(category, { woodId, sort });
}
